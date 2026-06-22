// tests/tour-placement.test.mjs — La carte de visite guidée ne recouvre jamais sa cible
// Run : node --experimental-strip-types tests/tour-placement.test.mjs

import { computeCardLayout } from "../lib/tourPlacement.ts";

const VW = 790, VH = 1100;
const opts = { defaultW: 372, cardH: 420, gap: 14, margin: 16 };

const scenarios = [
  { name: "Panneau detail (haut, a droite)", target: { left: 375, top: 110, width: 400, height: 900 } },
  { name: "Liste (haute, a gauche)",          target: { left: 16, top: 200, width: 340, height: 600 } },
  { name: "KPI row (large, en haut)",         target: { left: 16, top: 120, width: 758, height: 90 } },
  { name: "Nav top (large, tout en haut)",    target: { left: 200, top: 12, width: 380, height: 40 } },
  { name: "Bouton Nouveau dossier (petit)",   target: { left: 640, top: 70, width: 130, height: 38 } },
];

function intersect(a, b) {
  return !(a.left + a.width <= b.left || b.left + b.width <= a.left ||
           a.top + a.height <= b.top || b.top + b.height <= a.top);
}

let pass = 0, fail = 0;
const check = (ok, name) => { console.log(`${ok ? "OK " : "XX "} ${name}`); ok ? pass++ : fail++; };

for (const sc of scenarios) {
  const L = computeCardLayout(sc.target, VW, VH, opts);
  const card = { left: L.left, top: L.top, width: L.width, height: Math.min(opts.cardH, L.maxHeight) };
  const ok = !intersect(card, sc.target) && L.left >= -1 && L.left + L.width <= VW + 1 && L.width >= 240;
  check(ok, `${sc.name} (cote=${L.side})`);
}

const extreme = computeCardLayout({ left: 10, top: 10, width: 770, height: 1080 }, VW, VH, opts);
check(extreme.side === "center", "Cible plein ecran -> repli centre");
const scene = computeCardLayout(null, VW, VH, { ...opts, defaultW: 430, isScene: true });
check(scene.side === "center" && scene.arrowEdge === null, "Scene centree");

console.log(`\n${pass}/${pass + fail} assertions OK`);
process.exit(fail > 0 ? 1 : 0);
