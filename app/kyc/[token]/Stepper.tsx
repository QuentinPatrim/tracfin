// app/kyc/[token]/Stepper.tsx — Barre de progression sticky du wizard KYC

"use client";

import KlarisLogo from "@/components/ui/KlarisLogo";

interface StepDef {
  key: string;
  label: string;
}

interface Props {
  steps: StepDef[];
  current: number;
  onJumpBack: (i: number) => void;
}

export default function Stepper({ steps, current, onJumpBack }: Props) {
  const total = steps.length;

  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--lp-nav-bg-scrolled)",
        borderColor: "var(--lp-border-1)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        {/* Brand + position */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <KlarisLogo size={28} />
            <div className="text-[14px] font-bold tracking-tight" style={{ color: "var(--lp-text)" }}>Klaris</div>
          </div>
          <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--lp-text-4)" }}>
            Étape {current + 1} / {total}
          </div>
        </div>

        {/* Segments cliquables (un par étape) — barre unique, lisible et navigable */}
        <div className="flex gap-1">
          {steps.map((s, i) => {
            const isPast = i < current;
            const isActive = i === current;
            const clickable = i <= current;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => clickable && onJumpBack(i)}
                disabled={!clickable}
                className="flex-1 h-1 rounded-full transition-all"
                style={{
                  background: isPast
                    ? "var(--lp-accent)"
                    : isActive
                    ? "var(--lp-cta-grad)"
                    : "var(--lp-surface-2)",
                  cursor: clickable ? "pointer" : "default",
                  opacity: clickable ? 1 : 0.55,
                }}
                aria-label={`Aller à : ${s.label}`}
                title={s.label}
              />
            );
          })}
        </div>

        <div className="mt-1.5 text-[12.5px] font-semibold" style={{ color: "var(--lp-text-2)" }}>
          {steps[current]?.label}
        </div>
      </div>
    </div>
  );
}
