// components/tracfin/Step3.tsx — Étape 3 : Récap & validation

"use client";

import { OPTIONS, RISK_CFG, RISK_LABELS, STATUS_CFG, type DossierForm, type ScoreResult } from "@/lib/tracfin";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
  score: ScoreResult;
}

const inputStyle =
  "w-full bg-white/[0.04] border border-white/[0.12] rounded-xl px-4 py-[11px] text-white text-sm outline-none backdrop-blur-md placeholder:text-white/[0.28] transition-all focus:border-indigo-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-indigo-500/10";

const Sect = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <div className="relative bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl mb-6 overflow-hidden">
    <div className="bg-gradient-to-r from-indigo-500/10 to-transparent px-6 py-4 border-b border-white/[0.05] flex justify-between items-center">
      <span className="font-bold text-indigo-300 uppercase tracking-[0.15em] text-[10px]">{title}</span>
      {sub && <span className="text-[10px] text-white/30 uppercase tracking-widest">{sub}</span>}
    </div>
    <div className="p-6 flex flex-col gap-5">{children}</div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em]">{label}</label>
    {children}
  </div>
);

export default function Step3({ form, set, score }: Props) {
  const cfg = STATUS_CFG[score.statutKey];

  const labelFor = (key: keyof typeof OPTIONS, value: string) =>
    OPTIONS[key]?.find((o) => o.value === value)?.label ?? "—";

  return (
    <>
      {/* Verdict principal */}
      <div
        className="relative rounded-2xl p-8 mb-6 overflow-hidden border backdrop-blur-xl"
        style={{ background: cfg.bg, borderColor: cfg.border, boxShadow: `0 0 60px ${cfg.glow}` }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: cfg.color }}>
          Verdict de conformité
        </div>
        <div className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: cfg.color }}>
          {cfg.title}
        </div>
        <div className="text-sm text-white/60 mb-6 max-w-lg">{cfg.sub}</div>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/[0.05] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score.pct}%`, background: cfg.color, boxShadow: `0 0 12px ${cfg.glow}` }}
            />
          </div>
          <div className="text-2xl font-bold" style={{ color: cfg.color }}>{score.pct}%</div>
        </div>
      </div>

      {/* Détail des risques */}
      <Sect title="Détail par critère">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(score.risks).map(([key, risk]) => {
            if (!risk) return null;
            const cfg = RISK_CFG[risk];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md"
                style={{ background: cfg.bg, borderColor: cfg.border }}
              >
                <span className="text-xs text-white/70">{RISK_LABELS[key]}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}

          {score.gelCritique && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md md:col-span-2"
              style={{ background: RISK_CFG.red.bg, borderColor: RISK_CFG.red.border }}>
              <span className="text-xs text-white/70">Gel des avoirs</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Critique</span>
            </div>
          )}
          {score.ppeVigilance && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md md:col-span-2"
              style={{ background: RISK_CFG.orange.bg, borderColor: RISK_CFG.orange.border }}>
              <span className="text-xs text-white/70">Personne politiquement exposée</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Vigilance</span>
            </div>
          )}
        </div>
      </Sect>

      {/* Synthèse client */}
      <Sect title="Synthèse" sub="Données saisies">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Type de client</div>
            <div className="text-white/80">{form.typeClient === "morale" ? "Personne Morale" : "Personne Physique"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Nom</div>
            <div className="text-white/80">{form.nomPrenom || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Origine des fonds</div>
            <div className="text-white/80">{labelFor("origineFonds", form.origineFonds)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Montage</div>
            <div className="text-white/80">{labelFor("montageFinancier", form.montageFinancier)}</div>
          </div>
        </div>
      </Sect>

      {/* Validation par l'employé */}
      <Sect title="Validation" sub="Agent en charge">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom de l'employé">
            <input className={inputStyle} value={form.nomEmploye} onChange={(e) => set("nomEmploye", e.target.value)} placeholder="Votre nom" />
          </Field>
          <Field label="Responsable LCB-FT">
            <input className={inputStyle} value={form.responsableLCBFT} onChange={(e) => set("responsableLCBFT", e.target.value)} placeholder="Nom du responsable" />
          </Field>
        </div>

        <Field label="Formation Tracfin">
          <select
            value={form.formation}
            onChange={(e) => set("formation", e.target.value)}
            className={`${inputStyle} appearance-none cursor-pointer`}
          >
            <option value="" className="bg-slate-900">— Sélectionner —</option>
            {OPTIONS.formation.map((o) => (
              <option key={o.value} value={o.value} className="bg-slate-900">
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </Sect>
    </>
  );
}