// lib/leads-labels.ts — Libellés des demandes de contact (utilisables côté navigateur)

export const TOPICS: Record<string, string> = {
  rappel: "Être rappelé",
  demo: "Démo en visio",
  question: "Une question",
};
export const SLOTS: Record<string, string> = {
  matin: "Le matin",
  midi: "Entre midi et deux",
  apresmidi: "L'après-midi",
  soir: "En fin de journée",
};
export const TEAM: Record<string, string> = {
  "1": "Seul(e)",
  "2-5": "2 à 5",
  "6-15": "6 à 15",
  "16+": "16 et plus",
};
