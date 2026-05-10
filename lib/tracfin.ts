// lib/tracfin.ts — Scoring LCB-FT v2 (algo_version="v2")
// Référentiel : CMF L561-1 et suivants, Décret 2018-284, Règl. (UE) 2024/1624,
// Lignes directrices DGCCRF/TRACFIN secteur immobilier.

export type Risk = "green" | "orange" | "red";

// ─── Niveaux de vigilance v2 — labels CMF officiels ──────────────────────
export type Niveau =
  | "vigilance_standard"   // L561-5 à L561-8
  | "vigilance_renforcee"  // L561-10
  | "examen_renforce"      // L561-10-2
  | "interdiction";        // L561-15 + Règl. (UE) 2024/1624

export const NIVEAU_CFG: Record<Niveau, {
  label: string;
  ref: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  action: string;
}> = {
  vigilance_standard: {
    label: "Vigilance standard — Conforme",
    ref: "CMF L561-5 à L561-8",
    color: "#34D399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.3)",
    glow: "rgba(52,211,153,0.12)",
    action: "Traiter normalement. Archivage 5 ans (L561-12-1).",
  },
  vigilance_renforcee: {
    label: "Vigilance renforcée requise",
    ref: "CMF L561-10",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.3)",
    glow: "rgba(251,146,60,0.12)",
    action: "Justificatifs additionnels + validation correspondant LCB-FT.",
  },
  examen_renforce: {
    label: "Examen renforcé",
    ref: "CMF L561-10-2",
    color: "#F87171",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.35)",
    glow: "rgba(248,113,113,0.15)",
    action: "Suspension immédiate de la transaction. Délibération formalisée.",
  },
  interdiction: {
    label: "Interdiction & déclaration",
    ref: "CMF L561-15 + Règl. (UE) 2024/1624",
    color: "#1F2937",
    bg: "rgba(31,41,55,0.10)",
    border: "rgba(31,41,55,0.40)",
    glow: "rgba(220,38,38,0.20)",
    action: "Refus de relation d'affaires. Déclaration de soupçon TRACFIN sous 48h.",
  },
};

// ─── Pays GAFI (à actualiser à chaque plénière — fév/juin/oct) ───────────
export const PAYS_NOIRE = ["Corée du Nord", "Iran", "Myanmar (Birmanie)"];

export const PAYS_GRISE_REGIONS = [
  { region: "Afrique", pays: ["Algérie", "Angola", "Cameroun", "Côte d'Ivoire", "Kenya", "Namibie", "Tchad"] },
  { region: "Europe", pays: ["Bulgarie", "Monaco (sous réserve 2026)", "Moldavie"] },
  { region: "Moyen-Orient & Asie", pays: ["Liban", "Syrie", "Yémen", "Vietnam", "Philippines", "Laos", "Népal"] },
  { region: "Amériques", pays: ["Bolivie", "Haïti", "Venezuela"] },
];

// ─── Options des champs à risque ─────────────────────────────────────────
export interface Option {
  value: string;
  label: string;
  risk: Risk;
}

