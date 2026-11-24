// components/landing/VigilanceScale.tsx — L'échelle de vigilance Klaris
//
// Signature visuelle du site : les 4 niveaux de vigilance du moteur Klaris
// (lib/tracfin.ts → NIVEAU_CFG) présentés dans la grammaire de l'étiquette
// énergie, que tout professionnel de l'immobilier lit au premier coup d'œil.
//
// <VigilanceExplorer /> : échelle interactive (section « Vigilance »).
// La même échelle apparaît, animée, dans le haut de page (ScrollStory), qui
// réutilise LEVELS.
//
// Les déclencheurs décrits ici reprennent les règles réelles de computeScore()
// dans lib/tracfin.ts. Si le moteur change, ce texte doit changer avec lui.
// L'échelle en quatre niveaux est celle de Klaris : le Code monétaire et financier
// ne définit pas d'échelle, il définit les mesures (L.561-5, L.561-10, L.561-10-2…).

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import LegalRef from "@/components/landing/LegalRef";

export const LEVELS = [
  {
    n: 1,
    name: "Vigilance standard",
    when: "Aucun signal particulier dans le dossier.",
    signals: [] as string[],
    action:
      "Vous traitez le dossier normalement. Les pièces et la fiche sont archivées cinq ans.",
    ref: "CMF L.561-5",
    refLabel: "Code monétaire et financier, art. L.561-5",
  },
  {
    n: 2,
    name: "Vigilance renforcée",
    when: "Un de ces signaux, ou deux points d'attention cumulés :",
    signals: [
      "personne politiquement exposée, le client ou un proche",
      "pays sur la liste grise du GAFI",
      "acquisition via une SCI, une holding ou un montage à plusieurs niveaux",
      "origine des fonds à documenter : donation, prêt familial",
    ],
    action:
      "Klaris vous demande des justificatifs complémentaires et la validation de votre correspondant LCB-FT.",
    ref: "CMF L.561-10",
    refLabel: "Code monétaire et financier, art. L.561-10",
  },
  {
    n: 3,
    name: "Examen renforcé",
    when: "Un critère classé rouge, par exemple :",
    signals: [
      "paiement en espèces au-delà du plafond légal",
      "pays sur la liste noire du GAFI",
      "origine des fonds inconnue, structure offshore ou anonyme",
      "prix très éloigné du marché",
    ],
    action:
      "Le dossier est suspendu le temps d'une décision écrite et motivée, conservée avec les pièces.",
    ref: "CMF L.561-10-2",
    refLabel: "Code monétaire et financier, art. L.561-10-2",
  },
  {
    n: 4,
    name: "Interdiction",
    when: "Un blocage légal :",
    signals: [
      "gel des avoirs",
      "personne inscrite sur une liste de sanctions (UE, ONU)",
    ],
    action:
      "Vous n'entrez pas en relation d'affaires. Klaris prépare le brouillon de déclaration de soupçon à déposer sur ERMES, la plateforme de Tracfin.",
    ref: "CMF L.562-4",
    refLabel: "Code monétaire et financier, art. L.562-4 (gel des avoirs)",
  },
] as const;

/* ── Échelle interactive ───────────────────────────────────────────────── */
// Ordinateur : le détail du niveau choisi s'affiche à côté de l'échelle.
// Téléphone : toucher un niveau ouvre son détail dans une feuille qui glisse du
// bas (le détail sous l'échelle était coupé et obligeait à défiler).

