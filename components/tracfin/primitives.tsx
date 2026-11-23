// components/tracfin/primitives.tsx — Primitives partagées Step1/2/3, variante light
// Cohérent avec le dashboard light (bg blanc, accent violet/magenta).

import { OPTIONS } from "@/lib/tracfin";

export const inputStyle =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-[11px] text-slate-900 text-sm outline-none placeholder:text-slate-400 transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15";

export function Sect({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-2xl mb-6 overflow-hidden"
      style={{
        background: "white",
        border: "1px solid rgba(47,91,255,0.10)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 14px rgba(11,20,53,0.12)",
      }}
    >
      <div
        className="px-6 py-3.5 flex items-center justify-between"
        style={{
          background: "linear-gradient(90deg, rgba(47,91,255,0.06) 0%, rgba(47,91,255,0.02) 100%)",
          borderBottom: "1px solid rgba(47,91,255,0.10)",
        }}
      >
        <span
          className="font-bold text-[11.5px]"
          style={{ color: "#1F45E0" }}
        >
          {title}
        </span>
        {sub && (
          <span className="text-[11.5px]" style={{ color: "#98A0BD" }}>
            {sub}
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

export function Field({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-semibold text-slate-500">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function Toggle({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all border"
            style={{
              background: active
                ? "linear-gradient(180deg, rgba(47,91,255,0.10), rgba(47,91,255,0.06))"
                : "white",
              borderColor: active ? "rgba(47,91,255,0.45)" : "rgba(11,20,53,0.10)",
              color: active ? "#1F45E0" : "#47507A",
              boxShadow: active ? "0 4px 14px rgba(47,91,255,0.15)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Check({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0"
        style={{
          background: checked ? "#16A06A" : "white",
          borderColor: checked ? "#16A06A" : "#D3DAEE",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

const RISK_BORDER_LIGHT: Record<string, string> = {
  green: "rgba(30,158,106,0.45)",
  orange: "rgba(227,160,8,0.45)",
  red: "rgba(197,48,44,0.45)",
};

export function RiskSelect({
  optionsKey, value, onChange,
}: {
  optionsKey: keyof typeof OPTIONS;
  value: string;
  onChange: (v: string) => void;
}) {
  const opt = value && OPTIONS[optionsKey].find((o) => o.value === value);
  const borderColor = opt ? RISK_BORDER_LIGHT[opt.risk] : undefined;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputStyle} appearance-none cursor-pointer`}
      style={borderColor ? { borderColor } : undefined}
    >
      <option value="">— Sélectionner —</option>
      {OPTIONS[optionsKey].map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function BinaryField({
  label, value, onChange, yesLabel = "Oui", noLabel = "Non", yesIsBad = true, hint,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  yesIsBad?: boolean;
  hint?: string;
}) {
  const styleFor = (isActive: boolean, isPositiveAnswer: boolean) => {
    if (!isActive) {
      return {
        background: "white",
        border: "1px solid rgba(11,20,53,0.10)",
        color: "#47507A",
      };
    }
    const isGreen = isPositiveAnswer;
    return {
      background: isGreen ? "rgba(30,158,106,0.08)" : "rgba(197,48,44,0.08)",
      border: `1px solid ${isGreen ? "rgba(30,158,106,0.45)" : "rgba(197,48,44,0.45)"}`,
      color: isGreen ? "#0F7A4F" : "#A3241F",
      boxShadow: `0 4px 12px ${isGreen ? "rgba(30,158,106,0.18)" : "rgba(197,48,44,0.18)"}`,
    };
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(false)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
          style={styleFor(value === false, yesIsBad)}
        >
          {noLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
          style={styleFor(value === true, !yesIsBad)}
        >
          {yesLabel}
        </button>
      </div>
    </Field>
  );
}

export function Select({
  value, options, onChange, placeholder = "— Sélectionner —",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputStyle} appearance-none cursor-pointer`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
