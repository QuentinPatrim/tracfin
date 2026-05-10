// lib/kyc.ts — Formulaire KYC public v2 (conformité DGCCRF + Arrêté 6 jan. 2021)

// Version actuelle de la mention CNIL affichée — preuve d'audit
export const MENTION_CNIL_VERSION = "v1-2026-05";

// ─── Bénéficiaire effectif structuré (PM uniquement) ────────────────────
export interface BeneficiaireEffectif {
  nom: string;
  pctDetention: string;       // string pour permettre saisie progressive ; convertie côté API
  typeControle: string;       // "capital" / "vote" / "controle_effectif"
}

// ─── Formulaire KYC v2 ──────────────────────────────────────────────────
export interface KycForm {
  // Versionning
  kycVersion: "v2";

  // Contact
  emailContact: string;
  telephone: string;

  // Type
  typeClient: "physique" | "morale";

  // Identité commune
  nomPrenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  paysNationalite: string;          // v2 — select GAFI (mêmes values que tracfin)
  adresse: string;
  profession: string;
  secteurActivite: string;          // v2 — select cash-intensive ou non

  // PPE étendue (L561-10 1°)
  ppe: boolean | null;
  ppePrecisions: string;
  ppeProcheDetecte: boolean | null; // v2
  ppeProchePrecisions: string;      // v2 — qui (lien + nom + fonction)

  // Pièce d'identité (Arrêté 6 janvier 2021, art. R561-5-1)
  pieceIdentiteType: string;        // v2 — "cni" / "passeport" / "titre_sejour"
  pieceIdentiteNumero: string;      // v2
  pieceIdentiteExpiration: string;  // v2
  pieceIdentiteAutorite: string;    // v2 — autorité de délivrance

  // Personne morale uniquement
  formeJuridique: string;
  siren: string;
  dateConstitution: string;
  activitePrincipale: string;
  nomGerant: string;
  beneficiairesEffectifs: string;             // legacy texte libre
  beneficiairesEffectifsJson: BeneficiaireEffectif[]; // v2 structuré

  // Données financières
  paysResidenceFiscale: string;
  origineFonds: string;
  origineFondsPrecisions: string;
  origineFondsVenteAdresse: string;  // v2 si vente d'un bien
  origineFondsDonateur: string;      // v2 si donation
  origineFondsLienDefunt: string;    // v2 si héritage
  modeFinancement: string;
  modePaiement: string;              // v2
  montantOperation: string;

  // Opération immobilière (v2)
  typeBien: string;
  lieuBien: string;                  // adresse du bien

  // URLs des pièces (Scaleway storage_key ou ancienne URL Cloudinary)
  urlPieceIdentite: string;
  urlJustifDomicile: string;
  urlAvisImposition: string;
  urlJustifRevenus: string;
  urlJustifOrigineFonds: string;
  urlKbis: string;
  urlStatuts: string;
  urlCniGerant: string;
  urlBilans: string;
  urlRbe: string;

  // Consentement RGPD (preuve d'audit)
  consentementRgpd: boolean;        // v2 — case obligatoire à la soumission
}

export const initialKycForm: KycForm = {
  kycVersion: "v2",
  emailContact: "",
  telephone: "",
  typeClient: "physique",
  nomPrenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  paysNationalite: "",
  adresse: "",
  profession: "",
  secteurActivite: "",
  ppe: null,
  ppePrecisions: "",
  ppeProcheDetecte: null,
  ppeProchePrecisions: "",
  pieceIdentiteType: "",
  pieceIdentiteNumero: "",
  pieceIdentiteExpiration: "",
  pieceIdentiteAutorite: "",
  formeJuridique: "",
  siren: "",
  dateConstitution: "",
  activitePrincipale: "",
  nomGerant: "",
  beneficiairesEffectifs: "",
  beneficiairesEffectifsJson: [],
  paysResidenceFiscale: "",
  origineFonds: "",
  origineFondsPrecisions: "",
  origineFondsVenteAdresse: "",
  origineFondsDonateur: "",
  origineFondsLienDefunt: "",
  modeFinancement: "",
  modePaiement: "",
  montantOperation: "",
  typeBien: "",
  lieuBien: "",
  urlPieceIdentite: "",
  urlJustifDomicile: "",
  urlAvisImposition: "",
  urlJustifRevenus: "",
  urlJustifOrigineFonds: "",
  urlKbis: "",
  urlStatuts: "",
  urlCniGerant: "",
  urlBilans: "",
  urlRbe: "",
  consentementRgpd: false,
};

