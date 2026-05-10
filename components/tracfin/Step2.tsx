// components/tracfin/Step2.tsx — Étape 2 : Analyse des risques

"use client";

import { useState } from "react";
import { OPTIONS, PAYS_NOIRE, PAYS_GRISE_REGIONS, type DossierForm } from "@/lib/tracfin";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
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

const RISK_BORDER = { green: "border-emerald-500/40", orange: "border-orange-500/40", red: "border-red-500/40" };
const RISK_BG = { green: "bg-emerald-500/10 text-emerald-300", orange: "bg-orange-500/10 text-orange-300", red: "bg-red-500/10 text-red-300" };

const RiskSelect = ({ optionsKey, value, onChange }: { optionsKey: keyof typeof OPTIONS; value: string; onChange: (v: string) => void }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputStyle} appearance-none cursor-pointer ${
      value && OPTIONS[optionsKey].find((o) => o.value === value)
        ? `${RISK_BORDER[OPTIONS[optionsKey].find((o) => o.value === value)!.risk]}`
        : ""
    }`}
  >
    <option value="" className="bg-slate-900">— Sélectionner —</option>
    {OPTIONS[optionsKey].map((o) => (
      <option key={o.value} value={o.value} className="bg-slate-900">
        {o.label}
      </option>
    ))}
  </select>
);

const BinaryField = ({ label, value, onChange, yesLabel = "Oui", noLabel = "Non", yesIsBad = true }: { label: string; value: boolean | null; onChange: (v: boolean) => void; yesLabel?: string; noLabel?: string; yesIsBad?: boolean }) => (
  <Field label={label}>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
          value === false
            ? yesIsBad
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
        }`}
      >
        {noLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
          value === true
            ? yesIsBad
              ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
              : "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
        }`}
      >
        {yesLabel}
      </button>
    </div>
  </Field>
);

function PaysModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/90 border border-white/[0.12] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Pays sous surveillance GAFI</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-widest">Liste noire</h4>
          <div className="flex flex-wrap gap-2">
            {PAYS_NOIRE.map((p) => (
              <span key={p} className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs text-red-300">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-widest">Liste grise</h4>
          {PAYS_GRISE_REGIONS.map((g) => (
            <div key={g.region} className="mb-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">{g.region}</div>
              <div className="flex flex-wrap gap-2">
                {g.pays.map((p) => (
                  <span key={p} className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Step2({ form, set }: Props) {
  const [showPays, setShowPays] = useState(false);

  return (
    <>
      {showPays && <PaysModal onClose={() => setShowPays(false)} />}

      <Sect title="Risque géographique" sub="Liste GAFI">
        <Field label="Résidence fiscale">
          <RiskSelect optionsKey="residenceFiscale" value={form.residenceFiscale} onChange={(v) => set("residenceFiscale", v)} />
          <button
            type="button"
            onClick={() => setShowPays(true)}
            className="self-start text-xs text-indigo-400 hover:text-indigo-300 underline mt-1"
          >
            Voir la liste des pays GAFI
          </button>
        </Field>

        <Field label="Lieu du bien immobilier">
          <RiskSelect optionsKey="lieuBien" value={form.lieuBien} onChange={(v) => set("lieuBien", v)} />
        </Field>

        <Field label="Comportement du client">
          <RiskSelect optionsKey="comportement" value={form.comportement} onChange={(v) => set("comportement", v)} />
        </Field>
      </Sect>

      <Sect title="Origine des fonds">
        <Field label="Source des fonds">
          <RiskSelect optionsKey="origineFonds" value={form.origineFonds} onChange={(v) => set("origineFonds", v)} />
        </Field>
        <Field label="Justification (optionnel)">
          <textarea
            className={`${inputStyle} min-h-[80px] resize-none`}
            value={form.justifFonds}
            onChange={(e) => set("justifFonds", e.target.value)}
            placeholder="Détails complémentaires..."
          />
        </Field>
      </Sect>

      <Sect title="Transaction" sub="Bien & financement">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Type de bien">
            <RiskSelect optionsKey="typeBien" value={form.typeBien} onChange={(v) => set("typeBien", v)} />
          </Field>
          <Field label="Montant de l'opération (€)">
            <input
              type="number"
              min="0"
              className={inputStyle}
              value={form.montantTransaction}
              onChange={(e) => set("montantTransaction", e.target.value)}
              placeholder="500000"
            />
          </Field>
        </div>

        <Field label="Montage financier">
          <RiskSelect optionsKey="montageFinancier" value={form.montageFinancier} onChange={(v) => set("montageFinancier", v)} />
        </Field>

        <Field label="Mode de paiement">
          <RiskSelect optionsKey="modePaiement" value={form.modePaiement} onChange={(v) => set("modePaiement", v)} />
          <p className="text-[11px] text-white/40 mt-1">
            Espèces &gt; 1 000 € interdites (art. L112-6 CMF) entre professionnel et particulier.
          </p>
        </Field>

        <Field label="Cohérence du prix">
          <RiskSelect optionsKey="coherencePrix" value={form.coherencePrix} onChange={(v) => set("coherencePrix", v)} />
        </Field>
        <Field label="Justification du prix (optionnel)">
          <textarea
            className={`${inputStyle} min-h-[80px] resize-none`}
            value={form.justifPrix}
            onChange={(e) => set("justifPrix", e.target.value)}
            placeholder="Comparables, expertise, référence DVF..."
          />
        </Field>
      </Sect>

      <Sect title="Bénéficiaires effectifs">
        <Field label="RBE (Registre des Bénéficiaires Effectifs)">
          <RiskSelect optionsKey="rbe" value={form.rbe} onChange={(v) => set("rbe", v)} />
        </Field>
      </Sect>

      <Sect title="Sanctions & PPE" sub="Gates absolues — L561-10, L561-15">
        <BinaryField
          label="Personne sous gel des avoirs ?"
          value={form.gelAvoirs}
          onChange={(v) => set("gelAvoirs", v)}
          yesIsBad={true}
        />
        {form.gelAvoirs && (
          <Field label="Date de l'arrêté">
            <input type="date" className={inputStyle} value={form.gelDate} onChange={(e) => set("gelDate", e.target.value)} />
          </Field>
        )}
        <BinaryField
          label="Présence sur une liste de sanctions internationales (UE / ONU / Trésor) ?"
          value={form.sanctionsListe}
          onChange={(v) => set("sanctionsListe", v)}
          yesIsBad={true}
        />
        <BinaryField
          label="Le client lui-même est-il une Personne Politiquement Exposée (PPE) ?"
          value={form.ppe}
          onChange={(v) => set("ppe", v)}
          yesIsBad={true}
        />
        <BinaryField
          label="Un proche du client est-il PPE ? (conjoint, parent, enfant, fratrie, beau-parent — L561-10 1°)"
          value={form.ppeProcheDetecte}
          onChange={(v) => set("ppeProcheDetecte", v)}
          yesIsBad={true}
        />
      </Sect>
    </>
  );
}