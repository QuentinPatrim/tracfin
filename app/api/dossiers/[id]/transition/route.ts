// app/api/dossiers/[id]/transition/route.ts — Transition manuelle du niveau de vigilance
//
// Utilisé par le wizard "Marche à suivre" quand l'agent décide manuellement de
// changer le niveau du dossier après examen renforcé (lever le doute → vigilance
// renforcée, ou escalader → interdiction).

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Niveau } from "@/lib/tracfin";
import { logAudit } from "@/lib/audit";
import { getScope, findScopedDossier } from "@/lib/scope";

export const runtime = "nodejs";

// Transitions manuelles autorisées (l'agent décide en conscience).
// Les retours en arrière sont permis pour corriger une erreur de clic.
const ALLOWED_TRANSITIONS: Record<Niveau, Niveau[]> = {
  vigilance_standard: [],
  // Permet de revenir à examen renforcé si l'agent avait levé le doute par erreur
  vigilance_renforcee: ["examen_renforce"],
  // Forward : lever doute ou escalader. Backward : si tout est levé, vers vigilance_renforcee.
  examen_renforce: ["vigilance_renforcee", "interdiction"],
  // Permet de revenir à examen renforcé si l'agent avait escaladé par erreur
  interdiction: ["examen_renforce"],
};

const VALID_NIVEAUX: Niveau[] = [
  "vigilance_standard",
  "vigilance_renforcee",
  "examen_renforce",
  "interdiction",
];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  let body: { niveau?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const target = body.niveau as Niveau | undefined;
  if (!target || !VALID_NIVEAUX.includes(target)) {
    return NextResponse.json({ error: "Niveau cible invalide" }, { status: 400 });
  }

  // Récupère le dossier scopé (user_id perso OU org_id agence)
  const dossier = await findScopedDossier<{ niveau: Niveau | null; algo_version: string }>(
    id,
    scope,
    "niveau, algo_version",
  );
  if (!dossier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = dossier.niveau;
  if (!current) {
    return NextResponse.json(
      { error: "Niveau actuel non défini, transition impossible" },
      { status: 400 },
    );
  }

  // Vérifie que la transition est autorisée
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(target)) {
    return NextResponse.json(
      {
        error: `Transition ${current} → ${target} non autorisée`,
        allowed,
      },
      { status: 400 },
    );
  }

  // Met à jour le niveau du dossier (scope déjà confirmé par findScopedDossier)
  if (scope.isOrgContext) {
    await sql`
      UPDATE dossiers
      SET niveau = ${target}, updated_at = NOW()
      WHERE id = ${id} AND org_id = ${scope.orgId}
    `;
  } else {
    await sql`
      UPDATE dossiers
      SET niveau = ${target}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${scope.userId} AND org_id IS NULL
    `;
  }

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "dossier.transition",
    metadata: { from: current, to: target, algo_version: dossier.algo_version },
    req,
  });

  return NextResponse.json({ ok: true, from: current, to: target });
}
