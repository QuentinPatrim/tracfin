// lib/rescreening.ts — Re-screening périodique (vigilance constante L.561-6 CMF)
//
// L'art. L.561-6 du Code monétaire et financier impose une "vigilance constante"
// pendant toute la durée de la relation d'affaires. Le screening à J0 ne suffit
// pas — il faut re-vérifier régulièrement car :
//   - Les listes OFAC/UE/UN sont mises à jour quotidiennement
//   - Un client propre aujourd'hui peut être sanctionné demain
//   - L'agent doit être notifié dès qu'un dossier passe d'OK à FLAG
//
// Ce module est exécuté en boucle par /api/cron/rescreening (Vercel Cron quotidien).
// Il ne fait PAS de scope filter : le cron tourne en système.

import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { screenSanctions, suggestGatesFromMatches, HIGH_CONFIDENCE_THRESHOLD, type SanctionMatch } from "@/lib/screening";

export interface DossierToScreen {
  id: string;
  user_id: string;
  org_id: string | null;
  nom_prenom: string;
  date_naissance: string | null;
  nationalite: string | null;
  type_client: "physique" | "morale";
}

export interface LastRunSummary {
  id: string;
  ran_at: string;
  matches_count: number;
  top_score: number | null;
  /** Liste des match.id du dernier run pour faire le diff. */
  match_ids: string[];
}

interface RescreeningResult {
  /** True si un NOUVEAU match (par rapport au dernier run) est apparu. */
  isAlert: boolean;
  /** Liste des nouveaux match.id détectés (pour log). */
  newMatchIds: string[];
  /** Top score actuel. */
  topScore: number | null;
  /** Nb de matches au-dessus du seuil. */
  matchesCount: number;
}

/**
 * Sélectionne les dossiers candidats au re-screening :
 *  - kyc_status = 'received' (KYC complété, relation d'affaires active)
 *  - non archivés
 *  - dernier screening_run > minDaysSinceLastRun (défaut 7j)
 *
 * On trie par ancienneté du dernier screening pour traiter en priorité les
 * dossiers les plus à risque (ceux jamais re-vérifiés).
 *
 * @param limit nombre max de dossiers à retourner (respect quota OpenSanctions)
 * @param minDaysSinceLastRun 7j par défaut — un dossier n'est pas re-vérifié si déjà fait dans la semaine
 */
export async function selectDossiersToRescreen(
  limit = 50,
  minDaysSinceLastRun = 7,
): Promise<DossierToScreen[]> {
  const cutoff = new Date(Date.now() - minDaysSinceLastRun * 24 * 60 * 60 * 1000).toISOString();

  const rows = (await sql`
    SELECT d.id, d.user_id, d.org_id, d.nom_prenom, d.date_naissance,
           d.nationalite, d.type_client,
           COALESCE(MAX(sr.ran_at), 'epoch'::timestamptz) AS last_run
    FROM dossiers d
    LEFT JOIN screening_runs sr ON sr.dossier_id = d.id
    WHERE d.kyc_status = 'received'
      AND d.archived_at IS NULL
    GROUP BY d.id
    HAVING COALESCE(MAX(sr.ran_at), 'epoch'::timestamptz) < ${cutoff}
    ORDER BY last_run ASC
    LIMIT ${limit}
  `) as unknown as DossierToScreen[];

  return rows;
}

/**
 * Récupère le dernier run de screening pour un dossier.
 * Renvoie null si aucun screening n'a jamais été fait.
 */
async function getLastRun(dossierId: string): Promise<LastRunSummary | null> {
  const rows = (await sql`
    SELECT id, ran_at, matches_count, top_score, response
    FROM screening_runs
    WHERE dossier_id = ${dossierId}
    ORDER BY ran_at DESC
    LIMIT 1
  `) as unknown as Array<{
    id: string; ran_at: string; matches_count: number;
    top_score: number | null; response: unknown;
  }>;

  if (rows.length === 0) return null;
  const r = rows[0];

  // Extrait les match.id depuis le payload OpenSanctions stocké
  let matchIds: string[] = [];
  try {
    const resp = r.response as { responses?: Record<string, { results?: Array<{ id?: string; score?: number }> }> };
    const block = resp.responses ? Object.values(resp.responses)[0] : null;
    matchIds = (block?.results ?? [])
      .filter((m) => (m.score ?? 0) >= 0.5)
      .map((m) => m.id ?? "")
      .filter(Boolean);
  } catch { /* malformed payload → empty array */ }

  return {
    id: r.id,
    ran_at: r.ran_at,
    matches_count: r.matches_count,
    top_score: r.top_score,
    match_ids: matchIds,
  };
}

/**
 * Re-screen un dossier et compare avec le précédent run.
 * Persiste le nouveau run et lève une alerte si nouveau match haute confiance.
 */
