// components/dashboard/GuidedTour.tsx — Visite guidée premium de l'interface
//
// Tour produit type « coach marks » : un overlay assombrit l'écran, met en
// lumière (spotlight) l'élément ciblé, et affiche une carte explicative avec
// navigation Précédent / Suivant / Passer. Conçu pour être :
//   - robuste : si la cible n'existe pas (ex. dashboard vide), la carte se
//     centre au lieu de planter ;
//   - sobre : voile encre, anneau blanc autour de la cible, carte blanche ; la
//     progression reprend les couleurs du K (une couleur par étape, `color`) ;
//   - téléphone : la carte se pose en bas de l'écran, comme une feuille ;
//   - non bloquant : relançable via l'événement `klaris:start-tour`.

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X, ShieldAlert, Check, Play, Pause } from "lucide-react";
import { computeCardLayout, type CardLayout } from "@/lib/tourPlacement";
import "./tour.css";

export interface TourStep {
  /** Sélecteur CSS de l'élément à mettre en lumière. Absent → carte centrée. */
  selector?: string;
  /** Eyebrow court (ex: "Créer un dossier"). */
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  /** Cible sur téléphone, si elle diffère (ex. l'aperçu y est une feuille fermée). */
  selectorMobile?: string;
  /** Variante du texte sur téléphone (mise en page différente). */
  bodyMobile?: React.ReactNode;
  /** Couleur de l'étape (barre du K). */
  color?: string;
  /** Encart "à vérifier" mis en avant (point LCB-FT important). */
  important?: React.ReactNode;
  /** Contenu visuel (ex: maquette du parcours client) affiché dans une carte
   *  centrée plus large, sans spotlight. */
  scene?: React.ReactNode;
}

interface Props {
  steps: TourStep[];
  /** Démarre automatiquement au montage (1ʳᵉ visite). */
  autoStart?: boolean;
  /** Appelé au démarrage (auto ou manuel) — ex: activer le mode démonstration. */
  onStart?: () => void;
  /** Appelé quand le tour est terminé OU passé (pour marquer "vu" + couper la démo). */
  onFinish?: () => void;
  /** Nom de l'événement window pour relancer le tour manuellement. */
  restartEventName?: string;
  /** Pastille affichée dans la carte (ex. « Données d'exemple »). */
  badge?: string;
}

const PAD = 8;
const isNarrow = () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
const targetOf = (s: TourStep | undefined) => (s && isNarrow() && s.selectorMobile) || s?.selector; // marge du spotlight autour de la cible (px)
const CARD_W = 392;
const CARD_W_SCENE = 420; // carte plus large pour les scènes (maquette client)
const GAP = 14; // espace entre la cible et la carte

// Petite flèche blanche pointant vers la cible, selon l'arête de la carte.
function arrowStyle(edge: "top" | "bottom" | "left" | "right", offset: number): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", width: 0, height: 0, filter: "drop-shadow(0 0 0.5px rgba(47,91,255,0.18))" };
  const S = 9; // taille
  if (edge === "top") {
    return { ...base, top: -S, left: offset - S, borderLeft: `${S}px solid transparent`, borderRight: `${S}px solid transparent`, borderBottom: `${S}px solid #ffffff` };
  }
  if (edge === "bottom") {
    return { ...base, bottom: -S, left: offset - S, borderLeft: `${S}px solid transparent`, borderRight: `${S}px solid transparent`, borderTop: `${S}px solid #ffffff` };
  }
  if (edge === "left") {
    return { ...base, left: -S, top: offset - S, borderTop: `${S}px solid transparent`, borderBottom: `${S}px solid transparent`, borderRight: `${S}px solid #ffffff` };
  }
  return { ...base, right: -S, top: offset - S, borderTop: `${S}px solid transparent`, borderBottom: `${S}px solid transparent`, borderLeft: `${S}px solid #ffffff` };
}

