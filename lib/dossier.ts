// lib/dossier.ts — Mapping row Postgres ↔ DossierForm (centralisé, v2)

import { initialForm, type DossierForm } from "@/lib/tracfin";
import type { Dossier } from "@/types/dossier";

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
