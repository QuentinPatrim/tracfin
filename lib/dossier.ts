// lib/dossier.ts — Mapping row Postgres ↔ DossierForm (centralisé, v2)

import { initialForm, type DossierForm } from "@/lib/tracfin";
import type { Dossier } from "@/types/dossier";

// Mapping KYC libellé client → values scoring Tracfin (mêmes que dans app/dashboard/[id]/page.tsx)
const KYC_TO_TRACFIN_ORIGINE: Record<string, string> = {
  epargne: "green_epargne",
  revenus: "green_revenus",
  heritage: "green_heritage",
  donation: "orange_donation",
  vente: "orange_vente",
  pret_familial: "orange_pret_fam",
  pret_bancaire: "green_epargne",
  autre: "",
};

const KYC_TO_TRACFIN_MONTAGE: Record<string, string> = {
  pret_bancaire: "green_pret",
  comptant: "orange_comptant",
  mixte: "green_pret",
  autre: "",
};

function toDateInput(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return "";
}

// ─── Shape minimal d'une ligne kyc_responses (juste ce dont on a besoin pour le PDF) ──
export interface KycResponseRow {
  type_client: string | null;
  nom_prenom: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  pays_nationalite: string | null;
  adresse: string | null;
  profession: string | null;
  secteur_activite: string | null;
  ppe: boolean | null;
  ppe_proche_detecte: boolean | null;
  pays_residence_fiscale: string | null;
  origine_fonds: string | null;
  origine_fonds_precisions: string | null;
  mode_financement: string | null;
  mode_paiement: string | null;
  montant_operation: string | null;
  type_bien: string | null;
  lieu_bien: string | null;
  url_piece_identite: string | null;
  url_justif_domicile: string | null;
  url_kbis: string | null;
  url_statuts: string | null;
  url_cni_gerant: string | null;
}

/**
 * Mapping kyc_responses → DossierForm.
 * Source de vérité pour la Fiche KYC PDF (ce que le client a déclaré, indépendamment
 * des saisies agent ultérieures dans `dossiers`).
 */
export function kycRowToForm(kyc: KycResponseRow): DossierForm {
  return {
    ...initialForm,
    typeClient: kyc.type_client === "morale" ? "morale" : "physique",
    nomPrenom: kyc.nom_prenom ?? "",
    dateNaissance: toDateInput(kyc.date_naissance),
    lieuNaissance: kyc.lieu_naissance ?? "",
    nationalite: kyc.nationalite ?? "",
    paysNationalite: kyc.pays_nationalite ?? "",
    adresse: kyc.adresse ?? "",
    profession: kyc.profession ?? "",
    secteurActivite: kyc.secteur_activite ?? "",
    residenceFiscale: kyc.pays_residence_fiscale ?? "",
    lieuBien: kyc.lieu_bien ?? "",
    typeBien: kyc.type_bien ?? "",
    modePaiement: kyc.mode_paiement ?? "",
    montantTransaction: kyc.montant_operation ?? "",
    ppe: kyc.ppe,
    ppeProcheDetecte: kyc.ppe_proche_detecte,

    // Mapping libellé client → value scoring
    origineFonds: kyc.origine_fonds ? (KYC_TO_TRACFIN_ORIGINE[kyc.origine_fonds] ?? "") : "",
    justifFonds: kyc.origine_fonds_precisions ?? "",
    montageFinancier: kyc.mode_financement ? (KYC_TO_TRACFIN_MONTAGE[kyc.mode_financement] ?? "") : "",

    // Pièces : truthy si URL/key Scaleway présente
    pieceIdentite: !!kyc.url_piece_identite,
    justifDomicile: !!kyc.url_justif_domicile,
    kbis: !!kyc.url_kbis,
    statuts: !!kyc.url_statuts,
    cniGerant: !!kyc.url_cni_gerant,
  };
}

export function rowToForm(row: Dossier): DossierForm {
  return {
    ...initialForm,
    typeClient: row.type_client,
    nomPrenom: row.nom_prenom,
    dateNaissance: toDateInput(row.date_naissance),
    lieuNaissance: row.lieu_naissance ?? "",
    nationalite: row.nationalite ?? "",
    paysNationalite: row.pays_nationalite ?? "",
    adresse: row.adresse ?? "",
    profession: row.profession ?? "",
    comportement: row.comportement ?? "",
    secteurActivite: row.secteur_activite ?? "",
    dateDetection: toDateInput(row.date_detection),
    lienKyc: row.lien_kyc ?? "",
    pieceIdentite: row.piece_identite,
    justifDomicile: row.justif_domicile,
    kbis: row.kbis,
    statuts: row.statuts,
    cniGerant: row.cni_gerant,
    gelAvoirs: row.gel_avoirs,
    gelDate: toDateInput(row.gel_date),
    sanctionsListe: row.sanctions_liste,
    ppe: row.ppe,
    ppeProches: row.ppe_entourage ?? [],
    ppeProcheDetecte: row.ppe_proche_detecte,
    residenceFiscale: row.residence_fiscale ?? "",
    lieuBien: row.lieu_bien ?? "",
    origineFonds: row.origine_fonds ?? "",
    justifFonds: row.justif_fonds ?? "",
    montageFinancier: row.montage_financier ?? "",
    modePaiement: row.mode_paiement ?? "",
    coherencePrix: row.coherence_prix ?? "",
    justifPrix: row.justif_prix ?? "",
    typeBien: row.type_bien ?? "",
    montantTransaction: row.montant_transaction ?? "",
    rbe: row.rbe ?? "",
    nomEmploye: row.nom_employe ?? "",
    formation: row.formation ?? "",
    responsableLCBFT: row.responsable_lcbft ?? "",
  };
}