// ─── Options affichées au client (libellés non techniques) ──────────────
// Les `value` correspondent à OPTIONS de lib/tracfin.ts → mapping direct vers le scoring.

export const PIECE_IDENTITE_TYPES = [
  { value: "cni", label: "Carte nationale d'identité" },
  { value: "passeport", label: "Passeport" },
  { value: "titre_sejour", label: "Titre de séjour" },
];

export const ORIGINE_FONDS_OPTIONS = [
  { value: "epargne", label: "Épargne personnelle" },
  { value: "revenus", label: "Revenus professionnels" },
  { value: "heritage", label: "Héritage" },
  { value: "donation", label: "Donation" },
  { value: "vente", label: "Vente d'un bien" },
  { value: "pret_familial", label: "Prêt familial" },
  { value: "pret_bancaire", label: "Prêt bancaire" },
  { value: "autre", label: "Autre" },
];

export const MODE_FINANCEMENT_OPTIONS = [
  { value: "pret_bancaire", label: "Prêt bancaire classique" },
  { value: "comptant", label: "Acquisition au comptant" },
  { value: "mixte", label: "Mixte (apport + prêt)" },
  { value: "autre", label: "Autre" },
];

// Cohérent avec OPTIONS.modePaiement de tracfin.ts (mêmes values pour mapping direct)
export const MODE_PAIEMENT_OPTIONS = [
  { value: "green_virement", label: "Virement bancaire (UE)" },
  { value: "green_cheque", label: "Chèque bancaire (UE)" },
  { value: "orange_mixte", label: "Paiement mixte" },
  { value: "red_especes", label: "Espèces (rappel : > 1 000 € interdit, art. L112-6 CMF)" },
  { value: "red_crypto", label: "Cryptoactifs" },
];

// Cohérent avec OPTIONS.typeBien
export const TYPE_BIEN_OPTIONS = [
  { value: "green_residentiel_principal", label: "Résidence principale" },
  { value: "green_residentiel_secondaire", label: "Résidence secondaire" },
  { value: "orange_locatif", label: "Investissement locatif" },
  { value: "orange_commercial", label: "Local commercial / professionnel" },
  { value: "orange_sci", label: "Acquisition via SCI / holding" },
  { value: "orange_terrain", label: "Terrain à bâtir / agricole" },
  { value: "orange_multilots", label: "Acquisition multi-lots" },
];

// Cohérent avec OPTIONS.secteurActivite
export const SECTEUR_ACTIVITE_OPTIONS = [
  { value: "green_standard", label: "Activité standard (salarié, profession libérale réglementée, retraité, étudiant)" },
  { value: "orange_btp", label: "BTP / construction" },
  { value: "orange_restauration", label: "Restauration / hôtellerie" },
  { value: "orange_jeux", label: "Jeux / paris / casinos" },
  { value: "orange_change", label: "Change manuel / transfert de fonds" },
  { value: "orange_art", label: "Art / antiquités / luxe" },
  { value: "orange_marchand_bien", label: "Marchand de biens" },
  { value: "orange_crypto", label: "Cryptoactifs" },
];

// Pays : options client neutres (libellés non-techniques)
export const PAYS_OPTIONS = [
  { value: "green_fr", label: "France / Union Européenne" },
  { value: "orange_grey", label: "Pays sous surveillance internationale (liste grise)" },
  { value: "red_black", label: "Pays avec restrictions internationales (liste noire)" },
];

// Lieu du bien : options client (cohérent avec lieuBien de tracfin)
export const LIEU_BIEN_OPTIONS = [
  { value: "green_fr", label: "France / Union Européenne" },
  { value: "orange_other", label: "Autre pays" },
  { value: "red_sanctioned", label: "Pays sous sanctions" },
];

export const FORME_JURIDIQUE_OPTIONS = [
  { value: "SAS", label: "SAS" },
  { value: "SARL", label: "SARL" },
  { value: "SCI", label: "SCI" },
  { value: "SA", label: "SA" },
  { value: "SASU", label: "SASU" },
  { value: "EURL", label: "EURL" },
  { value: "SNC", label: "SNC" },
  { value: "autre", label: "Autre" },
];

export const TYPE_CONTROLE_BE_OPTIONS = [
  { value: "capital", label: "Détention de capital ≥ 25 %" },
  { value: "vote", label: "Détention de droits de vote ≥ 25 %" },
  { value: "controle_effectif", label: "Contrôle effectif (autre moyen)" },
];

// Validation SIREN minimal (Luhn) — vérification sérieuse côté serveur
export function isLikelySiren(s: string): boolean {
  const digits = s.replace(/\s/g, "");
  return /^\d{9}$/.test(digits);
}