export async function rescreenDossier(d: DossierToScreen): Promise<RescreeningResult> {
  // Appel OpenSanctions (peut throw — laissé au caller pour gestion par lot)
  const result = await screenSanctions({
    name: d.nom_prenom,
    birthDate: d.date_naissance ?? undefined,
    nationality: d.nationalite ?? undefined,
    isOrganization: d.type_client === "morale",
  });

  const lastRun = await getLastRun(d.id);
  const previousMatchIds = new Set(lastRun?.match_ids ?? []);
  const currentMatchIds = result.matches.map((m) => m.id);

  // Détecte les NOUVEAUX matches haute confiance (>= HIGH_CONFIDENCE_THRESHOLD)
  // qui n'étaient pas dans le run précédent → vraie alerte vigilance L.561-6.
  const newHighConfidenceMatches = result.matches.filter(
    (m) => m.score >= HIGH_CONFIDENCE_THRESHOLD && !previousMatchIds.has(m.id),
  );
  const isAlert = newHighConfidenceMatches.length > 0;

  const gateSuggestion = suggestGatesFromMatches(result.matches);

  // Persiste le nouveau run
  const inserted = (await sql`
    INSERT INTO screening_runs (
      dossier_id, user_id, org_id, provider, query, response,
      matches_count, top_score, gates_flagged
    ) VALUES (
      ${d.id}, ${d.user_id}, ${d.org_id},
      ${result.provider},
      ${JSON.stringify(result.rawQuery)}::jsonb,
      ${JSON.stringify(result.rawResponse)}::jsonb,
      ${result.matches.length},
      ${result.topScore},
      ${JSON.stringify({
        d1: gateSuggestion.d1,
        d2: gateSuggestion.d2,
        reasoning: gateSuggestion.reasoning,
        suggested_at: new Date().toISOString(),
        triggered_by: "rescreening",
        is_alert: isAlert,
        new_match_ids: newHighConfidenceMatches.map((m) => m.id),
      })}::jsonb
    )
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  // Audit : run normal pour chaque dossier
  await logAudit({
    userId: null,        // exécuté par le cron, pas par un agent humain
    orgId: d.org_id,
    dossierId: d.id,
    action: "screening.run",
    metadata: {
      provider: result.provider,
      matches_count: result.matches.length,
      top_score: result.topScore,
      triggered_by: "rescreening_cron",
      run_id: inserted[0].id,
    },
  });

  // Audit + log spécifique si nouvelle alerte
  if (isAlert) {
    await logAudit({
      userId: null,
      orgId: d.org_id,
      dossierId: d.id,
      action: "screening.alert",
      metadata: {
        run_id: inserted[0].id,
        new_match_ids: newHighConfidenceMatches.map((m) => m.id),
        new_match_captions: newHighConfidenceMatches.map((m) => m.caption),
        top_score: result.topScore,
        d1_suggested: gateSuggestion.d1,
        d2_suggested: gateSuggestion.d2,
      },
    });
  }

  return {
    isAlert,
    newMatchIds: newHighConfidenceMatches.map((m) => m.id),
    topScore: result.topScore,
    matchesCount: result.matches.length,
  };
}

/**
 * Vérifie si un dossier a une alerte de re-screening NON encore acquittée par
 * l'agent. Un dossier est "alerté" si son dernier screening_run a is_alert=true
 * ET aucun audit "screening.gate.confirm" plus récent (= l'agent n'a pas
 * encore traité l'alerte).
 *
 * Utilisé côté UI dashboard pour afficher le badge "🚨 Alerte".
 */
export async function hasPendingAlert(dossierId: string): Promise<boolean> {
  const rows = (await sql`
    SELECT (gates_flagged->>'is_alert')::boolean AS is_alert, ran_at
    FROM screening_runs
    WHERE dossier_id = ${dossierId}
    ORDER BY ran_at DESC
    LIMIT 1
  `) as unknown as Array<{ is_alert: boolean | null; ran_at: string }>;

  if (rows.length === 0 || !rows[0].is_alert) return false;

  // Vérifie qu'aucun acquittement (screening.gate.confirm) n'a eu lieu APRÈS
  // ce screening alerte.
  const acks = (await sql`
    SELECT 1 FROM audit_events
    WHERE dossier_id = ${dossierId}
      AND action = 'screening.gate.confirm'
      AND created_at > ${rows[0].ran_at}
    LIMIT 1
  `) as unknown as Array<{ "?column?": number }>;

  return acks.length === 0;
}

/**
 * Helper de batch : récupère, pour une liste d'IDs de dossiers, la map
 * { dossierId: hasPendingAlert }. Plus efficace qu'un appel par dossier.
 */
export async function batchPendingAlerts(dossierIds: string[]): Promise<Set<string>> {
  if (dossierIds.length === 0) return new Set();

  // Pour chaque dossier, on cherche le dernier screening_run avec is_alert=true
  // qui n'a PAS d'acquittement postérieur.
  const rows = (await sql`
    WITH last_runs AS (
      SELECT DISTINCT ON (dossier_id)
        dossier_id, ran_at, (gates_flagged->>'is_alert')::boolean AS is_alert
      FROM screening_runs
      WHERE dossier_id = ANY(${dossierIds}::uuid[])
      ORDER BY dossier_id, ran_at DESC
    ),
    alerts AS (
      SELECT lr.dossier_id, lr.ran_at FROM last_runs lr
      WHERE lr.is_alert IS TRUE
    )
    SELECT a.dossier_id::text AS dossier_id FROM alerts a
    WHERE NOT EXISTS (
      SELECT 1 FROM audit_events ae
      WHERE ae.dossier_id = a.dossier_id
        AND ae.action = 'screening.gate.confirm'
        AND ae.created_at > a.ran_at
    )
  `) as unknown as Array<{ dossier_id: string }>;

  return new Set(rows.map((r) => r.dossier_id));
}
