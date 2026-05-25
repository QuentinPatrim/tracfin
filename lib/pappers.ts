// lib/pappers.ts — Client Pappers (agrégateur INPI / RNE)
//
// API doc : https://api.pappers.fr/v2/ (free tier 30 req/min, payant à partir de 99€/mois)
// Données fournies : Kbis, RNE, RBE (bénéficiaires effectifs), statuts, dirigeants.
//
// Pour Klaris : utilisé pour pré-remplir automatiquement les KYC personne morale
// — supprime l'upload manuel du Kbis et la saisie répétitive des dirigeants / BE
// par le client final. Conformément à la 5e directive AML, le RBE INPI fait foi.
//
// Auth via PAPPERS_API_KEY (clé "API token" depuis le dashboard Pappers).
// Sans clé : on tente sans (certaines requêtes minimales sont possibles, mais
// le RNE complet exige l'auth — on échoue avec un message explicite).

const PAPPERS_BASE = "https://api.pappers.fr/v2";

export interface PappersDirigeant {
  /** "Personne physique" ou "Personne morale" */
  type: string;
  qualite: string;          // Président, Gérant, Directeur général…
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  date_de_naissance?: string;
  nationalite?: string;
}

export interface PappersBE {
  /** Bénéficiaire effectif (Personne physique uniquement par définition). */
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  date_de_naissance?: string;
  nationalite?: string;
  /** Pourcentage de parts détenues. */
  pourcentage_parts?: number;
  /** Pourcentage de droits de vote. */
  pourcentage_votes?: number;
  date_greffe?: string;
}

export interface PappersCompany {
  /** SIREN canonique (9 chiffres). */
  siren: string;
  /** Dénomination sociale officielle. */
  nom_entreprise: string;
  /** Forme juridique (SCI, SAS, SARL…). */
  forme_juridique: string;
  /** Code INSEE forme juridique. */
  forme_juridique_code?: string;
  /** Date de création (ISO YYYY-MM-DD). */
  date_creation?: string;
  /** Adresse complète du siège social. */
  siege?: {
    adresse_ligne_1?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
  };
  /** Activité principale (libellé NAF). */
  libelle_code_naf?: string;
  code_naf?: string;
  /** Capital social en € (centimes ? selon le tier — on stocke tel quel). */
  capital?: number | null;
  /** Numéro TVA intracom. */
  numero_tva_intracommunautaire?: string;
  /** Greffe d'immatriculation (pour le Kbis officiel). */
  greffe?: string;
  /** Date d'immatriculation au RCS. */
  date_immatriculation_rcs?: string;
  /** Dirigeants (président, gérant…). */
  representants?: PappersDirigeant[];
  /** Bénéficiaires effectifs déclarés au RBE. */
  beneficiaires_effectifs?: PappersBE[];
  /** Statut administratif (active / cessée). */
  statut_rcs?: string;
}

export interface NormalizedCompany {
  siren: string;
  denomination: string;
  formeJuridique: string;
  dateConstitution: string | null;     // YYYY-MM-DD
  adresseSiege: string;                // formaté : "12 rue X, 75001 Paris, France"
  activitePrincipale: string;
  capital: number | null;
  greffe: string | null;
  /** Dirigeant principal (premier représentant = gérant/président typiquement). */
  dirigeantPrincipal: {
    nom: string;
    prenom: string;
    nomComplet: string;
    qualite: string;
    dateNaissance: string | null;
    nationalite: string | null;
  } | null;
  /** BE structurés. */
  beneficiairesEffectifs: Array<{
    nom: string;
    prenom: string;
    nomComplet: string;
    dateNaissance: string | null;
    nationalite: string | null;
    pourcentageParts: number | null;
    pourcentageVotes: number | null;
  }>;
  /** Indique si la société est encore active selon le RCS. */
  statutActif: boolean;
}

