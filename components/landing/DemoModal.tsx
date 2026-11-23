// components/landing/DemoModal.tsx — Démo guidée, en quatre chapitres
//
// Une boîte de dialogue légère, à la manière des « stories » : quatre chapitres qui
// s'enchaînent seuls (une barre de progression par chapitre), le texte à gauche, l'écran
// du produit à droite (en haut sur téléphone).
//  - Pas d'iframe ni de décor 3D : les écrans sont ceux de DemoScreens et ProductStory,
//    en HTML/CSS, donc fluides même sur un téléphone modeste.
//  - Le temps est porté par l'animation CSS de la barre : la pause la fige, la fin de
//    l'animation passe au chapitre suivant. Rien ne tourne en JavaScript à chaque image.
//  - Commandes : boutons, toucher à gauche / à droite de l'écran, flèches du clavier,
//    espace pour la pause, Échap pour fermer.

"use client";

import "./demo.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ArrowRight } from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";
import { PhoneForm } from "./DemoScreens";
import { SharePlane, AnalysisPlane, AttestationPlane } from "./ProductStory";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;
}

const CHAPTERS = [
  {
    t: "Vous créez le dossier.",
    p: "Le rôle, le type de client, son nom, son e-mail : le lien de sa fiche est prêt. Vous l'envoyez par e-mail, WhatsApp ou message.",
    dur: 6500,
  },
  {
    t: "Votre client remplit sa fiche.",
    p: "Sur son téléphone, sans compte ni application : identité, situation, opération, pièces justificatives, puis il envoie.",
    dur: 9000,
  },
  {
    t: "Klaris classe le dossier.",
    p: "Vous complétez l'analyse de risque. Klaris en déduit un niveau de vigilance sur quatre, avec la conduite à tenir.",
    dur: 7000,
  },
  {
    t: "L'attestation est prête.",
    p: "Horodatée, avec son empreinte, rangée avec la fiche et les pièces dans une seule archive, conservée cinq ans.",
    dur: 7000,
  },
] as const;

const DESIGN_W = 560;
const DESIGN_H = 660;

export default function DemoModal({ open, onClose, onCta }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const end = idx >= CHAPTERS.length;

  const go = useCallback((i: number) => {
    setIdx(Math.max(0, Math.min(CHAPTERS.length, i)));
    setPaused(false);
  }, []);

  /* Clavier et défilement de la page bloqué pendant la démo. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go, idx]);

  /* La scène est dessinée à 560 × 660 et mise à l'échelle de son cadre. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(1.1, (width - 24) / DESIGN_W, (height - 24) / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  if (!open) return null;

  const chapter = CHAPTERS[Math.min(idx, CHAPTERS.length - 1)];

  return (
    <div className="dg" role="dialog" aria-modal="true" aria-label="Démo guidée de Klaris" data-paused={paused ? "" : undefined}>
      <button type="button" className="dg-veil" aria-label="Fermer la démo" onClick={onClose} />

      <div className="dg-box">
        <div className="dg-side">
          <div className="dg-head">
            <KlarisLogo size={30} />
            <b>Démo guidée</b>
            <button type="button" className="dg-x" onClick={onClose} aria-label="Fermer la démo">
              <X width={18} height={18} />
            </button>
          </div>

          <div className="dg-segs">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.t}
                type="button"
                className="dg-seg"
                aria-label={`Chapitre ${i + 1} : ${c.t}`}
                data-state={i < idx ? "done" : i === idx ? "run" : "todo"}
                style={{ "--dur": `${c.dur}ms` } as React.CSSProperties}
                onClick={() => go(i)}
              >
                <span
                  key={i === idx ? `run-${idx}` : `s-${i}`}
                  onAnimationEnd={i === idx ? () => go(idx + 1) : undefined}
                />
              </button>
            ))}
          </div>

          <div className="dg-bottom">
            <div className="dg-txt" aria-live="polite">
              {!end ? (
                <div key={idx} className="dg-swap">
                  <span className="dg-n">{idx + 1}</span>
                  <h2 className="dg-t">{chapter.t}</h2>
                  <p className="dg-p">{chapter.p}</p>
                </div>
              ) : (
                <div key="end" className="dg-swap">
                  <h2 className="dg-t">Prêt à essayer sur un vrai dossier&nbsp;?</h2>
                  <p className="dg-p">14 jours gratuits, aucun prélèvement avant le 14ᵉ jour, sans engagement.</p>
                </div>
              )}
            </div>

            <div className="dg-ctl">
              <button type="button" className="dg-btn" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Chapitre précédent">
                <ChevronLeft width={20} height={20} />
              </button>
              {!end ? (
                <button type="button" className="dg-btn dg-btn--play" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Reprendre" : "Mettre en pause"}>
                  {paused ? <Play width={17} height={17} fill="currentColor" /> : <Pause width={17} height={17} fill="currentColor" />}
                </button>
              ) : (
                <button type="button" className="dg-btn dg-btn--play" onClick={() => go(0)} aria-label="Revoir la démo">
                  <RotateCcw width={17} height={17} />
                </button>
              )}
              <button type="button" className="dg-btn" onClick={() => go(idx + 1)} disabled={end} aria-label="Chapitre suivant">
                <ChevronRight width={20} height={20} />
              </button>
              <span className="dg-hint">Espace : pause · ← → : naviguer</span>
            </div>
          </div>
        </div>

        <div ref={stageRef} className="dg-stage">
          {!end && (
            <>
              <button type="button" className="dg-tap dg-tap--prev" aria-label="Chapitre précédent" onClick={() => go(idx - 1)} />
              <button type="button" className="dg-tap dg-tap--next" aria-label="Chapitre suivant" onClick={() => go(idx + 1)} />
            </>
          )}
          <div className="dg-design" style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(-50%, -50%) scale(${scale})` }} aria-hidden="true">
            <div className="ps-plane" data-on={idx === 0 ? "" : undefined}><SharePlane /></div>
            <div className="ps-plane" data-on={idx === 1 ? "" : undefined}>
              <div className="ps-phone"><PhoneForm playing={idx === 1 && !paused} interval={1450} /></div>
            </div>
            <div className="ps-plane" data-on={idx === 2 ? "" : undefined}><AnalysisPlane /></div>
            <div className="ps-plane" data-on={idx === 3 ? "" : undefined}><AttestationPlane /></div>
          </div>
          {end && (
            <div className="dg-end">
              <div>
                <KlarisLogo size={64} inverted animated />
                <h3>Vos dossiers LCB&#8209;FT, en ordre.</h3>
                <p>Créez votre compte et envoyez votre premier lien en quelques minutes.</p>
                <div className="dg-end__btns">
                  <button type="button" onClick={() => { onClose(); onCta?.(); }}>
                    Essayer 14 jours gratuits <ArrowRight width={16} height={16} />
                  </button>
                  <button type="button" onClick={() => go(0)}>
                    <RotateCcw width={15} height={15} /> Revoir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
