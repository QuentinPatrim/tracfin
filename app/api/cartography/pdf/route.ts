// app/api/cartography/pdf/route.ts — Export PDF de la cartographie L.561-4-1
//
// GET → PDF horodaté, hash SHA-256 inclus. Document à présenter en contrôle DGCCRF.

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { getScope } from "@/lib/scope";
import { computeCartography } from "@/lib/cartography";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildCartographyHtml } from "@/app/pdf-render/cartography-template";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const monthsParam = Number(url.searchParams.get("months") ?? 12);
  const months = Number.isFinite(monthsParam) ? Math.min(Math.max(monthsParam, 1), 60) : 12;

  // Données + métadonnées d'émission
  const carto = await computeCartography(scope, months);
  const generatedAt = new Date().toISOString();

  // Émetteur affiché : nom + email du user qui exporte (utile au contrôleur).
  const user = await currentUser();
  const emetteur = user
    ? `${user.fullName ?? user.firstName ?? "—"} (${user.emailAddresses?.[0]?.emailAddress ?? "—"})`
    : "Utilisateur Klaris";

  // Label du périmètre : nom de l'org si en contexte org, sinon "Espace personnel"
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

  // Hash du contenu (preuve d'intégrité — la même donnée éditée à 5 min d'écart
  // produit le même hash sémantique → reproductibilité).
  const hashPayload = JSON.stringify({
    carto,
    scopeLabel,
    emetteur,
    // generatedAt n'est PAS dans le hash : c'est la métadonnée d'émission, pas le contenu.
  });
  const hash = createHash("sha256").update(hashPayload).digest("hex");

  const html = buildCartographyHtml({ carto, generatedAt, hash, emetteur, scopeLabel });

  try {
    const buffer = await renderHtmlPdf(html);

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: null,
      action: "cartography.export",
      metadata: {
        months,
        total_active: carto.totalActive,
        total_archived: carto.totalArchived,
        hash,
      },
      req,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cartographie-risques-klaris-${generatedAt.slice(0, 10)}.pdf"`,
        "Cache-Control": "no-store",
        "X-Klaris-Cartography-SHA256": hash,
      },
    });
  } catch (e) {
    console.error("Cartography PDF render error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération PDF" },
      { status: 500 },
    );
  }
}