export default function GuidedTour({
  steps,
  autoStart = false,
  onStart,
  onFinish,
  restartEventName = "klaris:start-tour",
  badge,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<CardLayout>({
    top: 0, left: 0, width: CARD_W, maxHeight: 0, side: "center", arrowEdge: null, arrowOffset: 0,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  // Téléphone : la carte se pose en bas (feuille), le placement autour de la cible ne sert pas.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Durée d'affichage d'un plan en lecture auto (les scènes durent plus longtemps).
  const stepDurationMs = (steps[index]?.scene ? 9000 : 6500);

  // Démarrage auto (1ʳᵉ visite) — léger délai pour laisser le dashboard se peindre.
  useEffect(() => {
    if (!autoStart) return;
    const t = setTimeout(() => { onStart?.(); setIndex(0); setPlaying(true); setActive(true); }, 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Relance manuelle via événement global.
  useEffect(() => {
    const handler = () => { onStart?.(); setIndex(0); setPlaying(true); setActive(true); };
    window.addEventListener(restartEventName, handler);
    return () => window.removeEventListener(restartEventName, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartEventName]);

  const step = steps[index];

  // Localise la cible du step courant + scroll into view.
  const locate = useCallback(() => {
    if (!active || !step) return;
    // Étape "scène" (maquette) → carte centrée, pas de spotlight.
    const sel = targetOf(step);
    if (step.scene || !sel) { setRect(null); return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    if (isNarrow()) {
      // Téléphone : la carte occupe le bas de l'écran, on remonte la cible en haut.
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 112), behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    // Laisse le scroll se faire avant de mesurer.
    setTimeout(() => setRect(el.getBoundingClientRect()), 320);
  }, [active, step]);

  useEffect(() => { locate(); }, [locate, index]);

  // Recalcule la position de la cible au resize / scroll tant que le tour tourne.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sel = targetOf(step);
        if (sel) {
          const el = document.querySelector(sel) as HTMLElement | null;
          setRect(el ? el.getBoundingClientRect() : null);
        }
      });
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [active, step]);

  // Positionne la carte dans l'espace libre autour de la cible (jamais dessus).
  useLayoutEffect(() => {
    if (!active) return;
    const cardH = cardRef.current?.offsetHeight ?? 320;
    const layout = computeCardLayout(
      rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
      window.innerWidth,
      window.innerHeight,
      {
        defaultW: steps[index]?.scene ? CARD_W_SCENE : CARD_W,
        cardH,
        gap: GAP,
        margin: 16,
        isScene: !!steps[index]?.scene,
      },
    );
    setCardPos(layout);
  }, [rect, active, index, steps]);

  const finish = useCallback(() => {
    setActive(false);
    onFinish?.();
  }, [onFinish]);

  const next = () => {
    if (index >= steps.length - 1) finish();
    else setIndex((i) => i + 1);
  };
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  // ─── Lecture automatique (mode "film") ──────────────────────────────
  // Avance seul après stepDurationMs quand "playing". Pause / Précédent /
  // Suivant reprennent la main. Le changement d'index réarme le minuteur.
  useEffect(() => {
    if (!active || !playing) return;
    const t = setTimeout(() => next(), stepDurationMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, index, stepDurationMs]);

  // Échap → passer
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  if (!mounted || !active || !step) return null;

  const isLast = index === steps.length - 1;

  const overlay = (
    <div className="gt" data-narrow={narrow ? "" : undefined}>
      {/* Couche capture-clics : empêche d'interagir avec l'app derrière. */}
      <div className="gt-block" onClick={(e) => e.stopPropagation()} />

      {/* Anneau autour de la cible, ou voile plein si pas de cible */}
      {rect ? (
        <div
          aria-hidden
          className="gt-spot"
          style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
        />
      ) : (
        <div aria-hidden className="gt-veil" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="gt-card"
        data-scene={step.scene ? "" : undefined}
        style={narrow ? undefined : {
          top: cardPos.top,
          left: cardPos.left,
          width: cardPos.width,
          maxHeight: cardPos.maxHeight > 120 ? cardPos.maxHeight : "calc(100vh - 32px)",
        }}
      >
        {!narrow && cardPos.arrowEdge && <div aria-hidden style={arrowStyle(cardPos.arrowEdge, cardPos.arrowOffset)} />}

        <div className="gt-top">
          <span className="gt-k" aria-hidden><i /><i /><i /><i /><i /></span>
          <b>Visite guidée</b>
          {badge && <span className="gt-badge">{badge}</span>}
          <button type="button" className="gt-x" onClick={finish} aria-label="Fermer la visite"><X size={16} /></button>
        </div>

        <div className="gt-segs" aria-hidden>
          {steps.map((s, i) => (
            <span key={i} style={{ ["--c" as string]: s.color ?? "#2F5BFF" }} data-state={i < index ? "done" : i === index ? "run" : undefined}>
              {i === index && (
                <span key={`${index}-${playing}`} style={{ animation: playing ? `gt-fill ${stepDurationMs}ms linear forwards` : "none", transform: playing ? undefined : "scaleX(1)" }} />
              )}
            </span>
          ))}
        </div>

        <div key={index} className="gt-body">
          {step.scene && <div className="gt-scene">{step.scene}</div>}
          <div className="gt-eye" style={{ ["--c" as string]: step.color ?? "#2F5BFF" }}><i />{step.eyebrow}</div>
          <h3 className="gt-t">{step.title}</h3>
          <div className="gt-p">{narrow && step.bodyMobile ? step.bodyMobile : step.body}</div>
          {step.important && (
            <div className="gt-imp">
              <ShieldAlert size={16} />
              <div>{step.important}</div>
            </div>
          )}
        </div>

        <div className="gt-ctl">
          <button type="button" className="gt-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Mettre en pause" : "Lecture"}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button type="button" className="gt-skip" onClick={finish}>Passer</button>
          <span className="gt-n">{index + 1} / {steps.length}</span>
          {index > 0 && (
            <button type="button" className="gt-btn" onClick={prev} aria-label="Étape précédente"><ArrowLeft size={16} /></button>
          )}
          <button type="button" className="gt-next" onClick={next}>
            {isLast ? <>Terminer <Check size={16} /></> : <>Suivant <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
