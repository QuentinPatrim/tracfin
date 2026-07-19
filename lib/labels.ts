// lib/labels.ts — Résolution des codes internes en libellés français lisibles
//
// L'app manipule deux référentiels de codes : ceux du scoring (lib/tracfin,
// ex. "green_epargne", "red_black") et ceux du formulaire KYC (lib/kyc,
// ex. "epargne", "pret_bancaire"). Aucun code brut ne doit JAMAIS apparaître
// dans un document remis à un tiers (PDF, déclaration TRACFIN, UI).
//
// humanLabel() essaie les deux référentiels puis, en dernier recours, nettoie
// le code (retire le préfixe de risque, remplace les underscores).

import { OPTIONS } from "@/lib/tracfin";
import {
  ORIGINE_FONDS_OPTIONS, MODE_FINANCEMENT_OPTIONS, MODE_PAIEMENT_OPTIONS,
  TYPE_BIEN_OPTIONS, PAYS_OPTIONS,
} from "@/lib/kyc";

interface Opt { value: string; label: string }

const SOURCES: Record<string, ReadonlyArray<Opt>[]> = {
  typeBien: [OPTIONS.typeBien ?? [], TYPE_BIEN_OPTIONS as ReadonlyArray<Opt>],
  origineFonds: [OPTIONS.origineFonds ?? [], ORIGINE_FONDS_OPTIONS as ReadonlyArray<Opt>],
  modePaiement: [OPTIONS.modePaiement ?? [], MODE_PAIEMENT_OPTIONS as ReadonlyArray<Opt>],
  montageFinancier: [OPTIONS.montageFinancier ?? [], MODE_FINANCEMENT_OPTIONS as ReadonlyArray<Opt>],
  pays: [OPTIONS.residenceFiscale ?? [], PAYS_OPTIONS as ReadonlyArray<Opt>],
};

/** Nettoie un code interne : "green_residentiel_principal" → "residentiel principal". */
export function prettifyCode(code: string): string {
  return code.replace(/^(green|orange|red)_/, "").replace(/_/g, " ").trim() || code;
}

/**
 * Résout un code en libellé humain. Ne renvoie JAMAIS un code brut :
 * si aucun référentiel ne le connaît, renvoie une version nettoyée.
 */
export function humanLabel(kind: keyof typeof SOURCES, code: string | null | undefined): string | null {
  if (!code) return null;
  for (const list of SOURCES[kind] ?? []) {
    const hit = list.find((o) => o.value === code);
    if (hit) return hit.label;
  }
  return prettifyCode(code);
}
