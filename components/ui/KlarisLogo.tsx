// components/ui/KlarisLogo.tsx — Logo Klaris officiel (K géométrique à 4 facettes)
//
// Variantes :
//  - default : carré arrondi gradient violet→magenta + K blanc + losange pivot
//  - mono    : carré sombre + K blanc (pour PDF / impression / contexte mono)
//
// Le composant est auto-suffisant (gère son propre fond). On l'utilise partout :
// landing, dashboard, footers, PDF, KYC public, etc.

import { useId } from "react";

interface Props {
  size?: number;
  mono?: boolean;
  className?: string;
  /** Désactive le bg carré arrondi (pour ne garder que le glyphe sur fond externe) */
  noBackground?: boolean;
}

export default function KlarisLogo({
  size = 32,
  mono = false,
  className = "",
  noBackground = false,
}: Props) {
  const uid = useId();
  const id = `klogo-${uid}`;

  const bgFill = mono
    ? "#0f172a"
    : noBackground
    ? "transparent"
    : `url(#${id})`;

  const fgFill = "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-label="Klaris"
    >
      {!mono && !noBackground && (
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      )}

      {/* Fond carré arrondi (sauf si noBackground) */}
      {!noBackground && (
        <rect x="2" y="2" width="44" height="44" rx="11" fill={bgFill} />
      )}

      {/* Highlight haut subtil (relief) — couleur seulement, sans bg externe */}
      {!mono && !noBackground && (
        <rect x="2" y="2" width="44" height="22" rx="11" fill="white" opacity="0.10" />
      )}

      {/* Barre verticale du K */}
      <rect
        x="11"
        y="11"
        width="5"
        height="26"
        rx="1.5"
        fill={noBackground ? bgFill : fgFill}
      />

      {/* Triangle haut (diagonale haute) */}
      <path
        d="M 16 24 L 31 11 L 35 11 L 20 24 Z"
        fill={noBackground ? bgFill : fgFill}
      />

      {/* Triangle bas (diagonale basse) */}
      <path
        d="M 16 24 L 31 37 L 35 37 L 20 24 Z"
        fill={noBackground ? bgFill : fgFill}
      />

      {/* Losange au point de pivot (signature distinctive) */}
      <rect
        x="17.5"
        y="22.5"
        width="3"
        height="3"
        transform="rotate(45 19 24)"
        fill={mono ? "#0f172a" : noBackground ? bgFill : `url(#${id})`}
        stroke={noBackground ? bgFill : fgFill}
        strokeWidth="0.5"
      />
    </svg>
  );
}
