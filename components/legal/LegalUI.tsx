// components/legal/LegalUI.tsx — Primitives de mise en forme des pages légales
// Thémé clair/sombre via tokens --lp-* (aucune couleur en dur).

import type { ReactNode } from "react";

export function LegalTitle({
  eyebrow,
  title,
  subtitle,
  updatedAt,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
}) {
  return (
    <div className="mb-12">
      <div
        className="inline-block px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest mb-5"
        style={{ background: "var(--lp-surface-2)", border: "1px solid var(--lp-border-2)", color: "var(--lp-text-3)" }}
      >
        {eyebrow}
      </div>
      <h1
        className="text-[34px] md:text-[42px] leading-[1.05] font-bold tracking-tight"
        style={{
          background: "var(--lp-heading)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-[15px] leading-relaxed max-w-2xl" style={{ color: "var(--lp-text-3)" }}>{subtitle}</p>
      )}
      <p className="mt-5 text-[11.5px] uppercase tracking-widest" style={{ color: "var(--lp-text-4)" }}>
        Dernière mise à jour : {updatedAt}
      </p>
    </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight mb-4 flex items-center gap-3" style={{ color: "var(--lp-text)" }}>
        <span className="inline-block w-1 h-5 rounded-full" style={{ background: "var(--lp-cta-grad)" }} />
        {title}
      </h2>
      <div className="text-[14px] leading-relaxed space-y-3 prose-legal" style={{ color: "var(--lp-text-3)" }}>
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{children}</p>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold" style={{ color: "var(--lp-text)" }}>{children}</strong>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12.5px] italic leading-relaxed border-l-2 pl-3" style={{ color: "var(--lp-text-4)", borderColor: "var(--lp-border-2)" }}>
      {children}
    </p>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "legal";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: { border: "var(--lp-card-border-accent)", bg: "var(--lp-card-bg-accent)", titleColor: "var(--lp-accent-text)" },
    warn: { border: "var(--lp-warn-border)", bg: "var(--lp-warn-bg)", titleColor: "var(--lp-warn)" },
    legal: { border: "var(--lp-legalref-border)", bg: "var(--lp-legalref-bg)", titleColor: "var(--lp-legalref-text)" },
  }[tone];

  return (
    <div className="rounded-xl p-4 my-2" style={{ border: `1px solid ${styles.border}`, background: styles.bg }}>
      {title && (
        <div className="text-[12px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: styles.titleColor }}>
          {title}
        </div>
      )}
      <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>{children}</div>
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 text-[14px] leading-relaxed list-none pl-0" style={{ color: "var(--lp-text-3)" }}>{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--lp-cta-grad)" }} />
      <span>{children}</span>
    </li>
  );
}

export function DefCard({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-lg p-3.5" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}>
      <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--lp-text-4)" }}>{term}</div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--lp-text-2)" }}>{children}</div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden my-3" style={{ border: "1px solid var(--lp-border-2)" }}>
      <table className="w-full text-[13px] text-left">{children}</table>
    </div>
  );
}

export function TH({ children }: { children: ReactNode }) {
  return (
    <th
      className="px-4 py-2.5 font-medium text-[11.5px] uppercase tracking-widest border-b"
      style={{ background: "var(--lp-surface)", color: "var(--lp-text-3)", borderColor: "var(--lp-border-1)" }}
    >
      {children}
    </th>
  );
}

export function TD({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-3 align-top border-b" style={{ color: "var(--lp-text-3)", borderColor: "var(--lp-border-1)" }}>{children}</td>
  );
}
