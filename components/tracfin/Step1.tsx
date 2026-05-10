// components/tracfin/Step1.tsx — Étape 1 : Identification du client

"use client";

import { OPTIONS, type DossierForm } from "@/lib/tracfin";

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

const Toggle = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div className="flex gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
          value === o.value
            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/[0.03] transition">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
        checked ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-white/40"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
    <span className="text-sm text-white/80">{label}</span>
  </label>
);

export default function Step1({ form, set }: Props) {
  const isMorale = form.typeClient === "morale";

  return (
    <>
      <Sect title="Type de client">
        <Toggle
          value={form.typeClient}
          onChange={(v) => set("typeClient", v as "physique" | "morale")}
          options={[
            { value: "physique", label: "Personne Physique" },
            { value: "morale", label: "Personne Morale" },
          ]}
        />
      </Sect>

      <Sect title="Identité" sub={isMorale ? "Représentant légal" : "Client"}>
        <Field label={isMorale ? "Dénomination sociale" : "Nom et prénom"}>
          <input className={inputStyle} value={form.nomPrenom} onChange={(e) => set("nomPrenom", e.target.value)} placeholder={isMorale ? "Ex: ACME SAS" : "Ex: Martin Claire"} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={isMorale ? "Date de constitution" : "Date de naissance"}>
            <input type="date" className={inputStyle} value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} />
          </Field>
          <Field label={isMorale ? "Lieu d'immatriculation" : "Lieu de naissance"}>
            <input className={inputStyle} value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} placeholder="Ex: Paris" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={isMorale ? "Pays de constitution" : "Nationalité"}>
            <input className={inputStyle} value={form.nationalite} onChange={(e) => set("nationalite", e.target.value)} placeholder="Ex: Française" />
          </Field>
          <Field label="Profession / Activité">
            <input className={inputStyle} value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Ex: Ingénieur" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pays (risque géographique)">
            <select
              value={form.paysNationalite}
              onChange={(e) => set("paysNationalite", e.target.value)}
              className={`${inputStyle} appearance-none cursor-pointer`}
            >
              <option value="" className="bg-slate-900">— Sélectionner —</option>
              {OPTIONS.paysNationalite.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Secteur d'activité">
            <select
              value={form.secteurActivite}
              onChange={(e) => set("secteurActivite", e.target.value)}
              className={`${inputStyle} appearance-none cursor-pointer`}
            >
              <option value="" className="bg-slate-900">— Sélectionner —</option>
              {OPTIONS.secteurActivite.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Adresse">
          <input className={inputStyle} value={form.adresse} onChange={(e) => set("adresse", e.target.value)} placeholder="N°, rue, code postal, ville" />
        </Field>
      </Sect>

      <Sect title="Pièces justificatives">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {!isMorale && (
            <>
              <Check label="Pièce d'identité" checked={form.pieceIdentite} onChange={(v) => set("pieceIdentite", v)} />
              <Check label="Justificatif de domicile" checked={form.justifDomicile} onChange={(v) => set("justifDomicile", v)} />
            </>
          )}
          {isMorale && (
            <>
              <Check label="Extrait Kbis (-3 mois)" checked={form.kbis} onChange={(v) => set("kbis", v)} />
              <Check label="Statuts à jour" checked={form.statuts} onChange={(v) => set("statuts", v)} />
              <Check label="CNI du gérant" checked={form.cniGerant} onChange={(v) => set("cniGerant", v)} />
            </>
          )}
        </div>
      </Sect>

      <Sect title="Détection" sub="Métadonnées">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date de détection">
            <input type="date" className={inputStyle} value={form.dateDetection} onChange={(e) => set("dateDetection", e.target.value)} />
          </Field>
          <Field label="Lien KYC (optionnel)">
            <input className={inputStyle} value={form.lienKyc} onChange={(e) => set("lienKyc", e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Sect>
    </>
  );
}