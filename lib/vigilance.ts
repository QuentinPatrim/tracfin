// lib/vigilance.ts — Moteur de vigilance du profil d'entreprise
//
// À partir des activités exercées et des typologies de clientèle déclarées,
// dérive DE FAÇON DÉTERMINISTE (auditable, reproductible — même ADN que le
// scoring v2) : les obligations LCB-FT applicables et les points de vigilance
// prioritaires, avec références CMF.
//
// Partagé client/serveur (fonctions pures, aucune dépendance).

export interface CatalogItem {
  key: string;
  label: string;
  desc: string;
}

/* ── Activités exercées (agents immobiliers — périmètre lancement) ── */

export const ACTIVITES: CatalogItem[] = [
  { key: "transaction_residentielle", label: "Transaction résidentielle", desc: "Vente / achat de logements classiques" },
  { key: "prestige", label: "Immobilier de prestige", desc: "Biens de luxe, montants élevés (≥ 1 M€)" },
  { key: "location_gestion", label: "Location & gestion locative", desc: "Mise en location, gestion pour compte de tiers" },
  { key: "immobilier_commercial", label: "Immobilier commercial", desc: "Locaux commerciaux, bureaux, fonds de commerce" },
  { key: "immobilier_neuf", label: "Neuf / VEFA", desc: "Commercialisation de programmes neufs" },
  { key: "viager", label: "Viager", desc: "Ventes en viager (bouquet + rente)" },
  { key: "marchand_biens", label: "Marchand de biens", desc: "Achat-revente pour compte propre" },
  { key: "syndic", label: "Syndic de copropriété", desc: "Administration d'immeubles en copropriété" },
];

/* ── Typologies de clientèle ── */

export const CLIENTELES: CatalogItem[] = [
  { key: "particuliers_fr", label: "Particuliers résidents France", desc: "Clientèle domestique classique" },
  { key: "non_residents", label: "Non-résidents / internationaux", desc: "Acquéreurs ou vendeurs établis à l'étranger" },
  { key: "investisseurs", label: "Investisseurs", desc: "Multi-acquisitions, locatif, défiscalisation" },
  { key: "societes", label: "Sociétés (SCI, holdings…)", desc: "Personnes morales, structures patrimoniales" },
  { key: "fortunes", label: "Patrimoines élevés", desc: "Clientèle fortunée (HNW), family offices" },
];

/* ── Obligations socle (loi Hoguet → assujettissement L.561-2 8°) ── */

export interface Obligation {
  titre: string;
  detail: string;
  ref: string;
}

export const OBLIGATIONS_SOCLE: Obligation[] = [
  {
    titre: "Identification client (KYC) systématique",
    detail: "Identité vérifiée et bénéficiaires effectifs identifiés dès l'entrée en relation d'affaires, avant tout acte.",
    ref: "CMF L.561-5 et L.561-5-1",
  },
  {
    titre: "Classification des risques de l'activité",
    detail: "Cartographie écrite des risques adaptée à vos activités et à votre clientèle, tenue à jour.",
    ref: "CMF L.561-4-1",
  },
  {
    titre: "Vigilance constante jusqu'à l'acte",
    detail: "Cohérence de l'opération suivie pendant toute la relation (changement d'acquéreur, de financement, de structure).",
    ref: "CMF L.561-6",
  },
  {
    titre: "Conservation des dossiers 5 ans",
    detail: "Pièces d'identification et documents de vigilance conservés cinq ans après la fin de la relation.",
    ref: "CMF L.561-12-1",
  },
  {
    titre: "Déclaration de soupçon TRACFIN",
    detail: "Déclaration dès qu'un doute raisonnable persiste après vérifications — sans avoir à prouver la fraude.",
    ref: "CMF L.561-15",
  },
  {
    titre: "Formation LCB-FT de l'équipe",
    detail: "Formation à l'embauche puis continue, documentée (décret du 24 avril 2026) : nom, date, durée, contenu, organisme.",
    ref: "CMF L.561-34",
  },
];

/* ── Points de vigilance conditionnels ── */

export interface VigilancePoint {
  id: string;
  titre: string;
  detail: string;
  priorite: "haute" | "moyenne";
  ref: string;
  /** Libellés (activité/clientèle) qui ont déclenché ce point — affiché à l'utilisateur. */
  declencheurs: string[];
}

interface Rule {
  id: string;
  titre: string;
  detail: string;
  priorite: "haute" | "moyenne";
  ref: string;
  activites?: string[];
  clienteles?: string[];
}

