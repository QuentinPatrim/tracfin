// lib/cartography.ts — Cartographie des risques LCB-FT (art. L.561-4-1 CMF)
//
// L'article L.561-4-1 du Code monétaire et financier impose à tout assujetti
// d'identifier et d'évaluer les risques BC/FT auxquels il est exposé — ce qui
// se traduit en pratique par une CARTOGRAPHIE DOCUMENTÉE des risques :
//
//   - Typologie clientèle (PPE, secteur, structure morale, RBE…)
//   - Géographie (pays de résidence, nationalité, lieu du bien)
//   - Produits / opérations (origine fonds, montage, mode de paiement)
//   - Canaux (à distance vs présentiel — peu pertinent en immobilier)
//
// Cette fonction agrège l'historique des dossiers du scope (perso ou org) sur
// une fenêtre temporelle pour produire le document que le contrôleur DGCCRF
// (ou l'autorité de tutelle équivalente) demande en premier lors d'un contrôle.
//
// Lignes directrices DGCCRF secteur immobilier (2023) précisent : la cartographie
// doit être revue ANNUELLEMENT et tenir compte des cas concrets rencontrés.

import { sql } from "@/lib/db";
import type { Scope } from "@/lib/scope";
import { OPTIONS } from "@/lib/tracfin";

// ─── Mapping colonne SQL (snake_case) → clé d'options Tracfin (camelCase) ─
// Les colonnes des dossiers stockent le code interne (ex: "green_fr"). Les
// libellés humains ("France / Union Européenne") sont dans OPTIONS de lib/tracfin.
const COLUMN_TO_OPTIONS_KEY: Record<string, keyof typeof OPTIONS> = {
  residence_fiscale: "residenceFiscale",
  lieu_bien: "lieuBien",
  origine_fonds: "origineFonds",
  type_bien: "typeBien",
  mode_paiement: "modePaiement",
  pays_nationalite: "paysNationalite",
  secteur_activite: "secteurActivite",
  montage_financier: "montageFinancier",
};

function labelForCode(column: string, code: string): string {
  const optionsKey = COLUMN_TO_OPTIONS_KEY[column];
  if (!optionsKey) return code;
  const found = OPTIONS[optionsKey]?.find((o) => o.value === code);
  return found?.label ?? code;
}

export interface NiveauDistribution {
  vigilance_standard: number;
  vigilance_renforcee: number;
  examen_renforce: number;
  interdiction: number;
}

export interface CountByKey {
  key: string;
  count: number;
  /** Pour les pays : true si liste grise/noire GAFI. */
  flagged?: boolean;
}

export interface MonthlyPoint {
  month: string;       // YYYY-MM
  total: number;
  renforcee: number;
  examen: number;
  interdiction: number;
}

export interface DossierAtRisk {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  niveau: string;
  created_at: string;
  updated_at: string;
}

export interface Cartography {
  /** Période couverte (ISO). */
  rangeStart: string;
  rangeEnd: string;
  /** Effectif total de dossiers actifs (non archivés). */
  totalActive: number;
  /** Effectif total dossiers archivés (conservés 5 ans). */
  totalArchived: number;
  /** Décompte par niveau de vigilance. */
  niveau: NiveauDistribution;
  /** Distribution géographique (pays GAFI grise/noire flaggés). */
  geographieResidence: CountByKey[];
  geographieLieuBien: CountByKey[];
  /** Distribution des origines de fonds rencontrées. */
  origineFonds: CountByKey[];
  /** Distribution des types de biens. */
  typeBien: CountByKey[];
  /** Distribution des modes de paiement (cash, crypto, virement…). */
  modePaiement: CountByKey[];
  /** Nombre de dossiers où une PPE a été détectée (client OU entourage). */
  ppeCount: number;
  /** Nombre de dossiers personnes morales avec SCI/holding. */
  structureComplexe: number;
  /** Nombre de cas espèces interdit (L.112-6 CMF). */
  cashInterdit: number;
  /** Nombre de dossiers avec crypto. */
  cryptoCount: number;
  /** Statistiques screening sanctions (Vague 2). */
  screening: {
    runsTotal: number;
    runsWithMatches: number;
    topScore: number | null;
  };
  /** Tendance temporelle 12 derniers mois. */
  monthly: MonthlyPoint[];
  /** Dossiers actifs nécessitant une attention (examen renforcé / interdiction). */
  dossiersAtRisk: DossierAtRisk[];
  /** Top 10 typologies à risque détectées (libellé + count). */
  topRiskTypologies: CountByKey[];
}

// Codes de risque GAFI utilisés dans le scoring (cf. lib/tracfin.ts)
const GAFI_FLAG_PREFIXES = ["orange_grey", "red_black", "red_sanctioned", "orange_other"];

function isFlaggedCountry(value: string | null | undefined): boolean {
  if (!value) return false;
  return GAFI_FLAG_PREFIXES.some((p) => value === p);
}

