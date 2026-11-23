// lib/pdf-helpers.ts — Helpers communs pour les PDFs Klaris (hash, formatters)

import { createHash } from "crypto";
import type { DossierForm, ScoreResult } from "@/lib/tracfin";

/**
 * Hash SHA-256 du contenu sémantique d'une attestation — preuve d'intégrité.
 *
 * On hashe le JSON canonical (clés triées) du couple {form, score, dossierId,
 * generatedAt}. Réémettre l'attestation à la même date donne le même hash → on
 * peut prouver à un contrôleur DGCCRF que ce contenu n'a pas été modifié.
 *
 * Note : on hashe le contenu sémantique (pas le PDF binaire) pour éviter le
 * problème circulaire d'afficher le hash dans le PDF lui-même.
 */
export function computeContentHash(
  form: DossierForm,
  score: ScoreResult,
  dossierId: string,
  generatedAt: string
): string {
  const payload = canonicalJson({
    dossierId,
    generatedAt,
    algoVersion: score.algoVersion,
    niveau: score.niveau,
    triggers: score.triggers.map(t => ({ critere: t.critere, valeur: t.valeur, risk: t.risk })),
    form: {
      typeClient: form.typeClient,
      nomPrenom: form.nomPrenom,
      dateNaissance: form.dateNaissance,
      lieuNaissance: form.lieuNaissance,
      nationalite: form.nationalite,
      paysNationalite: form.paysNationalite,
      adresse: form.adresse,
      profession: form.profession,
      secteurActivite: form.secteurActivite,
      residenceFiscale: form.residenceFiscale,
      lieuBien: form.lieuBien,
      typeBien: form.typeBien,
      montantTransaction: form.montantTransaction,
      montageFinancier: form.montageFinancier,
      modePaiement: form.modePaiement,
      origineFonds: form.origineFonds,
      coherencePrix: form.coherencePrix,
      rbe: form.rbe,
      gelAvoirs: form.gelAvoirs,
      sanctionsListe: form.sanctionsListe,
      ppe: form.ppe,
      ppeProcheDetecte: form.ppeProcheDetecte,
      nomEmploye: form.nomEmploye,
      responsableLCBFT: form.responsableLCBFT,
    },
  });
  return createHash("sha256").update(payload).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const keys = Object.keys(value as object).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalJson((value as Record<string, unknown>)[k])).join(",") + "}";
}

/** Format raccourci du hash pour affichage (12 chars en monospace) */
export function shortHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-6)}`;
}

/** Format ISO court : "10 mai 2026" */
export function formatDateLong(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Référence dossier courte affichée en header : "#577A7E48" */
export function shortDossierRef(dossierId: string): string {
  return `#${dossierId.slice(0, 8).toUpperCase()}`;
}

/** Initiales pour avatar circulaire (max 2 lettres) */
export function initials(name: string): string {
  if (!name?.trim()) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Format montant en € avec espaces : "350 000" */
export function formatMontant(s: string): string {
  if (!s?.trim()) return "—";
  const n = Number(s.replace(/\s/g, ""));
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString("fr-FR");
}

/**
 * Monogramme Klaris « Étiquette » — SVG inline pour PDF (Puppeteer).
 * Mêmes coordonnées que components/ui/KlarisLogo.tsx : fût d'encre et cinq barres
 * en escalier, du cobalt au corail.
 */
export function klarisLogoSvg(size: number = 36): string {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <rect x="10" y="10" width="18" height="80" rx="9" fill="#0B1435" />
  <rect x="58" y="10.0" width="32" height="14" rx="7" fill="#2F5BFF" /><rect x="46" y="26.5" width="32" height="14" rx="7" fill="#5468FF" /><rect x="33" y="43.0" width="32" height="14" rx="7" fill="#9A6BEB" /><rect x="46" y="59.5" width="32" height="14" rx="7" fill="#EC6A93" /><rect x="58" y="76.0" width="32" height="14" rx="7" fill="#FF6A4D" />
</svg>`.trim();
}