// components/tracfin/Step3.tsx — Étape 3 : Récap & validation

"use client";

import { OPTIONS, RISK_LABELS, type DossierForm, type Risk, type ScoreResult, type StatutKey } from "@/lib/tracfin";
import { inputStyle, Sect, Field } from "./primitives";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
  score: ScoreResult;
}

// ─── Palette light contrastée pour Step3 (lisible sur fond blanc) ──
const RISK_LIGHT: Record<Risk, { color: string; bg: string; border: string; label: string }> = {
  green:  { color: "#047857", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.35)", label: "Conforme" },
  orange: { color: "#b45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.35)", label: "Vigilance" },
  red:    { color: "#b91c1c", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.35)", label: "Critique" },
};

interface StatusLight { color: string; bg: string; border: string; title: string; sub: string; }
const STATUS_LIGHT: Record<StatutKey, StatusLight> = {
  valid:    { color: "#047857", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.30)", title: "Vigilance standard — Conforme", sub: "Traiter normalement. Archivage 5 ans (L561-12-1)." },
  vigilance:{ color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", title: "Vigilance renforcée requise", sub: "Justificatifs additionnels + validation correspondant LCB-FT." },
  stop:     { color: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", title: "Vigilance renforcée requise", sub: "Justificatifs additionnels + validation correspondant LCB-FT." },
  critical: { color: "#b91c1c", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.30)", title: "Examen renforcé", sub: "Suspension immédiate de la transaction. Délibération formalisée." },
};

export default function Step3({ form, set, score }: Props) {
  const cfg = STATUS_LIGHT[score.statutKey];

  const labelFor = (key: keyof typeof OPTIONS, value: string) =>
    OPTIONS[key]?.find((o) => o.value === value)?.label ?? "—";

  return (
    <>
      {/* Verdict principal */}
      <div
        className="relative rounded-2xl p-8 mb-6 overflow-hidden border"
        style={{ background: cfg.bg, borderColor: cfg.border, boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 8px 24px rgba(15,23,42,0.06)` }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: cfg.color }}>
          Verdict de conformité
        </div>
        <div className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: cfg.color }}>
          {cfg.title}
        </div>
        <div className="text-sm max-w-lg" style={{ color: cfg.color, opacity: 0.85 }}>{cfg.sub}</div>
      </div>

      {/* Détail des risques */}
      <Sect title="Détail par critère">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(score.risks).map(([key, risk]) => {
            if (!risk) return null;
            const rcfg = RISK_LIGHT[risk];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
                style={{ background: rcfg.bg, borderColor: rcfg.border }}
              >
                <span className="text-xs font-medium" style={{ color: rcfg.color }}>{RISK_LABELS[key]}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: rcfg.color }}>
                  {rcfg.label}
                </span>
              </div>
            );
          })}

          {score.gelCritique && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border md:col-span-2"
              style={{ background: RISK_LIGHT.red.bg, borderColor: RISK_LIGHT.red.border }}>
              <span className="text-xs font-medium" style={{ color: RISK_LIGHT.red.color }}>Gel des avoirs</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RISK_LIGHT.red.color }}>Critique</span>
            </div>
          )}
          {score.ppeVigilance && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border md:col-span-2"
              style={{ background: RISK_LIGHT.orange.bg, borderColor: RISK_LIGHT.orange.border }}>
              <span className="text-xs font-medium" style={{ color: RISK_LIGHT.orange.color }}>Personne politiquement exposée</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RISK_LIGHT.orange.color }}>Vigilance</span>
            </div>
          )}
        </div>
      </Sect>

      {/* Synthèse client */}
      <Sect title="Synthèse" sub="Données saisies">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Type de client</div>
            <div style={{ color: "#0f172a" }}>{form.typeClient === "morale" ? "Personne Morale" : "Personne Physique"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Nom</div>
            <div style={{ color: "#0f172a" }}>{form.nomPrenom || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Origine des fonds</div>
            <div style={{ color: "#0f172a" }}>{labelFor("origineFonds", form.origineFonds)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Montage</div>
            <div style={{ color: "#0f172a" }}>{labelFor("montageFinancier", form.montageFinancier)}</div>
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
            <option value="">— Sélectionner —</option>
            {OPTIONS.formation.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </Sect>
    </>
  );
}