// lib/entreprise.ts — Client du registre officiel des entreprises françaises
//
// Source : API Recherche d'entreprises (recherche-entreprises.api.gouv.fr) —
// données INSEE/INPI publiques, gratuite, sans clé API. C'est la source
// AUTORITATIVE (SIREN, forme juridique, NAF, dirigeants, finances publiées) :
// fiable et opposable, contrairement à du scraping web.
//
// Server-only (appelé par /api/entreprise/lookup).

export interface RegistryDirigeant {
  nom: string;      // "DELSOL Quentin" ou dénomination si personne morale
  qualite: string;  // "Président", "Gérant"…
}

export interface RegistryFinance {
  annee: string;
  ca: number | null;          // chiffre d'affaires publié
  resultatNet: number | null;
}

export interface RegistryResult {
  siren: string;
  raisonSociale: string;
  formeJuridique: string;     // libellé humain (code INSEE mappé)
  nafCode: string;            // ex. "68.31Z"
  nafLibelle: string;
  dateCreation: string;       // ISO "1998-01-01" ou ""
  effectif: string;           // libellé tranche INSEE
  categorie: string;          // PME / ETI / GE ou ""
  adresse: string;
  dirigeants: RegistryDirigeant[];
  finances: RegistryFinance[];
}

const API = "https://recherche-entreprises.api.gouv.fr/search";

/* ── Référentiels INSEE (codes fréquents ; repli sur le code brut) ── */

const FORMES_JURIDIQUES: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5202": "Société en nom collectif (SNC)",
  "5410": "SARL",
  "5498": "EURL",
  "5499": "SARL",
  "5599": "SA",
  "5710": "SAS",
  "5720": "SASU",
  "6540": "SCI",
  "6220": "GIE",
  "9220": "Association déclarée",
};

const EFFECTIF_TRANCHES: Record<string, string> = {
  "00": "0 salarié",
  "01": "1 à 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export const NAF_LIBELLES: Record<string, string> = {
  "68.31Z": "Agences immobilières",
  "68.32A": "Administration d'immeubles (syndic, gestion)",
  "68.32B": "Supports juridiques de gestion de patrimoine immobilier",
  "68.20A": "Location de logements",
  "68.20B": "Location de terrains et d'autres biens immobiliers",
  "68.10Z": "Achat et vente de biens immobiliers propres (marchand de biens)",
  "41.10A": "Promotion immobilière de logements",
  "41.10B": "Promotion immobilière de bureaux",
  "41.10C": "Promotion immobilière d'autres bâtiments",
  "66.19B": "Autres activités auxiliaires de services financiers",
  "69.10Z": "Activités juridiques",
  "69.20Z": "Activités comptables",
};

/* ── Normalisation d'un résultat brut de l'API ── */

interface RawDirigeant {
  type_dirigeant?: string;
  nom?: string;
  prenoms?: string;
  denomination?: string;
  qualite?: string;
}

interface RawResult {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  nature_juridique?: string;
  activite_principale?: string;
  categorie_entreprise?: string;
  date_creation?: string;
  tranche_effectif_salarie?: string;
  dirigeants?: RawDirigeant[];
  finances?: Record<string, { ca?: number | null; resultat_net?: number | null }>;
  siege?: { adresse?: string; code_postal?: string; libelle_commune?: string };
}

function normalize(r: RawResult): RegistryResult {
  const naf = r.activite_principale ?? "";
  const adresse =
    r.siege?.adresse ||
    [r.siege?.code_postal, r.siege?.libelle_commune].filter(Boolean).join(" ") ||
    "";

  const dirigeants: RegistryDirigeant[] = (r.dirigeants ?? [])
    .map((d) => ({
      nom: d.denomination || [d.prenoms, d.nom].filter(Boolean).join(" ").trim(),
      qualite: d.qualite ?? "",
    }))
    .filter((d) => d.nom)
    .slice(0, 6);

  const finances: RegistryFinance[] = Object.entries(r.finances ?? {})
    .map(([annee, f]) => ({ annee, ca: f?.ca ?? null, resultatNet: f?.resultat_net ?? null }))
    .sort((a, b) => b.annee.localeCompare(a.annee))
    .slice(0, 3);

  return {
    siren: r.siren ?? "",
    raisonSociale: r.nom_raison_sociale || r.nom_complet || "",
    formeJuridique: FORMES_JURIDIQUES[r.nature_juridique ?? ""] ?? (r.nature_juridique ? `Code ${r.nature_juridique}` : ""),
    nafCode: naf,
    nafLibelle: NAF_LIBELLES[naf] ?? naf,
    dateCreation: r.date_creation ?? "",
    effectif: EFFECTIF_TRANCHES[r.tranche_effectif_salarie ?? ""] ?? "",
    categorie: r.categorie_entreprise ?? "",
    adresse,
    dirigeants,
    finances,
  };
}

/** Recherche d'entreprises par nom (ou SIREN). Max 6 résultats. */
export async function searchEntreprises(query: string): Promise<RegistryResult[]> {
  const url = `${API}?q=${encodeURIComponent(query)}&page=1&per_page=6`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Réponse fraîche — les données registre bougent peu mais on évite un cache CDN stale.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Registre indisponible (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { results?: RawResult[] };
  return (data.results ?? []).map(normalize).filter((r) => r.siren && r.raisonSociale);
}