// ─── Libellés humains pour les codes catégoriques ─────────────────────────
// On NE refait pas un mapping complet ici : les codes (ex: "red_cash") restent
// affichés tels quels dans la cartographie. Le PDF de contrôle pourra ré-utiliser
// les libellés depuis lib/tracfin.ts si besoin.

interface RawAgg {
  key: string;
  count: number;
}

async function aggCountByColumn(
  column: string,
  scope: Scope,
  rangeStartIso: string,
): Promise<CountByKey[]> {
  // Whitelist colonnes pour éviter injection
  const ALLOWED = new Set([
    "residence_fiscale", "lieu_bien", "pays_nationalite",
    "origine_fonds", "type_bien", "mode_paiement",
    "montage_financier", "secteur_activite",
  ]);
  if (!ALLOWED.has(column)) {
    throw new Error(`aggCountByColumn: colonne non autorisée "${column}"`);
  }

  const baseQuery = `
    SELECT ${column} AS key, COUNT(*)::int AS count
    FROM dossiers
    WHERE ${column} IS NOT NULL AND ${column} <> ''
      AND created_at >= $1
  `;

  const rows = scope.isOrgContext
    ? (await sql.query(
        baseQuery + ` AND org_id = $2 GROUP BY ${column} ORDER BY count DESC LIMIT 20`,
        [rangeStartIso, scope.orgId],
      )) as unknown as RawAgg[]
    : (await sql.query(
        baseQuery + ` AND user_id = $2 AND org_id IS NULL GROUP BY ${column} ORDER BY count DESC LIMIT 20`,
        [rangeStartIso, scope.userId],
      )) as unknown as RawAgg[];

  return rows.map((r) => {
    // r.key = code interne brut (ex: "green_fr"). On retient le code pour le
    // calcul du flag GAFI, mais on AFFICHE le libellé humain dans la clé sortante.
    const isGeoColumn =
      column.startsWith("residence") || column.startsWith("pays_") || column === "lieu_bien";
    return {
      key: labelForCode(column, r.key),
      count: r.count,
      flagged: isGeoColumn ? isFlaggedCountry(r.key) : undefined,
    };
  });
}

interface DossierRow {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  niveau: string | null;
  statut: string | null;
  algo_version: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  ppe: boolean | null;
  ppe_proche_detecte: boolean | null;
  type_bien: string | null;
  montage_financier: string | null;
  mode_paiement: string | null;
}

/**
 * Calcule la cartographie complète pour le scope donné.
 * Fenêtre par défaut : 12 derniers mois (révision annuelle DGCCRF).
 */