// ─── Validation SIREN (algorithme Luhn modifié pour numéros INSEE) ──────
export function isValidSiren(siren: string): boolean {
  const cleaned = siren.replace(/\s/g, "");
  if (!/^\d{9}$/.test(cleaned)) return false;
  // Luhn standard avec doublement sur les positions paires (depuis la droite).
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(cleaned[i], 10);
    // En INSEE, on double les chiffres de RANG PAIR depuis la GAUCHE (positions 2,4,6,8).
    // Ce qui équivaut à doubler quand (i % 2 === 1) — index 1,3,5,7 depuis la gauche.
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export class PappersError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "PappersError";
  }
}

/**
 * Récupère les données d'une entreprise par SIREN.
 *
 * Throws PappersError(404) si l'entreprise n'existe pas / SIREN inconnu.
 * Throws PappersError(429) si rate-limit Pappers atteint.
 * Throws PappersError(500+) sur autre erreur réseau.
 */
export async function fetchCompanyBySiren(siren: string): Promise<{
  normalized: NormalizedCompany;
  raw: PappersCompany;
}> {
  if (!isValidSiren(siren)) {
    throw new PappersError("SIREN invalide", 400);
  }

  const apiKey = process.env.PAPPERS_API_KEY;
  const url = new URL(`${PAPPERS_BASE}/entreprise`);
  url.searchParams.set("siren", siren);
  if (apiKey) url.searchParams.set("api_token", apiKey);

  // On demande explicitement les sections "représentants" et "beneficiaires_effectifs"
  // pour avoir tous les RBE dans la réponse.
  url.searchParams.set("format_publications_bodacc", "json");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) {
    throw new PappersError("Entreprise introuvable au RNE pour ce SIREN", 404);
  }
  if (res.status === 401 || res.status === 403) {
    throw new PappersError(
      "Authentification Pappers requise (configurer PAPPERS_API_KEY)",
      res.status,
    );
  }
  if (res.status === 429) {
    throw new PappersError("Quota Pappers dépassé, réessayez dans 60 secondes", 429);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new PappersError(`Pappers HTTP ${res.status}: ${detail.slice(0, 200)}`, res.status);
  }

  const raw = (await res.json()) as PappersCompany;
  return { normalized: normalize(raw), raw };
}

function normalize(raw: PappersCompany): NormalizedCompany {
  // Adresse siège : on assemble les composantes en une seule chaîne lisible
  const adresseSiege = [
    raw.siege?.adresse_ligne_1,
    [raw.siege?.code_postal, raw.siege?.ville].filter(Boolean).join(" "),
    raw.siege?.pays && raw.siege.pays !== "France" ? raw.siege.pays : null,
  ]
    .filter(Boolean)
    .join(", ");

  const dirigeants = raw.representants ?? [];
  const first = dirigeants[0] ?? null;
  const dirigeantPrincipal = first
    ? {
        nom: first.nom ?? "",
        prenom: first.prenom ?? "",
        nomComplet: first.nom_complet ?? [first.prenom, first.nom].filter(Boolean).join(" ").trim(),
        qualite: first.qualite ?? "",
        dateNaissance: first.date_de_naissance ?? null,
        nationalite: first.nationalite ?? null,
      }
    : null;

  const beneficiairesEffectifs = (raw.beneficiaires_effectifs ?? []).map((b) => ({
    nom: b.nom ?? "",
    prenom: b.prenom ?? "",
    nomComplet: b.nom_complet ?? [b.prenom, b.nom].filter(Boolean).join(" ").trim(),
    dateNaissance: b.date_de_naissance ?? null,
    nationalite: b.nationalite ?? null,
    pourcentageParts: b.pourcentage_parts ?? null,
    pourcentageVotes: b.pourcentage_votes ?? null,
  }));

  return {
    siren: raw.siren,
    denomination: raw.nom_entreprise,
    formeJuridique: raw.forme_juridique,
    dateConstitution: raw.date_creation ?? null,
    adresseSiege,
    activitePrincipale: raw.libelle_code_naf ?? "",
    capital: raw.capital ?? null,
    greffe: raw.greffe ?? null,
    dirigeantPrincipal,
    beneficiairesEffectifs,
    statutActif: !raw.statut_rcs || /actif|active/i.test(raw.statut_rcs),
  };
}
