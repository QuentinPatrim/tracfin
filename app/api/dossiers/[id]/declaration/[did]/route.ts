// app/api/dossiers/[id]/declaration/[did]/route.ts — GET/PATCH d'une DS spécifique

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { enqueueOutboundEvent } from "@/lib/outbound";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string; did: string }> };

interface DeclarationRow {
  id: string;
  dossier_id: string;
  statut: "draft" | "submitted" | "acknowledged" | "closed";
  faits: string;
  indices_detectes: unknown;
  pieces_jointes: unknown;
  ermes_ref: string | null;
  ermes_note: string | null;
  content_hash: string | null;
  submitted_at: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

async function loadScopedDeclaration(
  dossierId: string,
  declarationId: string,
  scope: NonNullable<Awaited<ReturnType<typeof getScope>>>,
): Promise<DeclarationRow | null> {
  // Vérifie ownership via le dossier (scope-aware)
  const d = await findScopedDossier<{ id: string }>(dossierId, scope, "id");
  if (!d) return null;

  const rows = (await sql`
    SELECT id, dossier_id, statut, faits, indices_detectes, pieces_jointes,
           ermes_ref, ermes_note, content_hash, submitted_at, acknowledged_at,
           created_at, updated_at
    FROM declarations_soupcon
    WHERE id = ${declarationId} AND dossier_id = ${dossierId}
    LIMIT 1
  `) as unknown as DeclarationRow[];

  return rows[0] ?? null;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, did } = await params;
  const declaration = await loadScopedDeclaration(id, did, scope);
  if (!declaration) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(declaration);
}

// ─── Transitions de statut autorisées ─────────────────────────────────
// draft         → submitted | closed
// submitted     → acknowledged | closed   (acknowledge requires ermesRef)
// acknowledged  → closed
// closed        → (terminal — pas de retour arrière côté UI)
const ALLOWED_TRANSITIONS: Record<DeclarationRow["statut"], DeclarationRow["statut"][]> = {
  draft: ["submitted", "closed"],
  submitted: ["acknowledged", "closed"],
  acknowledged: ["closed"],
  closed: [],
};

interface PatchBody {
  faits?: string;
  ermesRef?: string;
  ermesNote?: string;
  statut?: DeclarationRow["statut"];
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, did } = await params;
  const existing = await loadScopedDeclaration(id, did, scope);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Validations de transition
  const targetStatut = body.statut ?? existing.statut;
  if (targetStatut !== existing.statut) {
    const allowed = ALLOWED_TRANSITIONS[existing.statut];
    if (!allowed.includes(targetStatut)) {
      return NextResponse.json(
        { error: `Transition ${existing.statut} → ${targetStatut} non autorisée`, allowed },
        { status: 400 },
      );
    }
    if (targetStatut === "acknowledged" && !(body.ermesRef ?? existing.ermes_ref)) {
      return NextResponse.json(
        { error: "Le numéro d'accusé de réception ERMES est requis pour passer en acknowledged" },
        { status: 400 },
      );
    }
  }

  // Une déclaration submitted/acknowledged n'autorise QUE la mise à jour
  // du ermesRef/ermesNote (pas les faits — preuve d'intégrité).
  if (
    (existing.statut === "submitted" || existing.statut === "acknowledged") &&
    body.faits !== undefined && body.faits !== existing.faits
  ) {
    return NextResponse.json(
      { error: "Les faits ne peuvent plus être modifiés après soumission" },
      { status: 409 },
    );
  }

  const newFaits = body.faits ?? existing.faits;
  const newErmesRef = body.ermesRef ?? existing.ermes_ref;
  const newErmesNote = body.ermesNote ?? existing.ermes_note;
  const wasSubmitted = existing.statut !== "submitted" && targetStatut === "submitted";
  const wasAcknowledged = existing.statut !== "acknowledged" && targetStatut === "acknowledged";

  await sql`
    UPDATE declarations_soupcon SET
      faits = ${newFaits},
      ermes_ref = ${newErmesRef},
      ermes_note = ${newErmesNote},
      statut = ${targetStatut},
      submitted_at = CASE WHEN ${wasSubmitted}::boolean THEN NOW() ELSE submitted_at END,
      acknowledged_at = CASE WHEN ${wasAcknowledged}::boolean THEN NOW() ELSE acknowledged_at END,
      updated_at = NOW()
    WHERE id = ${did}
  `;

  // ─── Audit log différencié selon le type d'update ────────────────────
  if (wasAcknowledged) {
    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "declaration.acknowledge",
      metadata: { declaration_id: did, ermes_ref: newErmesRef },
      req,
    });
  } else if (wasSubmitted) {
    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "declaration.submit",
      metadata: { declaration_id: did },
      req,
    });
    await enqueueOutboundEvent({
      dossierId: id,
      userId: scope.userId,
      orgId: scope.orgId,
      eventType: "dossier.declaration_submitted",
      extra: { declarationId: did },
    });
  } else {
    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "declaration.update",
      metadata: { declaration_id: did, statut: targetStatut },
      req,
    });
  }

  return NextResponse.json({ ok: true, statut: targetStatut });
}
