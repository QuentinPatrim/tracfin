// components/dashboard/dossierStage.ts — Où en est un dossier, et que faire ensuite
//
// Un dossier passe par quatre étapes, toujours dans cet ordre :
//   1. Lien envoyé        → on attend la fiche du client
//   2. Fiche reçue        → l'analyse est pré-remplie, l'agent la vérifie et
//                           l'enregistre : c'est là que Klaris calcule le niveau
//   3. Analyse vérifiée   → la marche à suivre du niveau s'affiche
//   4. Suite donnée       → rien d'autre à faire (vigilance standard : d'emblée)
// La « prochaine action » est la phrase qu'on montre à l'agent, partout pareille
// (liste des dossiers, aperçu, fiche).

import type { Niveau } from "@/lib/tracfin";
import { marcheProgress } from "./MarcheASuivre";

export type Stage = "attente" | "verifier" | "suite" | "fait";

export interface StageInput {
  id: string;
  name: string;
  partie?: "vendeur" | "acquereur" | null;
  kycReceived: boolean;
  niveau: Niveau | null;
}

export interface NextAction {
  stage: Stage;
  /** Index de l'étape du fil (0 à 3) en cours ; 4 = tout est fait. */
  step: number;
  /** Phrase courte, à l'infinitif ou constat. */
  label: string;
  /** Précision d'une ligne. */
  hint: string;
}

export const STAGE_STEPS = ["Lien envoyé", "Fiche reçue", "Analyse vérifiée", "Suite donnée"] as const;

/** Lit la marche à suivre dans le navigateur : à appeler côté client uniquement. */
export function nextAction(d: StageInput): NextAction {
  if (!d.kycReceived) {
    return { stage: "attente", step: 1, label: "Attendre la fiche du client", hint: "Le lien lui a été envoyé. Vous pouvez le relancer depuis le dossier." };
  }
  if (!d.niveau) {
    return { stage: "verifier", step: 2, label: "Vérifier l'analyse et l'enregistrer", hint: "Elle est pré-remplie avec la fiche du client. Klaris calcule le niveau à l'enregistrement." };
  }
  if (d.niveau === "vigilance_standard") {
    return { stage: "fait", step: 4, label: "Rien à faire", hint: "Vigilance standard : l'attestation est prête, le dossier est conservé cinq ans." };
  }
  const m = marcheProgress(d.id, d.niveau, d.name, d.partie === "vendeur" ? "vendeur" : "acquereur");
  if (!m.current) {
    return { stage: "fait", step: 4, label: "Suite donnée", hint: "Toutes les étapes de la marche à suivre sont faites." };
  }
  return { stage: "suite", step: 3, label: m.current, hint: `Suite à donner · étape ${m.done + 1} sur ${m.total}` };
}
