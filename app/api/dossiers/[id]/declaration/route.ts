// app/api/dossiers/[id]/declaration/route.ts — Liste + création de DS

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { buildDeclarationDraft } from "@/lib/declaration";

export const runtime = "nodejs";

interface DeclarationRow {
  id: string;
  dossier_id: string;
  statut: "draft" | "submitted" | "acknowledged" | "closed";
  faits: string;
  ermes_ref: string | null;
  ermes_note: string | null;
  content_hash: string | null;
  submitted_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = (await sql`
    SELECT id, dossier_id, statut, faits, ermes_ref, ermes_note, content_hash,
           submitted_at, acknowledged_at, created_at, updated_at
    FROM declarations_soupcon
    WHERE dossier_id = ${id}
    ORDER BY created_at DESC
  `) as unknown as DeclarationRow[];

  return NextResponse.json({ declarations: rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dossier = await findScopedDossier<{ id: string; niveau: string | null; archived_at: string | null }>(
    id, scope, "id, niveau, archived_at",
  );
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) {
    return NextResponse.json({ error: "Dossier archivé" }, { status: 409 });
  }

  // Construit le brouillon depuis le dossier + KYC + screening
  const draft = await buildDeclarationDraft(id);
  if (!draft) return NextResponse.json({ error: "Impossible de construire le brouillon" }, { status: 500 });

  const inserted = (await sql`
    INSERT INTO declarations_soupcon (
      dossier_id, user_id, org_id,
      statut, faits, indices_detectes, pieces_jointes
    ) VALUES (
      ${id}, ${scope.userId}, ${scope.orgId},
      'draft',
      ${draft.expose},
      ${JSON.stringify(draft.indices)}::jsonb,
      ${JSON.stringify(draft.pieces)}::jsonb
    )
    RETURNING id, created_at
  `) as unknown as Array<{ id: string; created_at: string }>;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "declaration.create",
    metadata: {
      declaration_id: inserted[0].id,
      niveau: dossier.niveau,
      indices_count: draft.indices.length,
      pieces_count: draft.pieces.length,
    },
    req,
  });

  return NextResponse.json({
    id: inserted[0].id,
    createdAt: inserted[0].created_at,
    draft,
  }, { status: 201 });
}
