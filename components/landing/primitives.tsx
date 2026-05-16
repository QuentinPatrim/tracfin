// components/landing/primitives.tsx — Primitives sobres réutilisables (fintech / legaltech)
// Palette restreinte (violet/magenta + blanc). Aucun dégradé animé.
// Mobile-first natif (padding/typo qui s'adaptent).

import type { ReactNode, ComponentType } from "react";

/* ───────────────────── Eyebrow (étiquette de section) ───────────────────── */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-block px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.10] text-[10.5px] uppercase tracking-widest text-white/70">
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
        background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.72) 100%)",
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
        background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
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
    <h3 className={`text-[17px] sm:text-[18px] font-semibold tracking-tight text-white ${className}`}>
      {children}
    </h3>
  );
}

/* ───────────────────── Paragraphs ───────────────────── */

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[15px] sm:text-[16px] md:text-[17px] text-white/65 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[13.5px] sm:text-[14px] text-white/65 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11.5px] sm:text-[12px] text-violet-200 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded">
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
        background: accent
          ? "linear-gradient(180deg, rgba(124,58,237,0.06), rgba(255,255,255,0.02))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderColor: accent ? "rgba(124,58,237,0.22)" : "rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export function IconCircle({
  icon: Icon,
  size = "md",
}: {
  icon: ComponentType<{ width?: number; height?: number; className?: string }>;
  size?: "sm" | "md" | "lg";
}) {
  const dim = { sm: 36, md: 44, lg: 52 }[size];
  const iconDim = { sm: 16, md: 18, lg: 22 }[size];
  return (
    <div
      className="grid place-items-center rounded-xl shrink-0"
      style={{
        width: dim,
        height: dim,
        background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(236,72,153,0.12))",
        border: "1px solid rgba(124,58,237,0.28)",
        boxShadow: "0 4px 14px rgba(124,58,237,0.18), 0 1px 0 rgba(255,255,255,0.10) inset",
      }}
    >
      <Icon width={iconDim} height={iconDim} className="text-violet-200" />
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
      background: "linear-gradient(135deg, #7c3aed, #ec4899)",
      color: "white",
      boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 10px 28px rgba(124,58,237,0.35), 0 4px 10px rgba(0,0,0,0.25)",
    },
    ghost: {
      background: "rgba(255,255,255,0.04)",
      color: "rgba(255,255,255,0.85)",
      border: "1px solid rgba(255,255,255,0.10)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset",
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
        background: "rgba(236,72,153,0.08)",
        border: "1px solid rgba(236,72,153,0.20)",
        color: "#f9a8d4",
      }}
    >
      <span className="w-1 h-1 rounded-full bg-pink-300" />
      {children}
    </span>
  );
}
