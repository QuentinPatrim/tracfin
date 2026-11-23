// components/landing/primitives.tsx — Primitives sobres réutilisables (fintech / legaltech)
// Palette « Iris » via tokens --lp-* (clair/sombre). Aucune couleur en dur.
// Mobile-first natif (padding/typo qui s'adaptent).

import type { ReactNode, ComponentType } from "react";

/* ───────────────────── Eyebrow (étiquette de section) ───────────────────── */
export function Eyebrow({ children }: { children: ReactNode }) {
  // Légende de section : une phrase courte précédée d'un filet (pas de capitales espacées).
  return <p className="kl-kicker">{children}</p>;
}

/* ───────────────────── Section wrapper ───────────────────── */
export function Section({
  children,
  id,
  maxWidth = "6xl",
  className = "",
}: {
  children: ReactNode;
  id?: string;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
}) {
  const mw = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <section id={id} className={`relative ${mw} mx-auto px-5 sm:px-6 py-16 sm:py-20 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

/* ───────────────────── Titles (sobres, sans gradient animé) ───────────────────── */

export function H1({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`kl-display ${className}`} style={{ fontSize: "clamp(2.5rem, 1.5rem + 3.6vw, 4.25rem)", color: "var(--lp-text)" }}>
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`kl-display ${className}`} style={{ fontSize: "clamp(1.9rem, 1.3rem + 2vw, 2.75rem)", color: "var(--lp-text)" }}>
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={`text-[17px] sm:text-[18px] font-semibold tracking-tight ${className}`}
      style={{ color: "var(--lp-text)" }}
    >
      {children}
    </h3>
  );
}

/* ───────────────────── Paragraphs ───────────────────── */

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed ${className}`}
      style={{ color: "var(--lp-text-3)" }}
    >
      {children}
    </p>
  );
}

export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-[13.5px] sm:text-[14px] leading-relaxed ${className}`}
      style={{ color: "var(--lp-text-3)" }}
    >
      {children}
    </p>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-mono text-[11.5px] sm:text-[12px] px-1.5 py-0.5 rounded"
      style={{
        color: "var(--lp-accent-text)",
        background: "var(--lp-surface)",
        border: "1px solid var(--lp-border-1)",
      }}
    >
      {children}
    </span>
  );
}

/* ───────────────────── Section header ───────────────────── */

export function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  desc?: ReactNode;
  align?: "left" | "center";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`mb-10 sm:mb-12 max-w-3xl ${alignCls}`}>
      {eyebrow && (
        <div className={`mb-4 ${align === "center" ? "flex justify-center" : ""}`}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <H2>{title}</H2>
      {desc && <div className="mt-4"><Lede>{desc}</Lede></div>}
    </div>
  );
}

/* ───────────────────── Cards ───────────────────── */

export function Card({
  children,
  className = "",
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 sm:p-6 border transition-colors ${className}`}
      style={{
        background: accent ? "var(--lp-card-bg-accent)" : "var(--lp-card-bg)",
        borderColor: accent ? "var(--lp-card-border-accent)" : "var(--lp-card-border)",
        boxShadow: "var(--lp-card-shadow)",
      }}
    >
      {children}
    </div>
  );
}

export function IconCircle({
  icon: Icon,
  size = "md",
  tone = "violet",
}: {
  icon: ComponentType<{ width?: number; height?: number; className?: string }>;
  size?: "sm" | "md" | "lg";
  tone?: "violet" | "teal" | "pink";
}) {
  const dim = { sm: 36, md: 44, lg: 52 }[size];
  const iconDim = { sm: 16, md: 18, lg: 22 }[size];
  const toneVars = {
    violet: { bg: "var(--lp-icon-bg)", border: "var(--lp-icon-border)", color: "var(--lp-icon-color)" },
    teal: { bg: "var(--lp-icon-bg-teal)", border: "var(--lp-icon-border-teal)", color: "var(--lp-icon-color-teal)" },
    pink: { bg: "var(--lp-icon-bg-pink)", border: "var(--lp-icon-border-pink)", color: "var(--lp-icon-color-pink)" },
  }[tone];
  return (
    <div
      className="grid place-items-center rounded-lg shrink-0"
      style={{
        width: dim,
        height: dim,
        background: toneVars.bg,
        border: `1px solid ${toneVars.border}`,
        color: toneVars.color,
      }}
    >
      <Icon width={iconDim} height={iconDim} />
    </div>
  );
}

/* ───────────────────── CTAs ───────────────────── */

import Link from "next/link";

interface CtaProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
}

export function CTA({ children, href, onClick, variant = "primary", size = "md", className = "" }: CtaProps) {
  const cls = `kl-btn ${variant === "primary" ? "kl-btn--primary" : "kl-btn--ghost"} ${size === "lg" ? "kl-btn--lg" : ""} ${className}`;
  if (href) {
    return <Link href={href} className={cls}>{children}</Link>;
  }
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/* ───────────────────── Citation légale (référence CMF, etc.) ───────────────────── */

export function LegalRef({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[0.74rem] align-middle"
      style={{
        background: "var(--lp-legalref-bg)",
        border: "1px solid var(--lp-legalref-border)",
        color: "var(--lp-legalref-text)",
      }}
    >
      {children}
    </span>
  );
}
