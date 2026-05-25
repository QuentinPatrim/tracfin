// lib/screening.ts — Screening sanctions via OpenSanctions
//
// API publique d'OpenSanctions (https://www.opensanctions.org/docs/api/) :
//   - Endpoint /match/default : matching d'entité avec scoring (recommandé pour KYC)
//   - Endpoint /search : full-text simple (moins précis)
//
// On utilise /match/default avec un schéma "Person" (ou "Organization" si type_client=morale).
// Authentification : Authorization: ApiKey <key>. Free tier = 5 req/min, suffisant pour
// les tests. En prod cible : clé payante avec quotas commerciaux.
//
// Conformité : le résultat brut est stocké dans screening_runs.response → preuve
// opposable que la vérification a été faite à la date X, avec quels datasets.

/** Schéma OpenSanctions (un sous-ensemble de FollowTheMoney). */
export type SanctionSchema = "Person" | "Organization" | "Company";

/** Topics les plus pertinents pour LCB-FT — cf. https://www.opensanctions.org/reference/#topics */
export type SanctionTopic =
  | "sanction"            // listes officielles (UN/UE/OFAC/DGT…)
  | "sanction.linked"     // lié à une entité sous sanction
  | "role.pep"            // PPE (politique)
  | "role.rca"            // proche d'un PPE
  | "crime"               // crime documenté
  | "crime.fraud"
  | "crime.theft"
  | "crime.terror"
  | "crime.traffick"
  | "debarment"           // exclu d'un marché public
  | "export.control";

export interface SanctionMatch {
  /** ID stable OpenSanctions (utile pour suivi inter-run). */
  id: string;
  /** Score de correspondance 0..1 calculé par OpenSanctions. */
  score: number;
  /** Schéma : Person, Organization, Company. */
  schema: SanctionSchema;
  /** Nom canonique (peut différer de la query si OpenSanctions a une forme normalisée). */
  caption: string;
  /** Topics structurés (sanction, crime, PPE, etc.). Au moins un attendu. */
  topics: SanctionTopic[];
  /** Datasets sources : "eu_fsf", "us_ofac_sdn", "fr_dgt_freeze", "un_sc_sanctions"… */
  datasets: string[];
  /** Pays de citoyenneté ou de l'entité (codes ISO-2 ou texte libre). */
  countries: string[];
  /** Aliases / autres noms (utile à l'agent pour vérifier visuellement). */
  aliases: string[];
  /** URL OpenSanctions pour consultation détaillée par l'agent. */
  url: string;
}

export interface ScreeningResult {
  provider: "opensanctions";
  /** Matches au-dessus du seuil pertinent pour LCB-FT (cf. THRESHOLD plus bas). */
  matches: SanctionMatch[];
  /** Score le plus élevé renvoyé (utile même si en-dessous du seuil). */
  topScore: number | null;
  /** Tout le payload brut (pour archivage screening_runs). */
  rawResponse: unknown;
  /** Query exacte envoyée à OpenSanctions (pour reproductibilité). */
  rawQuery: unknown;
}

export interface ScreeningInput {
  /** Identité à screener. */
  name: string;
  /** Date de naissance ISO YYYY-MM-DD (optionnel mais améliore la précision). */
  birthDate?: string;
  /** Nationalité (libellé libre ou code ISO). */
  nationality?: string;
  /** Pour personne morale : on bascule sur le schéma Organization. */
  isOrganization?: boolean;
}

// ─── Seuils ────────────────────────────────────────────────────────────────
// OpenSanctions documente que > 0.7 = correspondance forte, 0.5-0.7 = à examiner,
// < 0.5 = bruit. Pour LCB-FT on est strict : on remonte tout >= 0.5 à l'agent.
const RELEVANCE_THRESHOLD = 0.5;
// "Hit" auto-validé (gate à activer) : score très élevé. Pour l'instant on laisse
// l'agent confirmer même au-dessus, c'est plus prudent juridiquement.
export const HIGH_CONFIDENCE_THRESHOLD = 0.85;

const OPENSANCTIONS_BASE = "https://api.opensanctions.org";

/**
 * Lance un screening sanctions sur l'identité fournie.
 * Lance une exception si OpenSanctions est inaccessible ou refuse la requête.
 */
