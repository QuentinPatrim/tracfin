// components/ui/KlarisLogo.tsx — Monogramme Klaris « Étiquette »
//
// Le K est dessiné comme une étiquette de vigilance : un fût d'encre et cinq barres
// arrondies posées en escalier, qui forment les deux bras. Les barres vont du
// cobalt au corail, comme une échelle qui monte. C'est la signature du produit
// (l'échelle de vigilance) devenue logo.
//
// Variantes :
//  - défaut   : fût d'encre, barres du cobalt au corail
//  - inverted : tout en blanc (sur fond coloré)
//  - mono     : tout d'encre (impression)
//  - animated : les barres glissent en place au premier affichage
//
// Même API qu'avant : le composant est utilisé partout (site, application).

const STEPS: Array<[number, string]> = [
  [58, "#2F5BFF"],
  [46, "#5468FF"],
  [33, "#9A6BEB"],
  [46, "#EC6A93"],
  [58, "#FF6A4D"],
];

interface Props {
  size?: number;
  mono?: boolean;
  inverted?: boolean;
  animated?: boolean;
  className?: string;
  /** Conservé pour compatibilité : le monogramme n'a pas de pavé. */
  noBackground?: boolean;
}

export default function KlarisLogo({
  size = 32,
  mono = false,
  inverted = false,
  animated = false,
  className = "",
}: Props) {
  const stem = inverted ? "#FFFFFF" : "#0B1435";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${animated ? "kl-logo-anim" : ""} ${className}`}
      role="img"
      aria-label="Klaris"
    >
      <rect x="10" y="10" width="18" height="80" rx="9" fill={stem} />
      {STEPS.map(([x, c], i) => (
        <rect
          key={i}
          x={x}
          y={10 + i * 16.5}
          width="32"
          height="14"
          rx="7"
          fill={mono ? stem : inverted ? "#FFFFFF" : c}
          fillOpacity={inverted ? 0.6 + i * 0.1 : 1}
          style={animated ? ({ "--i": i } as React.CSSProperties) : undefined}
        />
      ))}
    </svg>
  );
}
