// components/ui/KlarisLogo.tsx — Logo Klaris (anneau orbital, sans hydration mismatch)

"use client";

import { useId } from "react";

interface Props {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function KlarisLogo({ size = 32, className = "", glow = true }: Props) {
  const baseId = useId();
  const id = `klaris-grad-${baseId}`;
  const id2 = `klaris-grad2-${baseId}`;
  const id3 = `klaris-glow-${baseId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={glow ? { filter: `drop-shadow(0 0 8px rgba(139,92,246,0.6))` } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <radialGradient id={id2} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#A855F7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <filter id={id3} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <circle cx="20" cy="20" r="19" fill={`url(#${id2})`}>
        <animate attributeName="r" values="18;19.5;18" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
      </circle>

      <circle cx="20" cy="20" r="16" fill="none" stroke={`url(#${id})`} strokeWidth="1.2" strokeOpacity="0.5" />

      <circle cx="20" cy="20" r="11.5" fill="none" stroke={`url(#${id})`} strokeWidth="2.5" strokeLinecap="round" />

      <g style={{ transformOrigin: "20px 20px" }}>
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="8s" repeatCount="indefinite" />
        <circle cx="31.5" cy="20" r="1.4" fill="white" filter={`url(#${id3})`} />
      </g>

      <circle cx="20" cy="20" r="4.5" fill={`url(#${id})`}>
        <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
      </circle>

      <ellipse cx="18.5" cy="18.5" rx="1.6" ry="1.2" fill="white" opacity="0.55" />
    </svg>
  );
}
