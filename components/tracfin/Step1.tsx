// components/tracfin/Step1.tsx — Étape 1 : Identification du client

"use client";

import { OPTIONS, type DossierForm } from "@/lib/tracfin";
import { inputStyle, Sect, Field, Toggle, Check } from "./primitives";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
}

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

        {isMorale ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date de constitution">
              <input type="date" className={inputStyle} value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} />
            </Field>
            <Field label="Activité principale">
              <input className={inputStyle} value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Ex: Promotion immobilière" />
            </Field>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date de naissance">
                <input type="date" className={inputStyle} value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} />
              </Field>
              <Field label="Lieu de naissance">
                <input className={inputStyle} value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} placeholder="Ex: Paris" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nationalité">
                <input className={inputStyle} value={form.nationalite} onChange={(e) => set("nationalite", e.target.value)} placeholder="Ex: Française" />
              </Field>
              <Field label="Profession / Activité">
                <input className={inputStyle} value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Ex: Ingénieur" />
              </Field>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pays (risque géographique)">
            <select
              value={form.paysNationalite}
              onChange={(e) => set("paysNationalite", e.target.value)}
              className={`${inputStyle} appearance-none cursor-pointer`}
            >
              <option value="">— Sélectionner —</option>
              {OPTIONS.paysNationalite.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Secteur d'activité">
            <select
              value={form.secteurActivite}
              onChange={(e) => set("secteurActivite", e.target.value)}
              className={`${inputStyle} appearance-none cursor-pointer`}
            >
              <option value="">— Sélectionner —</option>
              {OPTIONS.secteurActivite.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
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

      <Sect title="Détection" sub="Métadonnée d'audit">
        <Field label="Date de détection" hint="Date à laquelle vous avez identifié pour la première fois ce dossier comme nécessitant une analyse LCB-FT.">
          <input type="date" className={inputStyle} value={form.dateDetection} onChange={(e) => set("dateDetection", e.target.value)} />
        </Field>
      </Sect>
    </>
  );
}