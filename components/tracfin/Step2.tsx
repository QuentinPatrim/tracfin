// components/tracfin/Step2.tsx — Étape 2 : Analyse des risques

"use client";

import { useState } from "react";
import { PAYS_NOIRE, PAYS_GRISE_REGIONS, type DossierForm } from "@/lib/tracfin";
import { inputStyle, Sect, Field, RiskSelect, BinaryField } from "./primitives";

interface Props {
  form: DossierForm;
  set: <K extends keyof DossierForm>(key: K, value: DossierForm[K]) => void;
}

function PaysModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.40)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{
          background: "white",
          border: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "0 30px 80px -20px rgba(15,23,42,0.30)",
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold" style={{ color: "#0f172a" }}>Pays sous surveillance GAFI</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: "#94a3b8" }}
          >×</button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: "#b91c1c" }}>Liste noire</h4>
          <div className="flex flex-wrap gap-2">
            {PAYS_NOIRE.map((p) => (
              <span
                key={p}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.30)",
                  color: "#b91c1c",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: "#b45309" }}>Liste grise</h4>
          {PAYS_GRISE_REGIONS.map((g) => (
            <div key={g.region} className="mb-4">
              <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>{g.region}</div>
              <div className="flex flex-wrap gap-2">
                {g.pays.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.30)",
                      color: "#b45309",
                    }}
                  >
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
            className="self-start text-xs underline mt-1"
            style={{ color: "#6d28d9" }}
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

      {/* ─── Section Origine des fonds : ACQUÉREUR uniquement ─── */}
      {form.partie === "acquereur" && (
        <Sect title="Origine des fonds" sub="Côté acquéreur">
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
      )}

      {/* ─── Section Origine du bien : VENDEUR uniquement ─── */}
      {form.partie === "vendeur" && (
        <Sect title="Origine du bien vendu" sub="Côté vendeur">
          <Field label="Comment le vendeur a-t-il acquis ce bien ?">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.justifFonds}
              onChange={(e) => set("justifFonds", e.target.value)}
              placeholder="Achat en 2015 (prêt bancaire) — héritage 2018 — construction 2010 — donation..."
            />
          </Field>
          <div
            className="rounded-xl px-3 py-2.5 text-[12px]"
            style={{
              background: "rgba(124,58,237,0.05)",
              border: "1px solid rgba(124,58,237,0.20)",
              color: "#475569",
            }}
          >
            <span className="font-semibold" style={{ color: "#6d28d9" }}>ℹ️ Côté vendeur</span> — Les questions relatives à l&apos;origine des fonds (mode de paiement, financement, espèces) ne s&apos;appliquent pas. Concentrez-vous sur la traçabilité du bien cédé.
          </div>
        </Sect>
      )}

      <Sect title="Transaction" sub="Bien & financement">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Type de bien">
            <RiskSelect optionsKey="typeBien" value={form.typeBien} onChange={(v) => set("typeBien", v)} />
          </Field>
          <Field label={form.partie === "vendeur" ? "Prix de vente (€)" : "Montant de l'opération (€)"}>
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

        {/* Montage / paiement / cohérence prix : ACQUÉREUR uniquement */}
        {form.partie === "acquereur" && (
          <>
            <Field label="Montage financier">
              <RiskSelect optionsKey="montageFinancier" value={form.montageFinancier} onChange={(v) => set("montageFinancier", v)} />
            </Field>

            <Field label="Mode de paiement">
              <RiskSelect optionsKey="modePaiement" value={form.modePaiement} onChange={(v) => set("modePaiement", v)} />
              <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>
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
          </>
        )}
      </Sect>

      <Sect title="Bénéficiaires effectifs">
        <Field label="RBE (Registre des Bénéficiaires Effectifs)">
          <RiskSelect optionsKey="rbe" value={form.rbe} onChange={(v) => set("rbe", v)} />
        </Field>
      </Sect>

      <Sect title="Sanctions & PPE" sub="Gates absolues — L561-10, L561-15">
        {/* Outils de screening pré-remplis avec le nom du client */}
        <ScreeningTools nom={form.nomPrenom} />

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

/* ─── ScreeningTools : un seul bouton Open Sanctions (agrège DGT + UE + ONU + 200+ listes) ───── */
function ScreeningTools({ nom }: { nom: string }) {
  const cleanedName = nom.trim();
  const hasName = cleanedName.length >= 2;
  const q = encodeURIComponent(cleanedName);
  const openSanctions = `https://www.opensanctions.org/search/?q=${q}`;

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "linear-gradient(180deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04) 60%, rgba(255,255,255,0.02))",
        border: "1px solid rgba(168,85,247,0.25)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 30px -10px rgba(168,85,247,0.18)",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#6d28d9" }}>
            Vérification des sanctions internationales
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#475569" }}>
            {hasName ? (
              <>Lance une recherche pour <span className="font-semibold" style={{ color: "#0f172a" }}>«&nbsp;{cleanedName}&nbsp;»</span> contre les listes officielles agrégées de :</>
            ) : (
              <>Renseignez d&apos;abord le nom du client à l&apos;étape 1 pour activer la vérification.</>
            )}
          </p>
          {hasName && (
            <ul className="text-[11px] leading-relaxed mt-2 space-y-0.5" style={{ color: "#64748b" }}>
              <li>• <strong style={{ color: "#334155" }}>DGT Trésor France</strong> (Registre national des gels)</li>
              <li>• <strong style={{ color: "#334155" }}>UE Consolidated</strong> (sanctions financières européennes)</li>
              <li>• <strong style={{ color: "#334155" }}>ONU Security Council</strong></li>
              <li>• <strong style={{ color: "#334155" }}>OFAC US</strong> + 200+ autres listes officielles</li>
            </ul>
          )}
        </div>
      </div>

      <a
        href={hasName ? openSanctions : undefined}
        target="_blank"
        rel="noreferrer noopener"
        aria-disabled={!hasName}
        onClick={(e) => { if (!hasName) e.preventDefault(); }}
        className="group flex items-center justify-center gap-2.5 rounded-lg px-4 py-3 transition-all w-full"
        style={{
          background: hasName
            ? "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)"
            : "rgba(255,255,255,0.04)",
          border: hasName ? "1px solid rgba(255,255,255,0.20)" : "1px solid rgba(255,255,255,0.08)",
          cursor: hasName ? "pointer" : "not-allowed",
          opacity: hasName ? 1 : 0.5,
          textDecoration: "none",
          boxShadow: hasName
            ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 20px rgba(168,85,247,0.30)"
            : "none",
          color: "white",
          fontWeight: 600,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <span className="text-[13px]">
          {hasName ? "Vérifier sur Open Sanctions" : "Nom du client requis"}
        </span>
        {hasName && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
        )}
      </a>
    </div>
  );
}