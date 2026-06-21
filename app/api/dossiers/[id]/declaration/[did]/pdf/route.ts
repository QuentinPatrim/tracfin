// app/api/dossiers/[id]/declaration/[did]/pdf/route.ts — PDF d'une DS

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { buildDeclarationDraft } from "@/lib/declaration";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildDeclarationHtml } from "@/app/pdf-render/declaration-template";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface DeclarationRow {
  id: string;
  dossier_id: string;
  statut: string;
  faits: string;
  ermes_ref: string | null;
  content_hash: string | null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string; did: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, did } = await params;

  // Ownership : le dossier appartient au scope
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // La déclaration appartient au dossier
  const rows = (await sql`
    SELECT id, dossier_id, statut, faits, ermes_ref, content_hash
    FROM declarations_soupcon
    WHERE id = ${did} AND dossier_id = ${id}
    LIMIT 1
  `) as unknown as DeclarationRow[];
  if (rows.length === 0) return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
  const declaration = rows[0];

  // Données fraîches : pré-remplissage actuel (snapshot complet pour le PDF)
  const draft = await buildDeclarationDraft(id);
  if (!draft) return NextResponse.json({ error: "Impossible de construire le brouillon" }, { status: 500 });

  // Émetteur (déclarant désigné) — name + email du user qui exporte
  const user = await currentUser();
  const declarant = user
    ? `${user.fullName ?? user.firstName ?? "—"} (${user.emailAddresses?.[0]?.emailAddress ?? "—"})`
    : "Utilisateur Klaris";

  let scopeLabel = "Espace personnel";
  if (scope.orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: scope.orgId });
      scopeLabel = `Organisation : ${org.name}`;
    } catch {
      scopeLabel = `Organisation ${scope.orgId.slice(-8)}`;
    }
  }

  const generatedAt = new Date().toISOString();
  const hashPayload = JSON.stringify({
    declarationId: did,
    faits: declaration.faits,
    draft,
    scopeLabel,
  });
  const hash = createHash("sha256").update(hashPayload).digest("hex");

  // Persiste le content_hash sur la déclaration au moment de l'export
  // (preuve d'intégrité : même contenu → même hash)
  await sql`
    UPDATE declarations_soupcon
    SET content_hash = ${hash}, updated_at = NOW()
    WHERE id = ${did}
  `;

  const html = buildDeclarationHtml({
    draft,
    faits: declaration.faits,
    declarationId: did,
    generatedAt,
    hash,
    declarant,
    scopeLabel,
    ermesRef: declaration.ermes_ref,
  });

  try {
    const buffer = await renderHtmlPdf(html);

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "declaration.submit",
      metadata: { declaration_id: did, content_hash: hash, format: "pdf" },
      req,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="declaration-soupcon-${id.slice(0, 8)}-${did.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
        "X-Klaris-Declaration-SHA256": hash,
      },
    });
  } catch (e) {
    console.error("Declaration PDF render error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération PDF" },
      { status: 500 },
    );
  }
}
