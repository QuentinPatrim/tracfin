// tests/vigilance.test.mjs — Garde-fou du moteur de vigilance du profil d'entreprise
// Run : node --experimental-strip-types tests/vigilance.test.mjs

import { buildVigilance, suggestActivitesFromNaf, ACTIVITES, CLIENTELES, OBLIGATIONS_SOCLE } from "../lib/vigilance.ts";

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "OK " : "XX "} ${name}${extra ? ` — ${extra}` : ""}`);
  cond ? pass++ : fail++;
};

// Catalogues non vides et clés uniques
const keys = [...ACTIVITES, ...CLIENTELES].map((x) => x.key);
check("Catalogues remplis", ACTIVITES.length >= 6 && CLIENTELES.length >= 4);
check("Cles uniques", new Set(keys).size === keys.length);
check("Socle obligations >= 6", OBLIGATIONS_SOCLE.length >= 6);

// Aucune sélection → aucun point conditionnel
check("Rien coche -> 0 point", buildVigilance([], []).length === 0);

// Prestige → origine des fonds + PPE en priorité haute
const prestige = buildVigilance(["prestige"], []);
check("Prestige -> origine des fonds (haute)", prestige.some((p) => p.id === "origine_fonds" && p.priorite === "haute"));
check("Prestige -> PPE (haute)", prestige.some((p) => p.id === "ppe"));

// Non-résidents → risque géographique
check("Non-residents -> geo", buildVigilance([], ["non_residents"]).some((p) => p.id === "geo"));

// Sociétés → bénéficiaires effectifs
check("Societes -> BE", buildVigilance([], ["societes"]).some((p) => p.id === "be"));

// Locatif standard ≠ luxe : pas d'origine des fonds haute pour du locatif simple
const locatif = buildVigilance(["location_gestion"], ["particuliers_fr"]);
check("Locatif simple -> pas origine_fonds", !locatif.some((p) => p.id === "origine_fonds"));
check("Locatif -> seuil 10k", locatif.some((p) => p.id === "location_seuil"));

// Tri : haute avant moyenne
const mixed = buildVigilance(["prestige", "viager"], []);
const firstMoyenne = mixed.findIndex((p) => p.priorite === "moyenne");
const lastHaute = mixed.map((p) => p.priorite).lastIndexOf("haute");
check("Tri haute -> moyenne", firstMoyenne === -1 || lastHaute < firstMoyenne);

// Déclencheurs lisibles (libellés, pas des clés)
check("Declencheurs en libelles", prestige.every((p) => p.declencheurs.every((d) => !d.includes("_"))));

// Suggestions NAF
check("NAF 68.31Z -> transaction", suggestActivitesFromNaf("68.31Z").includes("transaction_residentielle"));
check("NAF 68.32A -> syndic", suggestActivitesFromNaf("68.32A").includes("syndic"));
check("NAF inconnu -> vide", suggestActivitesFromNaf("62.01Z").length === 0);

// Déterminisme
check("Deterministe", JSON.stringify(buildVigilance(["prestige"], ["societes"])) === JSON.stringify(buildVigilance(["prestige"], ["societes"])));

console.log(`\n${pass}/${pass + fail} assertions OK`);
process.exit(fail > 0 ? 1 : 0);
