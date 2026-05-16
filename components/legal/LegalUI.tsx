// components/legal/LegalUI.tsx — Primitives de mise en forme des pages légales

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
      <div className="inline-block px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10.5px] uppercase tracking-widest text-white/70 mb-5">
        {eyebrow}
      </div>
      <h1
        className="text-[34px] md:text-[42px] leading-[1.05] font-bold tracking-tight"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-[15px] text-white/65 leading-relaxed max-w-2xl">{subtitle}</p>
      )}
      <p className="mt-5 text-[11.5px] text-white/40 uppercase tracking-widest">
        Dernière mise à jour : {updatedAt}
      </p>
    </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight text-white mb-4 flex items-center gap-3">
        <span
          className="inline-block w-1 h-5 rounded-full"
          style={{ background: "linear-gradient(180deg, #7c3aed, #ec4899)" }}
        />
        {title}
      </h2>
      <div className="text-[14px] text-white/75 leading-relaxed space-y-3 prose-legal">
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[14px] text-white/75 leading-relaxed">{children}</p>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="text-white font-semibold">{children}</strong>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12.5px] text-white/45 italic leading-relaxed border-l-2 border-white/10 pl-3">
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
    info: {
      border: "rgba(124,58,237,0.30)",
      bg: "rgba(124,58,237,0.06)",
      titleColor: "#c4b5fd",
    },
    warn: {
      border: "rgba(245,158,11,0.35)",
      bg: "rgba(245,158,11,0.06)",
      titleColor: "#fcd34d",
    },
    legal: {
      border: "rgba(236,72,153,0.30)",
      bg: "rgba(236,72,153,0.06)",
      titleColor: "#f9a8d4",
    },
  }[tone];

  return (
    <div
      className="rounded-xl p-4 my-2"
      style={{
        border: `1px solid ${styles.border}`,
        background: styles.bg,
      }}
    >
      {title && (
        <div className="text-[12px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: styles.titleColor }}>
          {title}
        </div>
      )}
      <div className="text-[13.5px] text-white/80 leading-relaxed">{children}</div>
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 text-[14px] text-white/75 leading-relaxed list-none pl-0">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0"
        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
      />
      <span>{children}</span>
    </li>
  );
}

export function DefCard({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="rounded-lg p-3.5 bg-white/[0.03] border border-white/[0.08]">
      <div className="text-[11px] uppercase tracking-widest text-white/45 mb-1">{term}</div>
      <div className="text-[13.5px] text-white/85 leading-relaxed">{children}</div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] my-3">
      <table className="w-full text-[13px] text-left">{children}</table>
    </div>
  );
}

export function TH({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-2.5 bg-white/[0.04] text-white/60 font-medium text-[11.5px] uppercase tracking-widest border-b border-white/[0.06]">
      {children}
    </th>
  );
}

export function TD({ children }: { children: ReactNode }) {
  return (
    <td className="px-4 py-3 text-white/75 align-top border-b border-white/[0.04]">{children}</td>
  );
}
