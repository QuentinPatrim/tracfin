// components/landing/primitives.tsx — Primitives sobres réutilisables (fintech / legaltech)
// Palette « Iris » via tokens --lp-* (clair/sombre). Aucune couleur en dur.
// Mobile-first natif (padding/typo qui s'adaptent).

import type { ReactNode, ComponentType } from "react";

/* ───────────────────── Eyebrow (étiquette de section) ───────────────────── */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="inline-block px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest"
      style={{
        background: "var(--lp-surface-2)",
        border: "1px solid var(--lp-border-2)",
        color: "var(--lp-text-3)",
      }}
    >
      {children}
    </div>
  );
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
    <h1
      className={`text-[34px] sm:text-[44px] md:text-[56px] lg:text-[64px] leading-[1.04] font-bold tracking-tight ${className}`}
      style={{
        background: "var(--lp-heading)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[26px] sm:text-[32px] md:text-[38px] leading-[1.1] font-bold tracking-tight ${className}`}
      style={{
        background: "var(--lp-heading)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
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
      className={`rounded-2xl p-5 sm:p-6 border transition-all ${className}`}
      style={{
        background: accent ? "var(--lp-card-bg-accent)" : "var(--lp-card-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
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
      className="grid place-items-center rounded-xl shrink-0"
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
  const sizeCls = size === "lg" ? "px-6 py-3.5 text-[14.5px]" : "px-5 py-3 text-[13.5px]";

  const styleByVariant: Record<"primary" | "ghost", React.CSSProperties> = {
    primary: {
      background: "var(--lp-cta-grad)",
      color: "white",
      boxShadow: "var(--lp-cta-shadow)",
    },
    ghost: {
      background: "var(--lp-surface)",
      color: "var(--lp-text-2)",
      border: "1px solid var(--lp-border-2)",
    },
  };

  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-transform duration-150 hover:-translate-y-0.5 ${sizeCls} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} style={styleByVariant[variant]}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls} style={styleByVariant[variant]}>
      {children}
    </button>
  );
}

/* ───────────────────── Citation légale (référence CMF, etc.) ───────────────────── */

export function LegalRef({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] uppercase tracking-widest font-medium align-middle"
      style={{
        background: "var(--lp-legalref-bg)",
        border: "1px solid var(--lp-legalref-border)",
        color: "var(--lp-legalref-text)",
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
      {children}
    </span>
  );
}
