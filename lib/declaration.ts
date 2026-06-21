// lib/declaration.ts — Pré-remplissage d'une déclaration de soupçon TRACFIN
//
// L'article L.561-15 du Code monétaire et financier impose à l'assujetti de
// déclarer à TRACFIN, sous 48 heures, toute opération relative à une somme
// suspectée de provenir d'une infraction ou de financer le terrorisme.
//
// Klaris connaît déjà tout ce que TRACFIN demande : identité du déclaré,
// indices ayant déclenché le soupçon (algo_log.triggers), pièces, screening.
// Ce module agrège ces données en un draft de DS exploitable par l'agent.
//
// Le format de la DS suit la structure du formulaire ERMES (portail TRACFIN) :
//   1. Identification du déclarant (agent immobilier)
//   2. Identification du déclaré (client, suspect)
//   3. Identification du bénéficiaire effectif si distinct
//   4. Exposé des faits / indices
//   5. Pièces jointes

import { sql } from "@/lib/db";
import type { Niveau, AlgoLogEntry } from "@/lib/tracfin";
import { NIVEAU_CFG, RISK_LABELS } from "@/lib/tracfin";
import type { Dossier } from "@/types/dossier";
import { listDossierFiles, type DossierFile, type KycFilesRow } from "@/lib/dossier-files";

export interface DeclarationDraft {
  /** Niveau de vigilance du dossier (motivation de la DS). */
  niveau: Niveau | null;
  niveauLabel: string;

  /** Référence interne Klaris du dossier (pas le SIREN, l'UUID Klaris). */
  refKlaris: string;
  dateDetection: string;

  /** Identification du soupçonné. */
  soupconne: {
    typeClient: "physique" | "morale";
    nomComplet: string;
    dateNaissance: string | null;
    lieuNaissance: string | null;
    nationalite: string | null;
    paysResidenceFiscale: string | null;
    adresse: string | null;
    profession: string | null;
    /** Pour personnes morales : */
    formeJuridique?: string;
    siren?: string;
    activitePrincipale?: string;
    nomGerant?: string;
  };

  /** Bénéficiaires effectifs (si PM). */
  beneficiairesEffectifs: Array<{
    nom: string;
    pctDetention?: string;
    typeControle?: string;
  }>;

  /** Opération suspecte. */
  operation: {
    typeBien: string | null;
    lieuBien: string | null;
    montantEur: number | null;
    origineFonds: string | null;
    modePaiement: string | null;
    montageFinancier: string | null;
  };

  /** Indices ayant motivé le soupçon (algo_log + flags + screening matches). */
  indices: Array<{
    type: "scoring" | "ppe" | "gate" | "screening" | "geo";
    code: string;
    description: string;
    severite: "rouge" | "orange" | "gate";
  }>;

  /** Pièces jointes disponibles (issues de kyc_responses). */
  pieces: Array<{ key: string; label: string; storageKey: string | null; ext: string }>;

  /** Suggestion de texte d'exposé (l'agent doit le relire / affiner). */
  expose: string;
}

interface KycRowMin extends KycFilesRow {
  type_client: string | null;
  nom_prenom: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  pays_nationalite: string | null;
  pays_residence_fiscale: string | null;
  adresse: string | null;
  profession: string | null;
  forme_juridique: string | null;
  siren: string | null;
  activite_principale: string | null;
  nom_gerant: string | null;
  beneficiaires_effectifs_json: unknown;
  type_bien: string | null;
  lieu_bien: string | null;
  montant_operation: string | null;
  origine_fonds: string | null;
  origine_fonds_precisions: string | null;
  mode_paiement: string | null;
  mode_financement: string | null;
}

/**
 * Construit le draft d'une DS à partir d'un dossier_id.
 * Récupère dossier + kyc_response + screening_runs pour la version la plus à jour.
 */