export async function computeCartography(scope: Scope, monthsWindow = 12): Promise<Cartography> {
  const now = new Date();
  const rangeEnd = now;
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - monthsWindow, 1);

  const rangeStartIso = rangeStart.toISOString();

  // ─── Tous les dossiers sur la fenêtre (actifs + archivés pour le total) ─
  const dossiers = scope.isOrgContext
    ? (await sql`
        SELECT id, nom_prenom, type_client, niveau, statut, algo_version,
               created_at, updated_at, archived_at,
               ppe, ppe_proche_detecte, type_bien, montage_financier, mode_paiement
        FROM dossiers
        WHERE org_id = ${scope.orgId} AND created_at >= ${rangeStartIso}
      `) as unknown as DossierRow[]
    : (await sql`
        SELECT id, nom_prenom, type_client, niveau, statut, algo_version,
               created_at, updated_at, archived_at,
               ppe, ppe_proche_detecte, type_bien, montage_financier, mode_paiement
        FROM dossiers
        WHERE user_id = ${scope.userId} AND org_id IS NULL AND created_at >= ${rangeStartIso}
      `) as unknown as DossierRow[];

  const active = dossiers.filter((d) => !d.archived_at);
  const archived = dossiers.filter((d) => d.archived_at);

  // Mapping legacy v1 → niveau v2
  const V1_TO_NIVEAU: Record<string, string> = {
    valid: "vigilance_standard",
    vigilance: "vigilance_renforcee",
    stop: "vigilance_renforcee",
    critical: "examen_renforce",
  };
  const niveauOf = (d: DossierRow): string | null => {
    if (d.algo_version === "v2" && d.niveau) return d.niveau;
    if (d.statut) return V1_TO_NIVEAU[d.statut] ?? null;
    return null;
  };

  const niveau: NiveauDistribution = {
    vigilance_standard: 0,
    vigilance_renforcee: 0,
    examen_renforce: 0,
    interdiction: 0,
  };
  for (const d of active) {
    const n = niveauOf(d);
    if (n && n in niveau) niveau[n as keyof NiveauDistribution]++;
  }

  // ─── Stats inline depuis le set de dossiers déjà chargé ───────────────
  const ppeCount = active.filter((d) => d.ppe === true || d.ppe_proche_detecte === true).length;
  const structureComplexe = active.filter(
    (d) => d.type_bien === "orange_sci" ||
           d.montage_financier === "orange_complexe" ||
           d.montage_financier === "red_offshore",
  ).length;
  const cashInterdit = active.filter((d) => d.mode_paiement === "red_especes").length;
  const cryptoCount = active.filter((d) => d.mode_paiement === "red_crypto").length;

  // ─── Agrégations colonnaires ──────────────────────────────────────────
  const [
    geographieResidence,
    geographieLieuBien,
    origineFonds,
    typeBien,
    modePaiement,
  ] = await Promise.all([
    aggCountByColumn("residence_fiscale", scope, rangeStartIso),
    aggCountByColumn("lieu_bien", scope, rangeStartIso),
    aggCountByColumn("origine_fonds", scope, rangeStartIso),
    aggCountByColumn("type_bien", scope, rangeStartIso),
    aggCountByColumn("mode_paiement", scope, rangeStartIso),
  ]);

  // ─── Screening (Vague 2) ──────────────────────────────────────────────
  const screeningRows = scope.isOrgContext
    ? (await sql`
        SELECT COUNT(*)::int AS runs_total,
               COUNT(*) FILTER (WHERE matches_count > 0)::int AS runs_with_matches,
               MAX(top_score) AS top_score
        FROM screening_runs
        WHERE org_id = ${scope.orgId} AND ran_at >= ${rangeStartIso}
      `) as unknown as Array<{ runs_total: number; runs_with_matches: number; top_score: number | null }>
    : (await sql`
        SELECT COUNT(*)::int AS runs_total,
               COUNT(*) FILTER (WHERE matches_count > 0)::int AS runs_with_matches,
               MAX(top_score) AS top_score
        FROM screening_runs
        WHERE user_id = ${scope.userId} AND org_id IS NULL AND ran_at >= ${rangeStartIso}
      `) as unknown as Array<{ runs_total: number; runs_with_matches: number; top_score: number | null }>;

  const screening = {
    runsTotal: screeningRows[0]?.runs_total ?? 0,
    runsWithMatches: screeningRows[0]?.runs_with_matches ?? 0,
    topScore: screeningRows[0]?.top_score ?? null,
  };

  // ─── Tendance mensuelle ───────────────────────────────────────────────
  const monthly: MonthlyPoint[] = [];
  for (let i = monthsWindow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inMonth = active.filter((row) => {
      const created = new Date(row.created_at);
      return created >= d && created < next;
    });
    monthly.push({
      month: monthKey,
      total: inMonth.length,
      renforcee: inMonth.filter((r) => niveauOf(r) === "vigilance_renforcee").length,
      examen: inMonth.filter((r) => niveauOf(r) === "examen_renforce").length,
      interdiction: inMonth.filter((r) => niveauOf(r) === "interdiction").length,
    });
  }

  // ─── Dossiers actifs à risque ────────────────────────────────────────
  const dossiersAtRisk: DossierAtRisk[] = active
    .filter((d) => {
      const n = niveauOf(d);
      return n === "examen_renforce" || n === "interdiction";
    })
    .map((d) => ({
      id: d.id,
      nom_prenom: d.nom_prenom,
      type_client: d.type_client,
      niveau: niveauOf(d) ?? "—",
      created_at: d.created_at,
      updated_at: d.updated_at,
    }))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 25);

  // ─── Top typologies à risque détectées (synthèse) ────────────────────
  // On compile un index de signaux à risque rencontrés au moins une fois.
  const typologies: CountByKey[] = [
    { key: "PPE (client ou entourage) — L.561-10 1°", count: ppeCount },
    { key: "Structure complexe (SCI/holding/offshore)", count: structureComplexe },
    { key: "Espèces > 1 000 € (interdit L.112-6 CMF)", count: cashInterdit },
    { key: "Paiement en cryptoactifs", count: cryptoCount },
    {
      key: "Pays GAFI grise/noire (résidence)",
      count: geographieResidence.filter((g) => g.flagged).reduce((acc, g) => acc + g.count, 0),
    },
    {
      key: "Pays GAFI grise/noire (lieu du bien)",
      count: geographieLieuBien.filter((g) => g.flagged).reduce((acc, g) => acc + g.count, 0),
    },
    {
      key: "Hit screening sanctions (≥ 1 match haute confiance)",
      count: screening.runsWithMatches,
    },
  ]
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    totalActive: active.length,
    totalArchived: archived.length,
    niveau,
    geographieResidence,
    geographieLieuBien,
    origineFonds,
    typeBien,
    modePaiement,
    ppeCount,
    structureComplexe,
    cashInterdit,
    cryptoCount,
    screening,
    monthly,
    dossiersAtRisk,
    topRiskTypologies: typologies,
  };
}
