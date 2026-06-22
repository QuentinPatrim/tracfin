// tests/tracfin-score.test.mjs — Garde-fou du moteur de score LCB-FT (lib/tracfin.ts)
// Run : node --experimental-strip-types tests/tracfin-score.test.mjs
//
// Vérifie les invariants critiques : un dossier 100 % vert est conforme (garde
// aussi le verdict de l'aperçu PDF marketing), et les signaux durs (gel, sanctions,
// espèces, PPE, origine inconnue, GAFI) font sortir de la vigilance standard.

import { computeScore, initialForm } from "../lib/tracfin.ts";

// Dossier acquéreur 100 % conforme (identique à lib/demo-pdf.ts).
const conforme = {
  ...initialForm,
  typeClient: "physique",
  partie: "acquereur",
  nomPrenom: "Rousseau Camille",
  paysNationalite: "green_fr",
  comportement: "green",
  secteurActivite: "green_standard",
  pieceIdentite: true,
  justifDomicile: true,
  gelAvoirs: false,
  sanctionsListe: false,
  ppe: false,
  ppeProcheDetecte: false,
  residenceFiscale: "green_fr",
  lieuBien: "green_fr",
  origineFonds: "green_epargne",
  montageFinancier: "green_pret",
  modePaiement: "green_virement",
  coherencePrix: "green",
  typeBien: "green_residentiel_principal",
  montantTransaction: "320000",
  rbe: "green_physique",
  formation: "green",
};

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "OK " : "XX "} ${name}${extra ? ` — ${extra}` : ""}`);
  cond ? pass++ : fail++;
};

const withOverride = (o) => computeScore({ ...conforme, ...o });

const base = computeScore(conforme);
check("Dossier 100% vert -> vigilance_standard", base.niveau === "vigilance_standard", `niveau=${base.niveau}`);
check("Gel d'avoirs -> interdiction", withOverride({ gelAvoirs: true }).niveau === "interdiction");
check("Sanctions internationales -> interdiction", withOverride({ sanctionsListe: true }).niveau === "interdiction");
check("Especes > 1000EUR -> pas standard", withOverride({ modePaiement: "red_especes" }).niveau !== "vigilance_standard");
check("Client PPE -> pas standard", withOverride({ ppe: true }).niveau !== "vigilance_standard");
check("Origine des fonds inconnue -> pas standard", withOverride({ origineFonds: "red_inconnu" }).niveau !== "vigilance_standard");
check("Pays liste noire GAFI -> pas standard", withOverride({ paysNationalite: "red_black" }).niveau !== "vigilance_standard");
check("Deterministe", computeScore(conforme).niveau === base.niveau);

console.log(`\n${pass}/${pass + fail} assertions OK`);
process.exit(fail > 0 ? 1 : 0);
