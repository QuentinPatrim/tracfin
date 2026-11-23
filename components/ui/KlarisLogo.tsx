// components/ui/KlarisLogo.tsx — Monogramme Klaris
//
// Un K dessiné comme un repère de registre : un fût droit et un chevron détaché,
// reliés par un petit losange iris → rose (la seule trace de dégradé de la marque).
//
// Variantes :
//  - défaut   : pavé d'encre, K blanc
//  - inverted : pavé blanc, K d'encre (sur fond de nuit)
//  - mono     : pavé d'encre, losange blanc (PDF, impression)
//  - noBackground : le glyphe seul, couleur héritée (currentColor)
//
// Même API qu'avant : le composant est utilisé partout (site, application, PDF).

import { useId } from "react";

interface Props {
  size?: number;
  mono?: boolean;
  inverted?: boolean;
  className?: string;
  /** Pas de pavé : on ne garde que le glyphe, dans la couleur du texte. */
  noBackground?: boolean;
}

export default function KlarisLogo({
  size = 32,
  mono = false,
  inverted = false,
  className = "",
  noBackground = false,
}: Props) {
  const uid = useId();
  const id = `klogo-${uid.replace(/:/g, "")}`;

  const tile = inverted ? "#FFFFFF" : "#121118";
  const glyph = noBackground ? "currentColor" : inverted ? "#121118" : "#FFFFFF";
  const jewel = mono ? glyph : `url(#${id})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Klaris"
    >
      {!mono && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7B6CFF" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      )}

      {!noBackground && <rect x="1" y="1" width="46" height="46" rx="11" fill={tile} />}

      {/* Fût */}
      <rect x="12.5" y="11.5" width="5.2" height="25" rx="1.2" fill={glyph} />
      {/* Chevron, détaché du fût */}
      <path d="M32.6 11.5H38.6L26.1 24L38.6 36.5H32.6L20.1 24Z" fill={glyph} />
      {/* Losange au point de pivot */}
      <rect x="18.35" y="21.75" width="4.5" height="4.5" rx="0.6" transform="rotate(45 20.6 24)" fill={jewel} />
    </svg>
  );
}
