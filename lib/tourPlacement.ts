// lib/tourPlacement.ts — Placement de la carte de visite guidée (sans chevauchement)
//
// Choisit le meilleur côté (bas / haut / droite / gauche) pour poser la carte
// dans l'ESPACE LIBRE autour de la cible, de sorte qu'elle ne recouvre JAMAIS
// l'élément mis en lumière. Fonction pure → testable (cf. _migration/test-tour-placement.mjs).

export interface Rect { top: number; left: number; width: number; height: number; }

export type Side = "top" | "bottom" | "left" | "right" | "center";
export type ArrowEdge = "top" | "bottom" | "left" | "right" | null;

export interface CardLayout {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  side: Side;
  arrowEdge: ArrowEdge;
  arrowOffset: number; // px depuis le coin haut/gauche de la carte, le long de l'arête
}

export interface PlaceOpts {
  defaultW: number;  // largeur souhaitée de la carte
  cardH: number;     // hauteur mesurée de la carte
  gap: number;       // espace entre la cible et la carte
  margin: number;    // marge minimale au bord de l'écran
  isScene?: boolean; // étape "scène" (maquette) → toujours centrée
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const MIN_SIDE_W = 280; // en deçà, une carte latérale est trop étroite

export function computeCardLayout(
  target: Rect | null,
  vw: number,
  vh: number,
  opts: PlaceOpts,
): CardLayout {
  const { defaultW, cardH, gap: G, margin: M, isScene } = opts;

  // Pas de cible (welcome / scène) → centré, sans flèche.
  if (!target || isScene) {
    const width = Math.min(defaultW, vw - 2 * M);
    const maxHeight = vh - 2 * M;
    return {
      top: clamp(vh / 2 - cardH / 2, M, Math.max(M, vh - cardH - M)),
      left: (vw - width) / 2,
      width,
      maxHeight,
      side: "center",
      arrowEdge: null,
      arrowOffset: 0,
    };
  }

  const right = target.left + target.width;
  const bottom = target.top + target.height;
  const cx = target.left + target.width / 2;
  const cy = target.top + target.height / 2;
  const tall = target.height > vh * 0.55;

  interface Cand extends CardLayout { ok: boolean; usable: number; }

  const make = (side: Exclude<Side, "center">): Cand => {
    if (side === "bottom") {
      const width = Math.min(defaultW, vw - 2 * M);
      const left = clamp(cx - width / 2, M, vw - width - M);
      const top = bottom + G;
      const maxHeight = vh - top - M;
      return {
        side, top, left, width, maxHeight,
        arrowEdge: "top",
        arrowOffset: clamp(cx - left, 22, width - 22),
        ok: maxHeight >= Math.min(cardH, vh * 0.5) && maxHeight >= 200,
        usable: maxHeight,
      };
    }
    if (side === "top") {
      const width = Math.min(defaultW, vw - 2 * M);
      const left = clamp(cx - width / 2, M, vw - width - M);
      const avail = target.top - G - M;
      const h = Math.min(cardH, Math.max(avail, 0));
      const top = target.top - G - h;
      return {
        side, top, left, width, maxHeight: avail,
        arrowEdge: "bottom",
        arrowOffset: clamp(cx - left, 22, width - 22),
        ok: avail >= Math.min(cardH, vh * 0.5) && avail >= 200,
        usable: avail,
      };
    }
    if (side === "right") {
      const avail = vw - right - G - M;
      const width = Math.min(defaultW, Math.max(avail, 0));
      const left = right + G;
      const maxHeight = vh - 2 * M;
      const top = clamp(cy - cardH / 2, M, Math.max(M, vh - cardH - M));
      return {
        side, top, left, width, maxHeight,
        arrowEdge: "left",
        arrowOffset: clamp(cy - top, 22, cardH - 22),
        ok: avail >= MIN_SIDE_W,
        usable: avail,
      };
    }
    // left
    const avail = target.left - G - M;
    const width = Math.min(defaultW, Math.max(avail, 0));
    const left = target.left - G - width;
    const maxHeight = vh - 2 * M;
    const top = clamp(cy - cardH / 2, M, Math.max(M, vh - cardH - M));
    return {
      side: "left", top, left, width, maxHeight,
      arrowEdge: "right",
      arrowOffset: clamp(cy - top, 22, cardH - 22),
      ok: avail >= MIN_SIDE_W,
      usable: avail,
    };
  };

  // Ordre de préférence : cible haute → côtés (gauche/droite, le plus large
  // d'abord) ; sinon → bas/haut puis côtés.
  const leftGap = target.left - G;
  const rightGap = vw - right - G;
  let order: Array<Exclude<Side, "center">>;
  if (tall) {
    order = leftGap >= rightGap ? ["left", "right", "bottom", "top"] : ["right", "left", "bottom", "top"];
  } else {
    order = ["bottom", "top", "right", "left"];
  }

  const cands = order.map(make);
  const chosen = cands.find((c) => c.ok) ?? cands.reduce((a, b) => (b.usable > a.usable ? b : a));

  // Aucun côté exploitable (cible quasi plein écran) → repli centré, sans flèche.
  if (!chosen.ok && (chosen.width < 240 || chosen.maxHeight < 160)) {
    const width = Math.min(defaultW, vw - 2 * M);
    return {
      top: clamp(vh / 2 - cardH / 2, M, Math.max(M, vh - cardH - M)),
      left: (vw - width) / 2,
      width,
      maxHeight: vh - 2 * M,
      side: "center",
      arrowEdge: null,
      arrowOffset: 0,
    };
  }

  return {
    top: chosen.top,
    left: chosen.left,
    width: chosen.width,
    maxHeight: chosen.maxHeight,
    side: chosen.side,
    arrowEdge: chosen.arrowEdge,
    arrowOffset: chosen.arrowOffset,
  };
}
