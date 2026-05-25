// app/api/dossiers/[id]/rescreen/route.ts — Re-screening manuel d'un dossier
//
// L'agent peut forcer un re-screening immédiat depuis le détail du dossier,
// sans attendre le cron quotidien. Utile : si une liste vient d'être mise à
// jour, ou si l'agent veut vérifier avant une décision critique.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { rescreenDossier } from "@/lib/rescreening";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  // Rate limit : 3 re-screenings manuels / 10 min / user.
  // Le cron tourne déjà quotidiennement ; le manuel est pour les cas urgents.
  const rl = await enforceRateLimit({
    key: `rescreen-manual:${scope.userId}`,
    limit: 3,
    windowSec: 600,
  });
  if (rl) return rl;

  // Vérifie ownership + récupère les données identité nécessaires
  const dossier = await findScopedDossier<{
    id: string;
    nom_prenom: string;
    date_naissance: string | null;
    nationalite: string | null;
    type_client: "physique" | "morale";
    kyc_status: string | null;
    archived_at: string | null;
  }>(
    id,
    scope,
    "id, nom_prenom, date_naissance, nationalite, type_client, kyc_status, archived_at",
  );
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) {
    return NextResponse.json({ error: "Dossier archivé" }, { status: 409 });
  }
  if (dossier.kyc_status !== "received") {
    return NextResponse.json(
      { error: "KYC pas encore reçu — impossible de re-screener" },
      { status: 400 },
    );
  }

  try {
    const result = await rescreenDossier({
      id: dossier.id,
      user_id: scope.userId,
      org_id: scope.orgId,
      nom_prenom: dossier.nom_prenom,
      date_naissance: dossier.date_naissance,
      nationalite: dossier.nationalite,
      type_client: dossier.type_client,
    });

    return NextResponse.json({
      ok: true,
      isAlert: result.isAlert,
      newMatchIds: result.newMatchIds,
      topScore: result.topScore,
      matchesCount: result.matchesCount,
    });
  } catch (e) {
    console.error("Manual rescreen error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de re-screening" },
      { status: 502 },
    );
  }
}

// GET → endpoint pour acquitter une alerte de re-screening
// (l'agent confirme avoir traité l'alerte, le badge disparaît)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { decision?: "confirm_hit" | "dismiss_false_positive" } | null = null;
  try { body = await req.json(); } catch { /* body optionnel */ }
  const decision = body?.decision ?? "dismiss_false_positive";

  // L'acquittement = un audit_event screening.gate.confirm POSTÉRIEUR au dernier
  // screening_run alerte → batchPendingAlerts() le détectera et retournera false.
  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "screening.gate.confirm",
    metadata: { decision, source: "manual_ack" },
    req,
  });

  // Si l'agent a CONFIRMÉ le hit (vrai positif), il devrait aussi avoir mis à jour
  // les gates D1/D2 sur le dossier. On ne le fait pas automatiquement — c'est une
  // décision opposable, le PATCH /api/dossiers/[id] reste la voie nominale.
  await sql`SELECT 1`; // no-op : reserved for future state updates

  return NextResponse.json({ ok: true, acknowledged: true, decision });
}
