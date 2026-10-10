// lib/legal-refs.ts — Références d'articles citées sur le site public.
//
// Règle : on ne lie QUE vers le texte officiel (Légifrance). Une référence absente
// de cette table s'affiche en texte simple, sans lien : mieux vaut pas de lien
// qu'un lien inventé.
//
// Identifiants relevés le 10/10/2026 dans le Code monétaire et financier
// consolidé. Légifrance attribue un nouvel identifiant à chaque modification
// d'un article : à recontrôler quand un texte change (L.561-2 a été modifié en
// août 2026).

const LEGI = "https://www.legifrance.gouv.fr/codes/article_lc/";

export const LEGAL_REF_URLS: Record<string, string> = {
  "CMF L.561-1": LEGI + "LEGIARTI000020196700",
  "CMF L.561-2": LEGI + "LEGIARTI000054616568",
  "CMF L.561-4-1": LEGI + "LEGIARTI000041577873",
  "CMF L.561-5": LEGI + "LEGIARTI000033517742",
  "CMF L.561-8": LEGI + "LEGIARTI000041577826",
  "CMF L.561-10": LEGI + "LEGIARTI000053153188",
  "CMF L.561-10-1": LEGI + "LEGIARTI000033517667",
  "CMF L.561-10-2": LEGI + "LEGIARTI000033517652",
  "CMF L.561-12": LEGI + "LEGIARTI000041577784",
  "CMF L.561-15": LEGI + "LEGIARTI000033517847",
  "CMF L.561-16": LEGI + "LEGIARTI000033517822",
  "CMF L.561-34": LEGI + "LEGIARTI000051752621",
  "CMF L.561-40": LEGI + "LEGIARTI000033517988",
  "CMF L.562-4": LEGI + "LEGIARTI000045250683",
};

export function legalRefUrl(code: string): string | undefined {
  return LEGAL_REF_URLS[code];
}