const RULES: Rule[] = [
  {
    id: "origine_fonds",
    titre: "Origine des fonds : documentation systématique",
    detail: "Sur les montants élevés, exigez des justificatifs d'origine des fonds probants (relevés, actes, attestations) — c'est le premier point contrôlé.",
    priorite: "haute",
    ref: "CMF L.561-10-2",
    activites: ["prestige", "marchand_biens"],
    clienteles: ["fortunes"],
  },
  {
    id: "ppe",
    titre: "Exposition PPE (personnes politiquement exposées)",
    detail: "Clientèle fortunée ou internationale : vérifiez systématiquement le statut PPE du client ET de son entourage proche.",
    priorite: "haute",
    ref: "CMF L.561-10 1°",
    activites: ["prestige"],
    clienteles: ["fortunes", "non_residents"],
  },
  {
    id: "geo",
    titre: "Risque géographique (listes GAFI)",
    detail: "Non-résidents : contrôlez la résidence fiscale et la provenance des flux contre les listes grise et noire du GAFI.",
    priorite: "haute",
    ref: "CMF L.561-10 3°",
    clienteles: ["non_residents"],
  },
  {
    id: "be",
    titre: "Bénéficiaires effectifs des structures",
    detail: "SCI, holdings, montages à étages : remontez systématiquement jusqu'aux personnes physiques (registre RBE + justification).",
    priorite: "haute",
    ref: "CMF L.561-2-2",
    clienteles: ["societes"],
  },
  {
    id: "multi",
    titre: "Multi-acquisitions : cohérence patrimoniale",
    detail: "Investisseurs en série : vérifiez la cohérence entre le rythme d'acquisition, les revenus et le patrimoine déclaré.",
    priorite: "moyenne",
    ref: "CMF L.561-6",
    clienteles: ["investisseurs"],
  },
  {
    id: "location_seuil",
    titre: "Locations ≥ 10 000 € par mois",
    detail: "L'activité de location est assujettie au-delà de 10 000 € de loyer mensuel : appliquez le KYC complet sur ces mandats.",
    priorite: "moyenne",
    ref: "CMF L.561-2 8°",
    activites: ["location_gestion"],
  },
  {
    id: "commercial_activite",
    titre: "Locaux commerciaux : activité de l'occupant",
    detail: "Vérifiez l'activité réelle de l'acquéreur/locataire (secteurs cash-intensive : restauration, change, jeux…).",
    priorite: "moyenne",
    ref: "Lignes directrices DGCCRF",
    activites: ["immobilier_commercial"],
  },
  {
    id: "vefa",
    titre: "VEFA : traçabilité des appels de fonds",
    detail: "Sur le neuf, suivez la cohérence du plan de financement à chaque appel de fonds, pas seulement à la réservation.",
    priorite: "moyenne",
    ref: "CMF L.561-6",
    activites: ["immobilier_neuf"],
  },
  {
    id: "viager_coherence",
    titre: "Viager : cohérence bouquet / rente",
    detail: "Un bouquet anormalement élevé ou une rente incohérente avec l'espérance de vie sont des signaux d'alerte typiques.",
    priorite: "moyenne",
    ref: "Typologies TRACFIN",
    activites: ["viager"],
  },
  {
    id: "compte_propre",
    titre: "Marchand de biens : montages en compte propre",
    detail: "Achat-revente rapide, chaînes de SCI, financements atypiques : documentez chaque maillon de vos propres opérations.",
    priorite: "moyenne",
    ref: "Typologies TRACFIN",
    activites: ["marchand_biens"],
  },
];

/* ── Moteur ── */

const labelOf = (key: string): string =>
  ACTIVITES.find((a) => a.key === key)?.label ?? CLIENTELES.find((c) => c.key === key)?.label ?? key;

/**
 * Dérive les points de vigilance depuis les activités + clientèles déclarées.
 * Déterministe : mêmes entrées → mêmes sorties, triées haute → moyenne.
 */
export function buildVigilance(activites: string[], clienteles: string[]): VigilancePoint[] {
  const points: VigilancePoint[] = [];
  for (const rule of RULES) {
    const hitA = (rule.activites ?? []).filter((a) => activites.includes(a));
    const hitC = (rule.clienteles ?? []).filter((c) => clienteles.includes(c));
    if (hitA.length === 0 && hitC.length === 0) continue;
    points.push({
      id: rule.id,
      titre: rule.titre,
      detail: rule.detail,
      priorite: rule.priorite,
      ref: rule.ref,
      declencheurs: [...hitA, ...hitC].map(labelOf),
    });
  }
  return points.sort((a, b) => (a.priorite === b.priorite ? 0 : a.priorite === "haute" ? -1 : 1));
}

/** Suggère des activités pré-cochées à partir du code NAF du registre. */
export function suggestActivitesFromNaf(nafCode: string): string[] {
  if (nafCode.startsWith("68.31")) return ["transaction_residentielle"];
  if (nafCode === "68.32A") return ["syndic", "location_gestion"];
  if (nafCode.startsWith("68.32")) return ["location_gestion"];
  if (nafCode.startsWith("68.20")) return ["location_gestion"];
  if (nafCode.startsWith("68.10")) return ["marchand_biens"];
  if (nafCode.startsWith("41.10")) return ["immobilier_neuf"];
  return [];
}
