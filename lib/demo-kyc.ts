// lib/demo-kyc.ts — Données fictives pré-remplies pour la démo du parcours client
//
// Utilisé uniquement par la route /kyc/demo (mode démonstration, lecture seule,
// aucun appel réseau). Cohérent avec le dossier démo "Camille Rousseau".
// Les url* pointent vers de faux ".pdf" → le composant FileUpload affiche une
// tuile « Reçu » avec icône (pas de vignette image cassée).

import { initialKycForm, type KycForm } from "@/lib/kyc";

export function buildDemoKycForm(partie: "vendeur" | "acquereur"): KycForm {
  const base: KycForm = {
    ...initialKycForm,
    typeClient: "physique",
    emailContact: "camille.rousseau@example.com",
    telephone: "+33 6 12 34 56 78",
    nomPrenom: "Rousseau Camille",
    dateNaissance: "1985-04-12",
    lieuNaissance: "Lyon",
    nationalite: "Française",
    paysNationalite: "green_fr",
    adresse: "14 rue des Lilas, 69003 Lyon",
    profession: "Cadre administratif",
    secteurActivite: "green_standard",

    ppe: false,
    ppeProcheDetecte: false,
    paysResidenceFiscale: "green_fr",

    pieceIdentiteType: "cni",
    pieceIdentiteNumero: "123456789012",
    pieceIdentiteExpiration: "2031-06-15",
    pieceIdentiteAutorite: "Préfecture du Rhône",

    typeBien: "green_residentiel_principal",
    lieuBien: "8 avenue Foch, 75116 Paris",
    montantOperation: "320000",

    consentementRgpd: true,

    // Pièces "déposées" (faux .pdf → tuile icône propre, jamais d'image cassée)
    urlPieceIdentite: "demo/piece-identite.pdf",
    urlJustifDomicile: "demo/justificatif-domicile.pdf",
  };

  if (partie === "acquereur") {
    base.origineFonds = "epargne";
    base.origineFondsPrecisions = "Épargne personnelle constituée sur 12 ans.";
    base.modeFinancement = "pret_bancaire";
    base.modePaiement = "green_virement";
    base.urlJustifOrigineFonds = "demo/origine-fonds.pdf";
  }

  return base;
}
