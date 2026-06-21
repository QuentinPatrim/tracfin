// app/api/dossiers/[id]/validation/route.ts — Demande + statut de validation 4-yeux

import { NextResponse } from "next/server";
import { getScope, findScopedDossier } from "@/lib/scope";
import { listValidations, requestValidation, canValidate, listOrgMembers } from "@/lib/correspondant";
import { logAudit } from "@/lib/audit";
import type { Dossier } from "@/types/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AT_RISK = new Set(["examen_renforce", "interdiction"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const validations = await listValidations(id);

  // Résout les noms des intervenants (uniquement en org) pour l'affichage.
  let nameMap: Record<string, string> = {};
  let userCanValidate = false;
  if (scope.isOrgContext && scope.orgId) {
    const members = await listOrgMembers(scope.orgId);
    nameMap = Object.fromEntries(members.map((m) => [m.userId, m.name]));
    userCanValidate = await canValidate(scope.userId, scope.orgId, scope.orgRole);
  }

  return NextResponse.json({
    isOrgContext: scope.isOrgContext,
    currentUserId: scope.userId,
    canValidate: userCanValidate,
    validations: validations.map((v) => ({
      ...v,
      requested_by_name: nameMap[v.requested_by] ?? v.requested_by,
      decided_by_name: v.decided_by ? (nameMap[v.decided_by] ?? v.decided_by) : null,
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Le workflow 4-yeux n'existe qu'en organisation (solo = pas de second œil).
  if (!scope.isOrgContext || !scope.orgId) {
    return NextResponse.json(
      {
        error: "org_required",
        message: "La validation par un correspondant requiert un contexte organisation (plan Agence).",
      },
      { status: 400 },
    );
  }

  const { id } = await params;
  const dossier = await findScopedDossier<Dossier>(id, scope);
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) return NextResponse.json({ error: "Dossier archivé" }, { status: 409 });

  // On ne demande une validation que pour les dossiers réellement à risque.
  const niveau = dossier.niveau ?? null;
  if (!niveau || !AT_RISK.has(niveau)) {
    return NextResponse.json(
      { error: "Seuls les dossiers en examen renforcé ou interdiction nécessitent une validation." },
      { status: 400 },
    );
  }

  const { row, alreadyPending } = await requestValidation({
    dossierId: id,
    orgId: scope.orgId,
    requestedBy: scope.userId,
    niveau,
  });

  if (!alreadyPending) {
    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "validation.request",
      metadata: { validation_id: row.id, niveau },
      req,
    });
  }

  return NextResponse.json({ ok: true, validation: row, alreadyPending }, { status: alreadyPending ? 200 : 201 });
}
