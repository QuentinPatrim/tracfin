// lib/demo-pdf.ts — Données fictives pour l'APERÇU des PDF (attestation + fiche KYC)
//
// Permet de rendre les VRAIS templates PDF (buildAttestationHtml / buildKycHtml)
// avec des données de démonstration cohérentes (dossier "Camille Rousseau",
// 100 % conforme). Utilisé par les routes publiques /pdf-render/*/demo pour
// montrer aux prospects le rendu EXACT du document — pas une pâle copie.
//
// Aucune donnée réelle, aucun accès base. Valeurs et date figées → hash stable.

import { initialForm, computeScore, type DossierForm } from "@/lib/tracfin";
import { computeContentHash } from "@/lib/pdf-helpers";

export const DEMO_DOSSIER_ID = "0a1f7b2c-3d4e-4f60-8180-9abcdef01234";
export const DEMO_GENERATED_AT = "2026-05-16T09:24:00.000Z";
export const DEMO_SIGNED_AT = "2026-05-16T09:18:00.000Z";

// Dossier acquéreur 100 % conforme (toutes les valeurs « vertes » du moteur v2).
export function buildDemoDossierForm(): DossierForm {
  return {
    ...initialForm,
    typeClient: "physique",
    partie: "acquereur",
    nomPrenom: "Rousseau Camille",
    dateNaissance: "1985-04-12",
    lieuNaissance: "Lyon",
    nationalite: "Française",
    paysNationalite: "green_fr",
    adresse: "14 rue des Lilas, 69003 Lyon",
    profession: "Cadre administratif",
    comportement: "green",
    secteurActivite: "green_standard",
    dateDetection: "2026-05-16",
    pieceIdentite: true,
    justifDomicile: true,
    gelAvoirs: false,
    sanctionsListe: false,
    ppe: false,
    ppeProcheDetecte: false,
    residenceFiscale: "green_fr",
    lieuBien: "green_fr",
    origineFonds: "green_epargne",
    justifFonds: "Épargne personnelle constituée sur 12 ans (relevés bancaires fournis).",
    montageFinancier: "green_pret",
    modePaiement: "green_virement",
    coherencePrix: "green",
    justifPrix: "Prix cohérent avec les références DVF du quartier.",
    typeBien: "green_residentiel_principal",
    montantTransaction: "320000",
    rbe: "green_physique",
    nomEmploye: "Marie Lefort",
    formation: "green",
    responsableLCBFT: "Marie Lefort",
  };
}

export function buildDemoAttestation() {
  const form = buildDemoDossierForm();
  const score = computeScore(form);
  const hash = computeContentHash(form, score, DEMO_DOSSIER_ID, DEMO_GENERATED_AT);
  return { form, score, hash };
}
