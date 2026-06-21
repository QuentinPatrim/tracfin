// components/dashboard/GuidedTour.tsx — Visite guidée premium de l'interface
//
// Tour produit type « coach marks » : un overlay assombrit l'écran, met en
// lumière (spotlight) l'élément ciblé, et affiche une carte explicative avec
// navigation Précédent / Suivant / Passer. Conçu pour être :
//   - robuste : si la cible n'existe pas (ex. dashboard vide), la carte se
//     centre au lieu de planter ;
//   - premium : spotlight à halo violet, carte arrondie, points de progression ;
//   - non bloquant : relançable via l'événement `klaris:start-tour`.

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X, Sparkles, ShieldAlert, Check, Play, Pause } from "lucide-react";
import { computeCardLayout, type CardLayout } from "@/lib/tourPlacement";

export interface TourStep {
  /** Sélecteur CSS de l'élément à mettre en lumière. Absent → carte centrée. */
  selector?: string;
  /** Eyebrow court (ex: "Créer un dossier"). */
  eyebrow: string;
  title: string;
  body: React.ReactNode;
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
}

const PAD = 8; // marge du spotlight autour de la cible (px)
const CARD_W = 372;
const CARD_W_SCENE = 430; // carte plus large pour les scènes (maquette client)
const GAP = 14; // espace entre la cible et la carte

// Petite flèche blanche pointant vers la cible, selon l'arête de la carte.
function arrowStyle(edge: "top" | "bottom" | "left" | "right", offset: number): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", width: 0, height: 0, filter: "drop-shadow(0 0 0.5px rgba(124,58,237,0.18))" };
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
    if (step.scene || !step.selector) { setRect(null); return; }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
        if (step?.selector) {
          const el = document.querySelector(step.selector) as HTMLElement | null;
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
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, fontFamily: "Inter, sans-serif" }}>
      {/* Couche capture-clics : empêche d'interagir avec l'app derrière. */}
      <div
        style={{ position: "absolute", inset: 0 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight (cible présente) ou voile plein (cible absente) */}
      {rect ? (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 14,
            boxShadow:
              "0 0 0 9999px rgba(8,7,13,0.74), 0 0 0 2px rgba(167,139,250,0.95), 0 0 28px 6px rgba(167,139,250,0.45)",
            transition: "all 280ms cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div aria-hidden style={{ position: "fixed", inset: 0, background: "rgba(8,7,13,0.74)" }} />
      )}

      {/* Carte explicative */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: cardPos.top,
          left: cardPos.left,
          width: cardPos.width,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: cardPos.maxHeight > 120 ? cardPos.maxHeight : "calc(100vh - 32px)",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: 18,
          border: "1px solid rgba(124,58,237,0.16)",
          boxShadow: "0 24px 70px -16px rgba(15,23,42,0.40), 0 0 0 1px rgba(255,255,255,0.6) inset",
          padding: 20,
          // Glissement fluide entre les plans (effet "film") + apparition.
          transition: "top 420ms cubic-bezier(0.16,1,0.3,1), left 420ms cubic-bezier(0.16,1,0.3,1)",
          animation: "klaris-tour-in 260ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Flèche connectrice vers la cible (4 directions, façon bulle Apple) */}
        {cardPos.arrowEdge && (
          <div aria-hidden style={arrowStyle(cardPos.arrowEdge, cardPos.arrowOffset)} />
        )}

        {/* Barre de temps (lecture auto) */}
        {playing && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "18px 18px 0 0", overflow: "hidden", background: "rgba(124,58,237,0.08)" }}>
            <div
              key={`${index}-${playing}`}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                animation: `klaris-tour-time ${stepDurationMs}ms linear forwards`,
              }}
            />
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center",
                background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white",
                boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#a78bfa" }}>
                Visite guidée
              </div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
                Étape {index + 1} / {steps.length}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Fermer la visite"
            style={{ background: "transparent", border: 0, color: "#cbd5e1", cursor: "pointer", padding: 4, borderRadius: 6, lineHeight: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scène visuelle (ex: maquette du parcours client) */}
        {step.scene && (
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            {step.scene}
          </div>
        )}

        {/* Eyebrow + titre + corps */}
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#6d28d9", marginBottom: 5 }}>
          {step.eyebrow}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.25 }}>
          {step.title}
        </h3>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>
          {step.body}
        </div>

        {/* Encart "à vérifier" (point LCB-FT important) */}
        {step.important && (
          <div
            style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 10,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.30)",
              display: "flex", gap: 8, alignItems: "flex-start",
            }}
          >
            <ShieldAlert size={15} style={{ color: "#b45309", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
              <strong>À vérifier — </strong>{step.important}
            </div>
          </div>
        )}

        {/* Points de progression */}
        <div style={{ display: "flex", gap: 5, marginTop: 16, marginBottom: 14 }}>
          {steps.map((_, i) => (
            <span
              key={i}
              style={{
                height: 5, flex: i === index ? 2.2 : 1, borderRadius: 999,
                background: i === index
                  ? "linear-gradient(90deg, #7c3aed, #ec4899)"
                  : i < index ? "rgba(124,58,237,0.35)" : "rgba(15,23,42,0.10)",
                transition: "all 240ms ease",
              }}
            />
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Mettre en pause" : "Lecture"}
              title={playing ? "Pause" : "Lecture"}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 30, borderRadius: 8, background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.20)", color: "#6d28d9", cursor: "pointer",
              }}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              type="button"
              onClick={finish}
              style={{ background: "transparent", border: 0, color: "#94a3b8", fontSize: 12.5, fontWeight: 500, cursor: "pointer", padding: "6px 8px" }}
            >
              Passer
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {index > 0 && (
              <button
                type="button"
                onClick={prev}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 9,
                  background: "white", border: "1px solid #e2e8f0", color: "#475569", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                }}
              >
                <ArrowLeft size={13} /> Précédent
              </button>
            )}
            <button
              type="button"
              onClick={next}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 9,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", border: 0,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(124,58,237,0.30)",
              }}
            >
              {isLast ? <>Terminer <Check size={14} /></> : <>Suivant <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes klaris-tour-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes klaris-tour-time {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}