export const OPTIONS: Record<string, Option[]> = {
  residenceFiscale: [
    { value: "green_fr", label: "France / Union Européenne", risk: "green" },
    { value: "orange_grey", label: "Pays liste grise GAFI", risk: "orange" },
    { value: "red_black", label: "Pays liste noire GAFI", risk: "red" },
  ],
  paysNationalite: [
    { value: "green_fr", label: "France / Union Européenne", risk: "green" },
    { value: "orange_grey", label: "Pays liste grise GAFI", risk: "orange" },
    { value: "red_black", label: "Pays liste noire GAFI", risk: "red" },
  ],
  lieuBien: [
    { value: "green_fr", label: "France / Union Européenne", risk: "green" },
    { value: "orange_other", label: "Autre pays", risk: "orange" },
    { value: "red_sanctioned", label: "Pays sous sanctions", risk: "red" },
  ],
  comportement: [
    { value: "green", label: "Normal — coopératif et transparent", risk: "green" },
    { value: "orange", label: "Réticent ou imprécis", risk: "orange" },
    { value: "red", label: "Refus, fausses informations ou incohérences avérées", risk: "red" },
  ],
  origineFonds: [
    { value: "green_epargne", label: "Épargne personnelle (justifiée)", risk: "green" },
    { value: "green_revenus", label: "Revenus professionnels (justifiés)", risk: "green" },
    { value: "green_heritage", label: "Héritage / donation justifiée", risk: "green" },
    { value: "green_vente_doc", label: "Vente d'un bien documentée", risk: "green" },
    { value: "orange_donation", label: "Donation non documentée", risk: "orange" },
    { value: "orange_pret_fam", label: "Prêt familial", risk: "orange" },
    { value: "orange_vente", label: "Vente de bien (non prouvée)", risk: "orange" },
    { value: "red_inconnu", label: "Origine inconnue ou non documentée", risk: "red" },
    { value: "red_cash", label: "Espèces sans justification", risk: "red" },
  ],
  montageFinancier: [
    { value: "green_pret", label: "Prêt bancaire UE classique", risk: "green" },
    { value: "orange_comptant", label: "Acquisition au comptant", risk: "orange" },
    { value: "orange_complexe", label: "Montage complexe (holding, multi-niveaux)", risk: "orange" },
    { value: "red_offshore", label: "Structure offshore / anonyme / fiducie", risk: "red" },
  ],
  modePaiement: [
    { value: "green_virement", label: "Virement bancaire UE", risk: "green" },
    { value: "green_cheque", label: "Chèque bancaire UE", risk: "green" },
    { value: "orange_mixte", label: "Paiement mixte", risk: "orange" },
    { value: "red_especes", label: "Espèces > 1 000 € (interdit, art. L112-6 CMF)", risk: "red" },
    { value: "red_crypto", label: "Cryptoactifs", risk: "red" },
  ],
  coherencePrix: [
    { value: "green", label: "Cohérent avec le marché (DVF)", risk: "green" },
    { value: "orange", label: "Atypique (écart ± 20%)", risk: "orange" },
    { value: "red", label: "Très anormal — suspicion (> ± 40%)", risk: "red" },
  ],
  typeBien: [
    { value: "green_residentiel_principal", label: "Résidentiel — résidence principale", risk: "green" },
    { value: "green_residentiel_secondaire", label: "Résidentiel — résidence secondaire", risk: "green" },
    { value: "orange_locatif", label: "Investissement locatif", risk: "orange" },
    { value: "orange_commercial", label: "Local commercial / professionnel", risk: "orange" },
    { value: "orange_sci", label: "Acquisition via SCI / holding", risk: "orange" },
    { value: "orange_terrain", label: "Terrain à bâtir / agricole", risk: "orange" },
    { value: "orange_multilots", label: "Acquisition multi-lots", risk: "orange" },
  ],
  secteurActivite: [
    { value: "green_standard", label: "Activité standard (salarié, profession libérale réglementée)", risk: "green" },
    { value: "orange_btp", label: "BTP / construction", risk: "orange" },
    { value: "orange_restauration", label: "Restauration / hôtellerie", risk: "orange" },
    { value: "orange_jeux", label: "Jeux / paris / casinos", risk: "orange" },
    { value: "orange_change", label: "Change manuel / transfert de fonds", risk: "orange" },
    { value: "orange_art", label: "Art / antiquités / luxe", risk: "orange" },
    { value: "orange_marchand_bien", label: "Marchand de biens", risk: "orange" },
    { value: "orange_crypto", label: "Cryptoactifs", risk: "orange" },
  ],
  rbe: [
    { value: "green_physique", label: "Personne physique (RBE non requis)", risk: "green" },
    { value: "green_registre", label: "RBE déclaré au RNE/INPI, justification fournie", risk: "green" },
    { value: "orange_partiel", label: "RBE partiellement identifié", risk: "orange" },
    { value: "red_aucun", label: "Aucun document RBE fourni", risk: "red" },
  ],
  formation: [
    { value: "green", label: "Collaborateur formé Tracfin (L561-34)", risk: "green" },
    { value: "red", label: "Non formé", risk: "red" },
  ],
};

