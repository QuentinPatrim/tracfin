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
  const pct = ((current + 1) / total) * 100;

  return (
    <div
      className="sticky top-0 z-40 border-b border-white/[0.06]"
      style={{
        background: "rgba(6,7,13,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        {/* Brand + position */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <KlarisLogo size={28} />
            <div className="text-[14px] font-bold tracking-tight text-white">Klaris</div>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-white/55 font-semibold">
            Étape {current + 1} / {total}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #7c3aed, #ec4899)",
              boxShadow: "0 0 12px rgba(124,58,237,0.50)",
            }}
          />
        </div>

        {/* Dots cliquables pour revenir en arrière */}
        <div className="flex gap-1 mt-2">
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
                    ? "rgba(124,58,237,0.65)"
                    : isActive
                    ? "linear-gradient(90deg, #7c3aed, #ec4899)"
                    : "rgba(255,255,255,0.06)",
                  cursor: clickable ? "pointer" : "default",
                  opacity: clickable ? 1 : 0.55,
                }}
                aria-label={`Aller à : ${s.label}`}
                title={s.label}
              />
            );
          })}
        </div>

        <div className="mt-1.5 text-[12.5px] font-semibold text-white/85">
          {steps[current]?.label}
        </div>
      </div>
    </div>
  );
}
