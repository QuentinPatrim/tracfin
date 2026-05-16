// app/kyc/[token]/useKycPersist.ts — Auto-save localStorage du formulaire KYC
//
// Sécurité : on EXCLUT toutes les clés `url*` (storage_key Scaleway) du
// localStorage. Si le téléphone du client tombe en de mauvaises mains, on ne
// veut pas révéler les pièces déjà téléversées. Les numéros de CNI/SIREN
// restent sauvegardés (compromis pratique/sécurité validé avec l'éditeur).

"use client";

import { useEffect, useRef, useState } from "react";
import type { KycForm } from "@/lib/kyc";

// Préfixe + token pour isoler chaque session KYC
const STORAGE_PREFIX = "klaris-kyc-";
const DEBOUNCE_MS = 400;
const FORM_SCHEMA_VERSION = "v2"; // bump = invalide les anciens snapshots

interface Snapshot {
  schema: string;
  savedAt: number;
  step: number;
  data: Partial<KycForm>;
}

/** Liste des clés à NE PAS sauvegarder dans le localStorage. */
const EXCLUDED_KEYS: ReadonlyArray<keyof KycForm> = [
  "urlPieceIdentite",
  "urlJustifDomicile",
  "urlAvisImposition",
  "urlJustifRevenus",
  "urlJustifOrigineFonds",
  "urlKbis",
  "urlStatuts",
  "urlCniGerant",
  "urlBilans",
  "urlRbe",
];

function sanitize(form: KycForm): Partial<KycForm> {
  const out: Partial<KycForm> = { ...form };
  for (const k of EXCLUDED_KEYS) {
    delete out[k];
  }
  return out;
}

export function useKycPersist(
  token: string,
  form: KycForm,
  setForm: (updater: (f: KycForm) => KycForm) => void,
  step: number,
  setStep: (n: number) => void,
) {
  const key = `${STORAGE_PREFIX}${token}`;
  const [hydrated, setHydrated] = useState(false);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const writeTimer = useRef<number | null>(null);

  // ─── Hydratation au mount ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { setHydrated(true); return; }
      const snap = JSON.parse(raw) as Snapshot;
      if (snap.schema !== FORM_SCHEMA_VERSION) {
        localStorage.removeItem(key);
        setHydrated(true);
        return;
      }
      // Restaure uniquement les champs présents dans le snapshot
      setForm((f) => ({ ...f, ...snap.data }));
      setStep(snap.step ?? 0);
      setRestoredAt(snap.savedAt);
    } catch {
      // localStorage indispo (mode privé Safari, etc.) → on continue sans
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // ─── Sauvegarde debounced à chaque changement ─────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (writeTimer.current) window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => {
      try {
        const snap: Snapshot = {
          schema: FORM_SCHEMA_VERSION,
          savedAt: Date.now(),
          step,
          data: sanitize(form),
        };
        localStorage.setItem(key, JSON.stringify(snap));
      } catch { /* quota plein ou indispo → on ignore silencieusement */ }
    }, DEBOUNCE_MS);
    return () => {
      if (writeTimer.current) window.clearTimeout(writeTimer.current);
    };
  }, [form, step, hydrated, key]);

  // ─── À appeler après soumission réussie ───────────────────────────────
  const clear = () => {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  };

  return { hydrated, restoredAt, clear };
}