export async function buildDeclarationDraft(dossierId: string): Promise<DeclarationDraft | null> {
  const dossierRows = (await sql`
    SELECT * FROM dossiers WHERE id = ${dossierId} LIMIT 1
  `) as unknown as Dossier[];
  if (dossierRows.length === 0) return null;
  const dossier = dossierRows[0];

  const kycRows = (await sql`
    SELECT
      type_client, nom_prenom, date_naissance, lieu_naissance, nationalite,
      pays_nationalite, pays_residence_fiscale, adresse, profession,
      forme_juridique, siren, activite_principale, nom_gerant,
      beneficiaires_effectifs_json,
      type_bien, lieu_bien, montant_operation,
      origine_fonds, origine_fonds_precisions, mode_paiement, mode_financement,
      url_piece_identite, url_justif_domicile, url_avis_imposition,
      url_justif_revenus, url_justif_origine_fonds,
      url_kbis, url_statuts, url_cni_gerant, url_bilans, url_rbe
    FROM kyc_responses
    WHERE dossier_id = ${dossierId}
    ORDER BY submitted_at DESC NULLS LAST
    LIMIT 1
  `) as unknown as KycRowMin[];
  const kyc = kycRows[0] ?? null;

  // Screening : on récupère les matches du dernier run pour les ajouter aux indices.
  const screeningRows = (await sql`
    SELECT response, top_score
    FROM screening_runs
    WHERE dossier_id = ${dossierId}
    ORDER BY ran_at DESC
    LIMIT 1
  `) as unknown as Array<{ response: unknown; top_score: number | null }>;

  // ─── Indices ─────────────────────────────────────────────────────────
  const indices: DeclarationDraft["indices"] = [];

  // 1) Triggers du scoring (depuis algo_log)
  const triggers = (dossier.algo_log?.triggers ?? []) as AlgoLogEntry[];
  for (const t of triggers) {
    let type: DeclarationDraft["indices"][number]["type"] = "scoring";
    if (t.critere === "ppe") type = "ppe";
    else if (t.risk === "gate") type = "gate";
    else if (["residenceFiscale", "paysNationalite", "lieuBien"].includes(t.critere)) type = "geo";

    indices.push({
      type,
      code: t.critere,
      description: t.motif,
      severite: t.risk === "gate" ? "gate" : t.risk === "red" ? "rouge" : "orange",
    });
  }

  // 2) Screening sanctions matches haute confiance
  if (screeningRows.length > 0) {
    try {
      const resp = screeningRows[0].response as {
        responses?: Record<string, { results?: Array<{ id?: string; score?: number; caption?: string; datasets?: string[]; properties?: { topics?: string[] } }> }>;
      };
      const block = resp.responses ? Object.values(resp.responses)[0] : null;
      const matches = (block?.results ?? []).filter((m) => (m.score ?? 0) >= 0.7);
      for (const m of matches) {
        indices.push({
          type: "screening",
          code: m.id ?? "unknown",
          description: `Correspondance sanctions : ${m.caption ?? "(?)"} — score ${Math.round((m.score ?? 0) * 100)}%, datasets : ${(m.datasets ?? []).slice(0, 3).join(", ")}`,
          severite: (m.score ?? 0) >= 0.85 ? "rouge" : "orange",
        });
      }
    } catch { /* ignore malformed payload */ }
  }

  // ─── Pièces jointes ──────────────────────────────────────────────────
  let pieces: DeclarationDraft["pieces"] = [];
  if (kyc) {
    pieces = listDossierFiles(kyc).map((f: DossierFile) => ({
      key: f.key,
      label: f.label,
      storageKey: f.storageKey,
      ext: f.ext,
    }));
  }

  // ─── Bénéficiaires effectifs (parse JSONB) ───────────────────────────
  let be: DeclarationDraft["beneficiairesEffectifs"] = [];
  if (kyc?.beneficiaires_effectifs_json) {
    try {
      const raw = typeof kyc.beneficiaires_effectifs_json === "string"
        ? JSON.parse(kyc.beneficiaires_effectifs_json)
        : kyc.beneficiaires_effectifs_json;
      if (Array.isArray(raw)) {
        be = raw.map((b: { nom?: string; pctDetention?: string; typeControle?: string }) => ({
          nom: b.nom ?? "",
          pctDetention: b.pctDetention,
          typeControle: b.typeControle,
        }));
      }
    } catch { /* ignore */ }
  }

  const isMorale = (kyc?.type_client ?? dossier.type_client) === "morale";

  // ─── Suggestion d'exposé ─────────────────────────────────────────────
  const expose = buildExpose({
    indices,
    nomComplet: kyc?.nom_prenom ?? dossier.nom_prenom,
    montantEur: kyc?.montant_operation ? Number(kyc.montant_operation.replace(/\s/g, "")) : null,
    typeBien: kyc?.type_bien ?? null,
    lieuBien: kyc?.lieu_bien ?? null,
    niveau: dossier.niveau,
  });

  const niveauLabel = dossier.niveau
    ? NIVEAU_CFG[dossier.niveau].label
    : "Niveau non déterminé";

  return {
    niveau: dossier.niveau,
    niveauLabel,
    refKlaris: dossier.id,
    dateDetection: dossier.date_detection ?? dossier.created_at,
    soupconne: {
      typeClient: (kyc?.type_client ?? dossier.type_client) === "morale" ? "morale" : "physique",
      nomComplet: kyc?.nom_prenom ?? dossier.nom_prenom,
      dateNaissance: kyc?.date_naissance ?? dossier.date_naissance,
      lieuNaissance: kyc?.lieu_naissance ?? dossier.lieu_naissance,
      nationalite: kyc?.nationalite ?? dossier.nationalite,
      paysResidenceFiscale: kyc?.pays_residence_fiscale ?? dossier.residence_fiscale,
      adresse: kyc?.adresse ?? dossier.adresse,
      profession: kyc?.profession ?? dossier.profession,
      ...(isMorale ? {
        formeJuridique: kyc?.forme_juridique ?? undefined,
        siren: kyc?.siren ?? undefined,
        activitePrincipale: kyc?.activite_principale ?? undefined,
        nomGerant: kyc?.nom_gerant ?? undefined,
      } : {}),
    },
    beneficiairesEffectifs: be,
    operation: {
      typeBien: kyc?.type_bien ?? dossier.type_bien,
      lieuBien: kyc?.lieu_bien ?? dossier.lieu_bien,
      montantEur: kyc?.montant_operation
        ? Number(kyc.montant_operation.replace(/\s/g, "")) || null
        : dossier.montant_transaction
          ? Number(String(dossier.montant_transaction).replace(/\s/g, "")) || null
          : null,
      origineFonds: kyc?.origine_fonds ?? dossier.origine_fonds,
      modePaiement: kyc?.mode_paiement ?? dossier.mode_paiement,
      montageFinancier: kyc?.mode_financement ?? dossier.montage_financier,
    },
    indices,
    pieces,
    expose,
  };
}