export const RISK_LABELS: Record<string, string> = {
  rbe: "Bénéficiaires Effectifs",
  residenceFiscale: "Résidence Fiscale",
  paysNationalite: "Nationalité",
  lieuBien: "Lieu du bien",
  comportement: "Comportement",
  origineFonds: "Origine des Fonds",
  montageFinancier: "Montage Financier",
  modePaiement: "Mode de Paiement",
  coherencePrix: "Cohérence Prix",
  typeBien: "Type de Bien",
  secteurActivite: "Activité Professionnelle",
  formation: "Formation Tracfin",
};

export const RISK_CFG: Record<Risk, { color: string; bg: string; border: string; glow: string; label: string }> = {
  green: { color: "#34D399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", glow: "rgba(52,211,153,0.35)", label: "Conforme" },
  orange: { color: "#FB923C", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.3)", glow: "rgba(251,146,60,0.35)", label: "Vigilance" },
  red: { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", glow: "rgba(248,113,113,0.35)", label: "Critique" },
};

// ─── Type des proches PPE (L561-10 1°) ───────────────────────────────────
export type PpeLien = "conjoint" | "parent" | "enfant" | "fratrie" | "beau_parent" | "associe_etroit";

export interface PpeProche {
  lien: PpeLien;
  nom: string;
  fonction: string;
}

export const PPE_LIEN_LABELS: Record<PpeLien, string> = {
  conjoint: "Conjoint / partenaire",
  parent: "Parent",
  enfant: "Enfant",
  fratrie: "Frère ou sœur",
  beau_parent: "Beau-parent",
  associe_etroit: "Associé étroit (pers. morale détenue conjointement)",
};

// ─── Formulaire (étendu v2) ──────────────────────────────────────────────
export interface DossierForm {
  // Identité
  typeClient: "physique" | "morale";
  nomPrenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  paysNationalite: string;          // v2 — risque géographique sur la nationalité
  adresse: string;
  profession: string;
  comportement: string;             // jugement employé sur la coopération du client
  secteurActivite: string;          // v2 — secteur cash-intensive
  dateDetection: string;
  lienKyc: string;

  // Pièces
  pieceIdentite: boolean;
  justifDomicile: boolean;
  kbis: boolean;
  statuts: boolean;
  cniGerant: boolean;

  // Sanctions et obligations absolues (gates)
  gelAvoirs: boolean | null;        // D1 — gate
  gelDate: string;
  sanctionsListe: boolean | null;   // v2 — D2 — gate

  // PPE étendue (L561-10 1°)
  ppe: boolean | null;              // client lui-même
  ppeProches: PpeProche[];          // v2 — entourage proche
  ppeProcheDetecte: boolean | null; // v2 — au moins un proche est PPE

  // Risque géographique
  residenceFiscale: string;
  lieuBien: string;                 // v2

  // Risque transactionnel
  origineFonds: string;
  justifFonds: string;
  montageFinancier: string;
  modePaiement: string;             // v2
  coherencePrix: string;
  justifPrix: string;
  typeBien: string;                 // v2
  montantTransaction: string;       // v2 — saisi en €

  // Bénéficiaires effectifs
  rbe: string;

  // Conformité interne
  nomEmploye: string;
  formation: string;
  responsableLCBFT: string;
}

export const initialForm: DossierForm = {
  typeClient: "physique",
  nomPrenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  paysNationalite: "",
  adresse: "",
  profession: "",
  comportement: "",
  secteurActivite: "",
  dateDetection: new Date().toISOString().slice(0, 10),
  lienKyc: "",
  pieceIdentite: false,
  justifDomicile: false,
  kbis: false,
  statuts: false,
  cniGerant: false,
  gelAvoirs: null,
  gelDate: "",
  sanctionsListe: null,
  ppe: null,
  ppeProches: [],
  ppeProcheDetecte: null,
  residenceFiscale: "",
  lieuBien: "",
  origineFonds: "",
  justifFonds: "",
  montageFinancier: "",
  modePaiement: "",
  coherencePrix: "",
  justifPrix: "",
  typeBien: "",
  montantTransaction: "",
  rbe: "",
  nomEmploye: "",
  formation: "",
  responsableLCBFT: "",
};

// ─── Algo log : trace opposable (preuve d'audit) ─────────────────────────
export interface AlgoLogEntry {
  critere: string;
  valeur: string;
  risk: Risk | "gate";
  motif: string;
}

export interface ScoreResult {
  niveau: Niveau;
  algoVersion: "v2";
  risks: Record<string, Risk | null>;
  triggers: AlgoLogEntry[];           // critères qui ont compté
  ppeDetectee: boolean;               // client OU entourage
  payIsolement: boolean;              // pays GAFI grise/noire (B1/B2/B3)
  structureComplexe: boolean;         // SCI / holding / offshore
  origineFondsNonDoc: boolean;
  cashInterdit: boolean;              // espèces > 1 000 € (L112-6 CMF)

  // ─ Rétro-compat affichage : exposés pour les composants pas encore refaits
  statutKey: StatutKeyV1;             // dérivé de niveau, à supprimer après refonte UI
  pct: number;                         // % de critères "verts", utilisé pour barre de progression legacy
  gelCritique: boolean;
  ppeVigilance: boolean;
}

const RISK_CRITERES = [
  "rbe", "residenceFiscale", "paysNationalite", "lieuBien", "comportement",
  "origineFonds", "montageFinancier", "modePaiement", "coherencePrix",
  "typeBien", "secteurActivite", "formation",
] as const;

function getRisk(key: string, val: string): Risk | null {
  return OPTIONS[key]?.find((o) => o.value === val)?.risk ?? null;
}

function motifFor(key: string, val: string): string {
  const opt = OPTIONS[key]?.find((o) => o.value === val);
  return opt ? `${RISK_LABELS[key]} : ${opt.label}` : RISK_LABELS[key] ?? key;
}

// ─── Le scoring v2 — opposable, déterministe, traçable ──────────────────
export function computeScore(form: DossierForm): ScoreResult {
  const risks: Record<string, Risk | null> = {};
  for (const c of RISK_CRITERES) {
    risks[c] = getRisk(c, form[c as keyof DossierForm] as string);
  }

  const triggers: AlgoLogEntry[] = [];

  // ─ Gates absolues ─
  if (form.gelAvoirs === true) {
    triggers.push({
      critere: "gel_avoirs",
      valeur: "true",
      risk: "gate",
      motif: "Personne sous gel des avoirs (D1) — Règl. (UE) 2580/2001 + L562-1 CMF",
    });
  }
  if (form.sanctionsListe === true) {
    triggers.push({
      critere: "sanctions_internationales",
      valeur: "true",
      risk: "gate",
      motif: "Personne sur liste de sanctions internationales (D2) — UE/ONU/Trésor",
    });
  }

  if (triggers.some((t) => t.risk === "gate")) {
    return finalize("interdiction", form, risks, triggers);
  }

  // ─ Critères individuels (rouge / orange) ─
  for (const c of RISK_CRITERES) {
    const r = risks[c];
    const v = form[c as keyof DossierForm] as string;
    if (r === "red" || r === "orange") {
      triggers.push({ critere: c, valeur: v, risk: r, motif: motifFor(c, v) });
    }
  }

  // ─ PPE étendue (L561-10 1°) ─
  const ppeDetectee = form.ppe === true || form.ppeProcheDetecte === true;
  if (ppeDetectee) {
    triggers.push({
      critere: "ppe",
      valeur: form.ppe ? "client" : "entourage",
      risk: "orange",
      motif: form.ppe
        ? "Personne politiquement exposée — client (L561-10 1°)"
        : "Personne politiquement exposée détectée dans l'entourage proche (L561-10 1°)",
    });
  }

  // ─ Espèces > 1 000 € interdit (L112-6 CMF) ─
  const cashInterdit = form.modePaiement === "red_especes";

  // ─ Pays GAFI grise/noire (B1, B2, B3) ─
  const payIsolement =
    risks.residenceFiscale === "orange" || risks.residenceFiscale === "red" ||
    risks.paysNationalite === "orange" || risks.paysNationalite === "red" ||
    risks.lieuBien === "orange" || risks.lieuBien === "red";

  // ─ Structure complexe ─
  const structureComplexe =
    form.montageFinancier === "orange_complexe" ||
    form.montageFinancier === "red_offshore" ||
    form.typeBien === "orange_sci";

  // ─ Origine des fonds non documentée ─
  const origineFondsNonDoc =
    form.origineFonds.startsWith("orange_") ||
    form.origineFonds.startsWith("red_");

  // ─ Décision niveau ─
  const hasRed = Object.values(risks).some((r) => r === "red");
  const orangeCount = Object.values(risks).filter((r) => r === "orange").length;

  let niveau: Niveau;
  if (hasRed || cashInterdit) {
    niveau = "examen_renforce";
  } else if (
    ppeDetectee || payIsolement || structureComplexe ||
    origineFondsNonDoc || orangeCount >= 2
  ) {
    niveau = "vigilance_renforcee";
  } else {
    niveau = "vigilance_standard";
  }

  return finalize(niveau, form, risks, triggers);
}

const NIVEAU_TO_V1: Record<Niveau, StatutKeyV1> = {
  vigilance_standard: "valid",
  vigilance_renforcee: "vigilance",
  examen_renforce: "critical",
  interdiction: "critical",
};

function finalize(
  niveau: Niveau,
  form: DossierForm,
  risks: Record<string, Risk | null>,
  triggers: AlgoLogEntry[]
): ScoreResult {
  const ppeDetectee = form.ppe === true || form.ppeProcheDetecte === true;
  const evaluated = Object.values(risks).filter((v): v is Risk => v !== null);
  const pct = evaluated.length
    ? Math.round((evaluated.filter((v) => v === "green").length / evaluated.length) * 100)
    : 0;

  return {
    niveau,
    algoVersion: "v2",
    risks,
    triggers,
    ppeDetectee,
    payIsolement:
      risks.residenceFiscale === "orange" || risks.residenceFiscale === "red" ||
      risks.paysNationalite === "orange" || risks.paysNationalite === "red" ||
      risks.lieuBien === "orange" || risks.lieuBien === "red",
    structureComplexe:
      form.montageFinancier === "orange_complexe" ||
      form.montageFinancier === "red_offshore" ||
      form.typeBien === "orange_sci",
    origineFondsNonDoc:
      form.origineFonds.startsWith("orange_") || form.origineFonds.startsWith("red_"),
    cashInterdit: form.modePaiement === "red_especes",

    statutKey: NIVEAU_TO_V1[niveau],
    pct,
    gelCritique: form.gelAvoirs === true,
    ppeVigilance: ppeDetectee,
  };
}

// ─── Rétro-compatibilité v1 — affichage des anciens dossiers ─────────────
// Les dossiers algo_version='v1' ont un `statut` ('valid'/'vigilance'/'stop'/'critical').
// On les mappe vers les libellés v2 SANS recalculer (preuve d'audit : on respecte
// le verdict rendu à l'époque).
export type StatutKeyV1 = "valid" | "vigilance" | "stop" | "critical";

export const V1_TO_NIVEAU: Record<StatutKeyV1, Niveau> = {
  valid: "vigilance_standard",
  vigilance: "vigilance_renforcee",
  stop: "vigilance_renforcee",
  critical: "examen_renforce",
};

// Export legacy pour anciens consommateurs encore en place — à supprimer après refonte UI complète
export type StatutKey = StatutKeyV1;
export const STATUS_CFG: Record<StatutKeyV1, {
  color: string; border: string; bg: string; glow: string; title: string; sub: string;
}> = {
  valid: {
    ...NIVEAU_CFG.vigilance_standard,
    title: NIVEAU_CFG.vigilance_standard.label,
    sub: NIVEAU_CFG.vigilance_standard.action,
  },
  vigilance: {
    ...NIVEAU_CFG.vigilance_renforcee,
    title: NIVEAU_CFG.vigilance_renforcee.label,
    sub: NIVEAU_CFG.vigilance_renforcee.action,
  },
  stop: {
    ...NIVEAU_CFG.vigilance_renforcee,
    title: NIVEAU_CFG.vigilance_renforcee.label,
    sub: NIVEAU_CFG.vigilance_renforcee.action,
  },
  critical: {
    ...NIVEAU_CFG.examen_renforce,
    title: NIVEAU_CFG.examen_renforce.label,
    sub: NIVEAU_CFG.examen_renforce.action,
  },
};
