// components/landing/VigilanceScale.tsx — L'échelle de vigilance Klaris
//
// Signature visuelle du site : les 4 niveaux de vigilance du moteur Klaris
// (lib/tracfin.ts → NIVEAU_CFG) présentés dans la grammaire de l'étiquette
// énergie, que tout professionnel de l'immobilier lit au premier coup d'œil.
//
// Deux formes :
//  - <VigilanceMini level={n} /> : vignette statique (posée sur l'attestation du hero)
//  - <VigilanceExplorer />       : échelle interactive (section « Vigilance »)
//
// Les déclencheurs décrits ici reprennent les règles réelles de computeScore()
// dans lib/tracfin.ts. Si le moteur change, ce texte doit changer avec lui.
// L'échelle en quatre niveaux est celle de Klaris : le Code monétaire et financier
// ne définit pas d'échelle, il définit les mesures (L.561-5, L.561-10, L.561-10-2…).

"use client";

import { useState } from "react";
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

/* ── Vignette statique ─────────────────────────────────────────────────── */
export function VigilanceMini({ level = 1 }: { level?: 1 | 2 | 3 | 4 }) {
  const current = LEVELS[level - 1];
  return (
    <div className="kl-sticker">
      <div className="text-[0.72rem] font-medium" style={{ color: "#6F6A8A" }}>
        Niveau de vigilance du dossier
      </div>
      <div className="kl-display mt-0.5 text-[1.05rem]" style={{ lineHeight: 1.15 }}>
        {current.name}
      </div>
      <div
        className="kl-scale kl-scale--mini kl-enter-bars mt-2.5"
        role="img"
        aria-label={`Niveau ${level} sur 4 : ${current.name}`}
      >
        {LEVELS.map((l) => (
          <div key={l.n} className="kl-scale__bar" data-level={l.n} data-on={l.n === level ? "true" : "false"}>
            <span className="kl-scale__n" style={{ fontSize: "0.8rem" }}>{l.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Échelle interactive ───────────────────────────────────────────────── */
export function VigilanceExplorer() {
  const [active, setActive] = useState<number>(2);
  const current = LEVELS[active - 1];

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-start">
      <div>
        <div className="kl-scale" role="group" aria-label="Niveaux de vigilance">
          {LEVELS.map((l) => (
            <div key={l.n} className="kl-scale__row">
              <button
                type="button"
                className="kl-scale__bar"
                data-level={l.n}
                aria-pressed={active === l.n}
                onClick={() => setActive(l.n)}
              >
                <span>{l.name}</span>
              </button>
              {active === l.n && (
                <span className="kl-scale__pointer" aria-hidden="true">{l.n}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-5 text-[0.86rem]" style={{ color: "var(--lp-text-4)" }}>
          Touchez un niveau pour voir ce qui le déclenche et ce que Klaris vous demande.
        </p>
      </div>

      <div key={active} className="kl-swap" aria-live="polite">
        <div className="flex items-baseline gap-3">
          <span
            className="kl-display kl-num"
            style={{ fontSize: "3.25rem", color: `var(--kl-v${current.n})`, lineHeight: 0.9 }}
            aria-hidden="true"
          >
            {current.n}
          </span>
          <h3 className="kl-display kl-h3" style={{ fontSize: "1.6rem" }}>{current.name}</h3>
        </div>

        <dl className="kl-facts mt-6">
          <div>
            <dt>Ce qui le déclenche</dt>
            <dd>
              {current.when}
              {current.signals.length > 0 && (
                <ul className="mt-2 grid gap-1.5">
                  {current.signals.map((s) => (
                    <li key={s} className="flex gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-[0.6em] h-[5px] w-[5px] shrink-0 rounded-full"
                        style={{ background: `var(--kl-v${current.n})` }}
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
            <dd>{current.action}</dd>
          </div>
          <div>
            <dt>Le texte</dt>
            <dd><LegalRef code={current.ref}>{current.refLabel}</LegalRef></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