/**
 * Construit un texte d'exposé suggéré à partir des indices détectés.
 * L'agent peut/doit le relire et l'adapter avant soumission.
 */
function buildExpose(params: {
  indices: DeclarationDraft["indices"];
  nomComplet: string;
  montantEur: number | null;
  typeBien: string | null;
  lieuBien: string | null;
  niveau: Niveau | null;
}): string {
  const { indices, nomComplet, montantEur, typeBien, lieuBien, niveau } = params;

  const lines: string[] = [];

  // En-tête contextuel
  lines.push(
    `La société soussignée porte à la connaissance de TRACFIN, conformément à l'article L.561-15 du Code monétaire et financier, ses soupçons concernant la relation d'affaires établie avec ${nomComplet}.`,
  );
  lines.push("");

  // Contexte opération
  if (montantEur || typeBien || lieuBien) {
    const opParts: string[] = [];
    if (typeBien) opParts.push(`relative à ${labelOrCode("typeBien", typeBien)}`);
    if (lieuBien) opParts.push(`situé à ${lieuBien}`);
    if (montantEur) opParts.push(`d'un montant de ${montantEur.toLocaleString("fr-FR")} €`);
    lines.push(`L'opération ${opParts.join(", ")} a fait l'objet d'une vigilance ${niveau === "interdiction" ? "renforcée ayant conduit à l'interdiction de la relation d'affaires" : "renforcée"}.`);
    lines.push("");
  }

  // Indices structurés
  if (indices.length > 0) {
    lines.push("**Indices ayant fondé le soupçon :**");
    lines.push("");
    indices.forEach((idx, i) => {
      const sev = idx.severite === "gate" ? "🔴 GATE" : idx.severite === "rouge" ? "🔴" : "🟠";
      lines.push(`${i + 1}. ${sev} ${idx.description}`);
    });
    lines.push("");
  }

  // Closure
  lines.push(
    `Ces éléments, examinés cumulativement, conduisent la société soussignée à former un soupçon que la somme ou l'opération visée pourrait provenir d'une infraction passible d'une peine privative de liberté supérieure à un an, ou être destinée au financement du terrorisme.`,
  );

  return lines.join("\n");
}

// Helper local — résolution d'un code en label si on en a un.
function labelOrCode(key: string, code: string): string {
  // Importing OPTIONS would create a circular dep risk; we keep simple here.
  // Mapping minimaliste pour les labels les plus utiles dans l'exposé.
  const fallback: Record<string, string> = {
    green_residentiel_principal: "une acquisition de résidence principale",
    green_residentiel_secondaire: "une acquisition de résidence secondaire",
    green_locatif: "un investissement locatif",
    green_terrain: "l'acquisition d'un terrain",
    orange_commercial: "l'acquisition d'un local commercial",
    orange_sci: "une acquisition via SCI / holding",
    orange_multilots: "une acquisition multi-lots",
  };
  return fallback[code] ?? `une opération de type "${code}"`;
}

/** Helper d'export pour l'UI : libellés des types d'indices. */
export const INDICE_LABELS: Record<DeclarationDraft["indices"][number]["type"], string> = {
  scoring: "Critère de scoring",
  ppe: "Personne politiquement exposée",
  gate: "Gate absolue (sanctions / gel des avoirs)",
  screening: "Correspondance sanctions",
  geo: "Risque géographique",
};

export const SEVERITE_COLORS: Record<DeclarationDraft["indices"][number]["severite"], string> = {
  rouge: "#b91c1c",
  orange: "#b45309",
  gate: "#0f172a",
};

export { RISK_LABELS };