const narrowQuery = "(max-width: 1023px)";
const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(narrowQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

function LevelDetail({ level }: { level: (typeof LEVELS)[number] }) {
  return (
    <>
      <div className="flex items-baseline gap-3">
        <span
          className="kl-display kl-num"
          style={{ fontSize: "3.25rem", color: `var(--kl-v${level.n})`, lineHeight: 0.9 }}
          aria-hidden="true"
        >
          {level.n}
        </span>
        <h3 className="kl-display kl-h3" style={{ fontSize: "1.6rem" }}>{level.name}</h3>
      </div>

      <dl className="kl-facts mt-6">
        <div>
          <dt>Ce qui le déclenche</dt>
          <dd>
            {level.when}
            {level.signals.length > 0 && (
              <ul className="mt-2 grid gap-1.5">
                {level.signals.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6em] h-[5px] w-[5px] shrink-0 rounded-full"
                      style={{ background: `var(--kl-v${level.n})` }}
                    />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt>Ce que vous faites</dt>
          <dd>{level.action}</dd>
        </div>
        <div>
          <dt>Le texte</dt>
          <dd><LegalRef code={level.ref}>{level.refLabel}</LegalRef></dd>
        </div>
      </dl>
    </>
  );
}

export function VigilanceExplorer() {
  const [active, setActive] = useState<number>(2);
  const [sheet, setSheet] = useState<number | null>(null);
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(narrowQuery).matches, () => false);
  const current = LEVELS[active - 1];

  const choose = (n: number) => {
    setActive(n);
    if (narrow) setSheet(n);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-start">
      <div>
        <div className="kl-scale" role="group" aria-label="Niveaux de vigilance" data-narrow={narrow ? "" : undefined}>
          {LEVELS.map((l) => (
            <div key={l.n} className="kl-scale__row">
              <button
                type="button"
                className="kl-scale__bar"
                data-level={l.n}
                aria-pressed={!narrow && active === l.n}
                aria-haspopup={narrow ? "dialog" : undefined}
                onClick={() => choose(l.n)}
              >
                <span>{l.name}</span>
                <svg className="kl-scale__go" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {!narrow && active === l.n && (
                <span className="kl-scale__pointer" aria-hidden="true">{l.n}</span>
              )}
            </div>
          ))}
        </div>
        <p className="kl-scale__hint">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.8-2.4L4.6 15.4a1.5 1.5 0 0 1 2.4-1.8L9 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {narrow ? "Touchez un niveau pour voir ce qui le déclenche et ce que Klaris vous demande." : "Cliquez sur un niveau pour voir ce qui le déclenche et ce que Klaris vous demande."}
        </p>
      </div>

      {!narrow && (
        <div key={active} className="kl-swap" aria-live="polite">
          <LevelDetail level={current} />
        </div>
      )}

      {narrow && sheet !== null && <LevelSheet n={sheet} onNav={setSheet} onClose={() => setSheet(null)} />}
    </div>
  );
}

/** Feuille du bas (téléphone) : le détail d'un niveau, avec niveau précédent / suivant. */
function LevelSheet({ n, onNav, onClose }: { n: number; onNav: (n: number) => void; onClose: () => void }) {
  const level = LEVELS[n - 1];
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 220); };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return createPortal(
    <div className="kl-lvsheet" data-closing={closing ? "" : undefined} role="dialog" aria-modal="true" aria-label={level.name}>
      <button type="button" className="kl-lvsheet__veil" aria-label="Fermer" onClick={close} />
      <div className="kl-lvsheet__box" style={{ ["--c" as string]: `var(--kl-v${n})` }}>
        <div className="kl-lvsheet__grab" aria-hidden="true" />
        <button type="button" className="kl-lvsheet__x" onClick={close} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </button>
        <div key={n} className="kl-lvsheet__in kl-swap">
          <LevelDetail level={level} />
        </div>
        <div className="kl-lvsheet__nav">
          <button type="button" disabled={n === 1} onClick={() => onNav(n - 1)}>‹ Niveau {Math.max(1, n - 1)}</button>
          <div aria-hidden="true">{LEVELS.map((l) => <i key={l.n} data-on={l.n === n ? "" : undefined} style={{ background: `var(--kl-v${l.n})` }} />)}</div>
          <button type="button" disabled={n === LEVELS.length} onClick={() => onNav(n + 1)}>Niveau {Math.min(LEVELS.length, n + 1)} ›</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
