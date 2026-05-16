// components/dashboard/primitives.tsx — Primitives dashboard cohérentes avec la landing
// Variante "light" des primitives de components/landing/primitives.tsx.
// Même vocabulaire (Eyebrow, H1/H2/H3, P, Card, IconCircle, LegalRef) mais
// adapté au fond clair du dashboard pour préserver l'ADN visuel de la marque.

import type { ReactNode, ComponentType } from "react";

/* ─── Eyebrow (étiquette de section) ─── */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest font-semibold"
      style={{
        background: "rgba(124,58,237,0.08)",
        border: "1px solid rgba(124,58,237,0.18)",
        color: "#6d28d9",
      }}
    >
      {children}
    </span>
  );
}

/* ─── Titres (gradient violet→magenta sur fond clair) ─── */
export function H1({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={`text-[28px] sm:text-[34px] md:text-[42px] leading-[1.05] font-bold tracking-tight ${className}`}
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #4C1D95 100%)",
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
      className={`text-[22px] sm:text-[26px] leading-[1.1] font-bold tracking-tight ${className}`}
      style={{
        background: "linear-gradient(135deg, #0F172A 0%, #6d28d9 100%)",
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
      className={`text-[15px] sm:text-[16px] font-semibold tracking-tight ${className}`}
      style={{ color: "#0F172A" }}
    >
      {children}
    </h3>
  );
}

/* ─── Paragraphes ─── */
export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[13.5px] leading-relaxed ${className}`} style={{ color: "#475569" }}>
      {children}
    </p>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[14.5px] sm:text-[15px] leading-relaxed ${className}`} style={{ color: "#475569" }}>
      {children}
    </p>
  );
}

/* ─── Icon circle (cohérent avec la landing) ─── */
export function IconCircle({
  icon: Icon,
  size = "md",
}: {
  icon: ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  size?: "sm" | "md" | "lg";
}) {
  const dim = { sm: 32, md: 40, lg: 48 }[size];
  const iconDim = { sm: 14, md: 17, lg: 20 }[size];
  return (
    <div
      className="grid place-items-center rounded-xl shrink-0"
      style={{
        width: dim,
        height: dim,
        background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.08))",
        border: "1px solid rgba(124,58,237,0.22)",
        boxShadow: "0 4px 12px rgba(124,58,237,0.10), 0 1px 0 rgba(255,255,255,0.8) inset",
      }}
    >
      <Icon width={iconDim} height={iconDim} style={{ color: "#6d28d9" }} />
    </div>
  );
}

/* ─── Card (glass light) ─── */
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
      className={`rounded-2xl p-5 sm:p-6 transition-all ${className}`}
      style={{
        background: accent
          ? "linear-gradient(180deg, rgba(124,58,237,0.04), rgba(255,255,255,0.85))"
          : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(170%)",
        WebkitBackdropFilter: "blur(20px) saturate(170%)",
        border: `1px solid ${accent ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.08)"}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 4px 14px rgba(124,58,237,0.06)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Référence légale (cohérent avec la landing, variante light) ─── */
export function LegalRef({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] uppercase tracking-widest font-semibold align-middle"
      style={{
        background: "rgba(236,72,153,0.08)",
        border: "1px solid rgba(236,72,153,0.22)",
        color: "#be185d",
      }}
    >
      <span
        className="w-1 h-1 rounded-full"
        style={{ background: "#ec4899" }}
      />
      {children}
    </span>
  );
}

/* ─── Section header (Eyebrow + H2 + sous-titre) ─── */
export function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: ReactNode;
  desc?: ReactNode;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      {eyebrow && (
        <div className="mb-3">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <H2>{title}</H2>
      {desc && (
        <div className="mt-3">
          <Lede>{desc}</Lede>
        </div>
      )}
    </div>
  );
}

/* ─── EmptyState pédagogique (style guide) ─── */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  icon: ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div
      className="relative rounded-3xl p-8 sm:p-12 text-center overflow-hidden mx-auto max-w-2xl"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
        backdropFilter: "blur(20px) saturate(170%)",
        WebkitBackdropFilter: "blur(20px) saturate(170%)",
        border: "1px solid rgba(124,58,237,0.14)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 60px -20px rgba(124,58,237,0.18), 0 8px 24px -8px rgba(15,23,42,0.06)",
      }}
    >
      {/* Halo intérieur */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: -80, left: -80,
          width: 280, height: 280,
          background: "radial-gradient(circle, rgba(124,58,237,0.16), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: -80, right: -80,
          width: 280, height: 280,
          background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative">
        <div className="inline-flex mb-5">
          <IconCircle icon={Icon} size="lg" />
        </div>
        {eyebrow && (
          <div className="flex justify-center mb-3">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        )}
        <H2 className="!text-[22px] sm:!text-[26px]">{title}</H2>
        <div className="mt-3 max-w-md mx-auto">
          <Lede>{description}</Lede>
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mini stat (chiffre + label, cohérent avec la landing) ─── */
export function Stat({
  value,
  label,
  tone = "accent",
}: {
  value: string | number;
  label: string;
  tone?: "accent" | "success" | "warn" | "danger";
}) {
  const tones = {
    accent:  { color: "#6d28d9", bg: "rgba(124,58,237,0.06)",  border: "rgba(124,58,237,0.18)" },
    success: { color: "#047857", bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.22)" },
    warn:    { color: "#b45309", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.22)" },
    danger:  { color: "#be123c", bg: "rgba(225,29,72,0.06)",   border: "rgba(225,29,72,0.22)" },
  }[tone];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{ background: tones.bg, borderColor: tones.border }}
    >
      <span className="text-[14px] font-bold tabular-nums" style={{ color: tones.color }}>{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}