export async function screenSanctions(input: ScreeningInput): Promise<ScreeningResult> {
  const apiKey = process.env.OPENSANCTIONS_API_KEY;
  const queryId = "klaris-query";

  const properties: Record<string, string[]> = {
    name: [input.name],
  };
  if (input.birthDate && /^\d{4}-\d{2}-\d{2}/.test(input.birthDate)) {
    properties.birthDate = [input.birthDate.slice(0, 10)];
  }
  if (input.nationality) {
    properties.nationality = [input.nationality];
  }

  const schema: SanctionSchema = input.isOrganization ? "Organization" : "Person";
  const rawQuery = {
    queries: {
      [queryId]: {
        schema,
        properties,
      },
    },
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `ApiKey ${apiKey}`;

  const res = await fetch(`${OPENSANCTIONS_BASE}/match/default`, {
    method: "POST",
    headers,
    body: JSON.stringify(rawQuery),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenSanctions HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }

  const raw = (await res.json()) as {
    responses: Record<string, {
      results: Array<{
        id: string;
        score: number;
        schema: string;
        caption: string;
        properties?: {
          topics?: string[];
          country?: string[];
          alias?: string[];
        };
        datasets?: string[];
      }>;
    }>;
  };

  const block = raw.responses?.[queryId];
  const results = block?.results ?? [];

  const matches: SanctionMatch[] = results
    .filter((r) => r.score >= RELEVANCE_THRESHOLD)
    .map((r) => ({
      id: r.id,
      score: r.score,
      schema: (r.schema as SanctionSchema) ?? schema,
      caption: r.caption,
      topics: (r.properties?.topics ?? []) as SanctionTopic[],
      datasets: r.datasets ?? [],
      countries: r.properties?.country ?? [],
      aliases: r.properties?.alias ?? [],
      url: `https://www.opensanctions.org/entities/${encodeURIComponent(r.id)}/`,
    }))
    .sort((a, b) => b.score - a.score);

  // topScore = max all results, même en dessous du seuil (utile à logger).
  const allScores = results.map((r) => r.score);
  const topScore = allScores.length > 0 ? Math.max(...allScores) : null;

  return {
    provider: "opensanctions",
    matches,
    topScore,
    rawResponse: raw,
    rawQuery,
  };
}

/**
 * Détermine, à partir des matches, quelle "gate" LCB-FT s'allume :
 *   - D1 (gel des avoirs) : présence d'un dataset FR (DGT Trésor) ou UE consolidated
 *   - D2 (sanctions internationales) : tout topic 'sanction' ou un dataset US/UN
 *
 * NOTE : c'est une SUGGESTION pour l'agent, pas une auto-validation. Le verdict
 * final reste manuel (BinaryField Y/N) — un score 0.6 sur "John Smith" face à
 * "John A. Smith" peut être un faux positif.
 */
export interface GateSuggestion {
  d1: boolean;
  d2: boolean;
  reasoning: string[];
}

export function suggestGatesFromMatches(matches: SanctionMatch[]): GateSuggestion {
  const reasoning: string[] = [];
  let d1 = false;
  let d2 = false;

  for (const m of matches) {
    if (m.score < HIGH_CONFIDENCE_THRESHOLD) continue;
    const hasSanctionTopic = m.topics.some((t) => t === "sanction" || t === "sanction.linked");
    if (!hasSanctionTopic) continue;

    const datasets = m.datasets.map((d) => d.toLowerCase());
    const isFrDgt = datasets.some((d) => d.startsWith("fr_dgt") || d.startsWith("fr_") || d === "eu_fsf");
    const isInternational = datasets.some(
      (d) => d.startsWith("us_ofac") || d.startsWith("un_") || d === "eu_fsf" || d.startsWith("uk_"),
    );

    if (isFrDgt) {
      d1 = true;
      reasoning.push(`D1 — ${m.caption} (gel UE/FR, score ${m.score.toFixed(2)})`);
    }
    if (isInternational) {
      d2 = true;
      reasoning.push(`D2 — ${m.caption} (sanctions internationales, score ${m.score.toFixed(2)})`);
    }
  }

  return { d1, d2, reasoning };
}
