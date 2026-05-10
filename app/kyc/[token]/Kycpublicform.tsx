// app/kyc/[token]/KycPublicForm.tsx — Formulaire KYC client v2 (DGCCRF + RGPD art. 13)

"use client";

import { useState, useCallback } from "react";
import { ShieldCheck, Check, ChevronDown, ChevronUp, Plus, Trash2, Lock } from "lucide-react";
import {
  initialKycForm,
  ORIGINE_FONDS_OPTIONS,
  MODE_FINANCEMENT_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
  TYPE_BIEN_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PAYS_OPTIONS,
  LIEU_BIEN_OPTIONS,
  FORME_JURIDIQUE_OPTIONS,
  PIECE_IDENTITE_TYPES,
  TYPE_CONTROLE_BE_OPTIONS,
  MENTION_CNIL_VERSION,
  type KycForm,
  type BeneficiaireEffectif,
} from "@/lib/kyc";
import AmbientOrbs from "@/components/tracfin/AmbientOrbs";
import FileUpload from "@/components/kyc/Fileupload";

interface Props {
  token: string;
  dossierId: string;
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

const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.12em]">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-white/40 leading-relaxed">{hint}</p>}
  </div>
);

function YesNo({ value, onChange, yesLabel = "Oui", noLabel = "Non" }: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
          value === false
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
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
            ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
            : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
        }`}
      >
        {yesLabel}
      </button>
    </div>
  );
}

function Selectt<T extends { value: string; label: string }>({ value, options, onChange, placeholder = "— Sélectionner —" }: {
  value: string;
  options: T[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputStyle} appearance-none cursor-pointer`}
    >
      <option value="" className="bg-slate-900">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
      ))}
    </select>
  );
}

// ─── Mention CNIL art. 13 — collapsible, par défaut visible ─────────────
function MentionCnil({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="relative bg-white/[0.04] border border-violet-500/20 rounded-2xl mb-6 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-violet-300" />
          <span className="text-sm font-bold text-violet-200 tracking-tight">
            Information sur le traitement de vos données personnelles
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>
      {open && (
        <div className="px-6 pb-6 text-[13px] text-white/70 leading-relaxed space-y-3 border-t border-white/[0.05] pt-4">
          <p>
            <strong className="text-white">Responsable de traitement</strong> — Le présent formulaire est mis en œuvre par votre conseiller, agence immobilière soumise aux obligations LCB-FT, en sa qualité de responsable de traitement.
          </p>
          <p>
            <strong className="text-white">Finalité</strong> — Vos données sont collectées pour satisfaire aux obligations légales de Lutte contre le Blanchiment et le Financement du Terrorisme (articles L.561-1 et suivants du Code monétaire et financier, décret n°2018-284, lignes directrices DGCCRF/TRACFIN).
          </p>
          <p>
            <strong className="text-white">Base légale</strong> — Obligation légale (RGPD art. 6.1.c).
          </p>
          <p>
            <strong className="text-white">Destinataires</strong> — Votre conseiller, le correspondant LCB-FT de l'agence et, en cas de soupçon, le service TRACFIN (déclaration prévue à l'art. L.561-15 CMF). Aucune cession commerciale n'est effectuée.
          </p>
          <p>
            <strong className="text-white">Hébergement</strong> — Vos données sont hébergées en France (Scaleway, Paris) et dans l'Union Européenne (Frankfurt). Aucun transfert hors UE n'est effectué pour vos pièces justificatives.
          </p>
          <p>
            <strong className="text-white">Sécurité</strong> — Toutes les pièces transmises sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Tous les accès sont journalisés à des fins d'audit.
          </p>
          <p>
            <strong className="text-white">Durée de conservation</strong> — 5 ans à compter de la fin de la relation d'affaires (art. L.561-12-1 CMF).
          </p>
          <p>
            <strong className="text-white">Vos droits</strong> — Vous disposez d'un droit d'accès, de rectification, d'opposition (limité par l'obligation légale), de limitation et de réclamation auprès de la CNIL ([cnil.fr](https://www.cnil.fr)). Pour exercer ces droits, contactez votre conseiller ou le correspondant LCB-FT.
          </p>
          <p className="text-[11px] text-white/40 pt-2">Mention version&nbsp;: {MENTION_CNIL_VERSION}</p>
        </div>
      )}
    </div>
  );
}

// ─── Composant : liste de Bénéficiaires Effectifs (PM uniquement) ───────
function BeneficiairesEffectifsEditor({ value, onChange }: {
  value: BeneficiaireEffectif[];
  onChange: (v: BeneficiaireEffectif[]) => void;
}) {
  const add = () => onChange([...value, { nom: "", pctDetention: "", typeControle: "" }]);
  const update = (i: number, patch: Partial<BeneficiaireEffectif>) =>
    onChange(value.map((be, idx) => (idx === i ? { ...be, ...patch } : be)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <div className="text-[12px] text-white/40 italic px-1">
          Aucun bénéficiaire effectif déclaré. Ajoutez au moins une personne détenant ≥ 25 % du capital ou exerçant un contrôle effectif (art. R.561-1 CMF).
        </div>
      )}

      {value.map((be, i) => (
        <div key={i} className="border border-white/10 rounded-xl p-4 bg-white/[0.02] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Bénéficiaire effectif #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-white/30 hover:text-red-400 transition"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <input
            placeholder="Nom et prénom"
            className={inputStyle}
            value={be.nom}
            onChange={(e) => update(i, { nom: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="% détenu"
              className={inputStyle}
              value={be.pctDetention}
              onChange={(e) => update(i, { pctDetention: e.target.value })}
            />
            <Selectt
              value={be.typeControle}
              options={TYPE_CONTROLE_BE_OPTIONS}
              onChange={(v) => update(i, { typeControle: v })}
              placeholder="Type de contrôle"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20"
      >
        <Plus className="w-3 h-3" />
        Ajouter un bénéficiaire effectif
      </button>
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────
export default function KycPublicForm({ token, dossierId }: Props) {
  const [form, setForm] = useState<KycForm>(initialKycForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cnilOpen, setCnilOpen] = useState(true);

  const set = useCallback(<K extends keyof KycForm>(k: K, v: KycForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  const isMorale = form.typeClient === "morale";

  const isValid = !!(
    form.emailContact.trim() &&
    form.nomPrenom.trim() &&
    form.adresse.trim() &&
    form.paysNationalite &&
    form.secteurActivite &&
    form.pieceIdentiteType && form.pieceIdentiteNumero.trim() && form.pieceIdentiteExpiration &&
    form.urlPieceIdentite && form.urlJustifDomicile &&
    form.ppe !== null && form.ppeProcheDetecte !== null &&
    form.paysResidenceFiscale &&
    form.typeBien && form.lieuBien.trim() && form.montantOperation.trim() &&
    form.origineFonds &&
    form.modeFinancement && form.modePaiement &&
    (isMorale
      ? form.urlKbis && form.siren.trim() && form.beneficiairesEffectifsJson.length > 0
      : true) &&
    form.consentementRgpd
  );

  const submit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/kyc/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'envoi");
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'envoi. Réessayez.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: "#07080F", color: "white", fontFamily: "Inter, sans-serif" }}>
        <AmbientOrbs />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
            <Check className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Merci !</h1>
          <p className="text-white/60 leading-relaxed">
            Vos informations ont bien été transmises à votre conseiller. Vous serez recontacté(e) prochainement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#07080F", color: "white", fontFamily: "Inter, sans-serif" }}>
      <AmbientOrbs />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Klaris</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Vérification d'identité (KYC)</h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            Votre conseiller vous demande de remplir ce formulaire dans le cadre des obligations légales LCB-FT
            (Lutte Contre le Blanchiment et le Financement du Terrorisme — art. L.561-1 et suivants du CMF).
          </p>
        </div>

        {/* Mention CNIL en haut, lisible avant tout */}
        <MentionCnil open={cnilOpen} onToggle={() => setCnilOpen(!cnilOpen)} />

        {/* Type de client */}
        <Sect title="Type de client">
          <div className="flex gap-2">
            {[
              { value: "physique", label: "Personne Physique" },
              { value: "morale", label: "Personne Morale" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set("typeClient", o.value as "physique" | "morale")}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
                  form.typeClient === o.value
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    : "bg-white/[0.03] border-white/10 text-white/40 hover:bg-white/[0.06]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Sect>

        {/* Contact */}
        <Sect title="Vos coordonnées">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" required>
              <input type="email" className={inputStyle} value={form.emailContact} onChange={(e) => set("emailContact", e.target.value)} placeholder="vous@email.fr" />
            </Field>
            <Field label="Téléphone">
              <input type="tel" className={inputStyle} value={form.telephone} onChange={(e) => set("telephone", e.target.value)} placeholder="06 XX XX XX XX" />
            </Field>
          </div>
        </Sect>

        {/* Identité */}
        <Sect title="Identité" sub={isMorale ? "Représentant légal" : "Vos informations"}>
          <Field label={isMorale ? "Dénomination sociale" : "Nom et prénom"} required>
            <input className={inputStyle} value={form.nomPrenom} onChange={(e) => set("nomPrenom", e.target.value)} />
          </Field>

          {!isMorale && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date de naissance" required>
                  <input type="date" className={inputStyle} value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} />
                </Field>
                <Field label="Lieu de naissance" required>
                  <input className={inputStyle} value={form.lieuNaissance} onChange={(e) => set("lieuNaissance", e.target.value)} placeholder="Ville, pays" />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nationalité" required>
                  <input className={inputStyle} value={form.nationalite} onChange={(e) => set("nationalite", e.target.value)} placeholder="Française" />
                </Field>
                <Field label="Pays d'origine (catégorie)" required hint="Catégorisation utilisée pour l'analyse réglementaire.">
                  <Selectt value={form.paysNationalite} options={PAYS_OPTIONS} onChange={(v) => set("paysNationalite", v)} />
                </Field>
              </div>
            </>
          )}

          {isMorale && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Forme juridique" required>
                  <Selectt value={form.formeJuridique} options={FORME_JURIDIQUE_OPTIONS} onChange={(v) => set("formeJuridique", v)} />
                </Field>
                <Field label="N° SIREN" required hint="9 chiffres sans espace">
                  <input className={inputStyle} value={form.siren} onChange={(e) => set("siren", e.target.value)} placeholder="123456789" />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date de constitution">
                  <input type="date" className={inputStyle} value={form.dateConstitution} onChange={(e) => set("dateConstitution", e.target.value)} />
                </Field>
                <Field label="Pays d'immatriculation (catégorie)" required>
                  <Selectt value={form.paysNationalite} options={PAYS_OPTIONS} onChange={(v) => set("paysNationalite", v)} />
                </Field>
              </div>
              <Field label="Activité principale">
                <input className={inputStyle} value={form.activitePrincipale} onChange={(e) => set("activitePrincipale", e.target.value)} placeholder="Ex: Holding immobilière" />
              </Field>
              <Field label="Nom du gérant / représentant légal">
                <input className={inputStyle} value={form.nomGerant} onChange={(e) => set("nomGerant", e.target.value)} />
              </Field>
            </>
          )}

          <Field label="Adresse complète" required>
            <input className={inputStyle} value={form.adresse} onChange={(e) => set("adresse", e.target.value)} placeholder="N°, rue, code postal, ville" />
          </Field>
        </Sect>

        {/* Pièce d'identité (Arrêté 6 jan. 2021) */}
        <Sect title="Pièce d'identité" sub={isMorale ? "Représentant légal" : "Personne physique"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Type de pièce" required>
              <Selectt value={form.pieceIdentiteType} options={PIECE_IDENTITE_TYPES} onChange={(v) => set("pieceIdentiteType", v)} />
            </Field>
            <Field label="Numéro" required>
              <input className={inputStyle} value={form.pieceIdentiteNumero} onChange={(e) => set("pieceIdentiteNumero", e.target.value)} placeholder="Numéro du document" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date d'expiration" required>
              <input type="date" className={inputStyle} value={form.pieceIdentiteExpiration} onChange={(e) => set("pieceIdentiteExpiration", e.target.value)} />
            </Field>
            <Field label="Autorité de délivrance" hint="Préfecture, mairie, ambassade…">
              <input className={inputStyle} value={form.pieceIdentiteAutorite} onChange={(e) => set("pieceIdentiteAutorite", e.target.value)} placeholder="Préfecture de Paris" />
            </Field>
          </div>
        </Sect>

        {/* Activité professionnelle */}
        {!isMorale && (
          <Sect title="Activité professionnelle">
            <Field label="Profession">
              <input className={inputStyle} value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="Ex: Ingénieur, médecin, retraité…" />
            </Field>
            <Field label="Secteur d'activité" required hint="Certains secteurs nécessitent une vigilance renforcée (lignes directrices DGCCRF).">
              <Selectt value={form.secteurActivite} options={SECTEUR_ACTIVITE_OPTIONS} onChange={(v) => set("secteurActivite", v)} />
            </Field>
          </Sect>
        )}
        {isMorale && (
          <Sect title="Secteur d'activité de la société">
            <Field label="Secteur d'activité" required>
              <Selectt value={form.secteurActivite} options={SECTEUR_ACTIVITE_OPTIONS} onChange={(v) => set("secteurActivite", v)} />
            </Field>
          </Sect>
        )}

        {/* Bénéficiaires effectifs (PM) */}
        {isMorale && (
          <Sect title="Bénéficiaires effectifs" sub="Art. R.561-1 CMF">
            <p className="text-[12px] text-white/55 leading-relaxed -mt-2">
              Toute personne physique détenant directement ou indirectement plus de 25 % du capital ou des
              droits de vote, ou exerçant par tout autre moyen un pouvoir de contrôle sur la société.
            </p>
            <BeneficiairesEffectifsEditor
              value={form.beneficiairesEffectifsJson}
              onChange={(v) => set("beneficiairesEffectifsJson", v)}
            />
          </Sect>
        )}

        {/* PPE & entourage */}
        <Sect title="Personne politiquement exposée (PPE)" sub="L.561-10 1° CMF">
          <Field label={isMorale ? "Le représentant légal exerce-t-il une fonction politique, juridictionnelle ou administrative importante ?" : "Exercez-vous une fonction politique, juridictionnelle ou administrative importante ?"} required>
            <YesNo value={form.ppe} onChange={(v) => set("ppe", v)} />
          </Field>
          {form.ppe && (
            <Field label="Précisions sur la fonction">
              <textarea className={`${inputStyle} min-h-[60px] resize-none`} value={form.ppePrecisions} onChange={(e) => set("ppePrecisions", e.target.value)} placeholder="Fonction, organisme, période…" />
            </Field>
          )}

          <Field
            label="Un proche (conjoint, parent, enfant, frère/sœur, beau-parent) exerce-t-il une telle fonction ?"
            required
            hint="L'entourage immédiat d'une PPE est également soumis à la vigilance renforcée (CMF L.561-10 1°)."
          >
            <YesNo value={form.ppeProcheDetecte} onChange={(v) => set("ppeProcheDetecte", v)} />
          </Field>
          {form.ppeProcheDetecte && (
            <Field label="Précisions (lien de parenté, nom, fonction)">
              <textarea className={`${inputStyle} min-h-[60px] resize-none`} value={form.ppeProchePrecisions} onChange={(e) => set("ppeProchePrecisions", e.target.value)} placeholder="Ex: père, Jean Dupont, ancien préfet de…" />
            </Field>
          )}
        </Sect>

        {/* Résidence fiscale */}
        <Sect title="Résidence fiscale">
          <Field label="Pays de résidence fiscale (catégorie)" required>
            <Selectt value={form.paysResidenceFiscale} options={PAYS_OPTIONS} onChange={(v) => set("paysResidenceFiscale", v)} />
          </Field>
        </Sect>

        {/* L'opération immobilière */}
        <Sect title="L'opération immobilière">
          <Field label="Type de bien" required>
            <Selectt value={form.typeBien} options={TYPE_BIEN_OPTIONS} onChange={(v) => set("typeBien", v)} />
          </Field>
          <Field label="Adresse complète du bien" required hint="L'analyse de la zone géographique (France / UE / autre) sera faite par votre conseiller.">
            <input className={inputStyle} value={form.lieuBien} onChange={(e) => set("lieuBien", e.target.value)} placeholder="N°, rue, code postal, ville, pays" />
          </Field>
          <Field label="Montant de l'opération (€)" required>
            <input
              type="number"
              min="0"
              className={inputStyle}
              value={form.montantOperation}
              onChange={(e) => set("montantOperation", e.target.value)}
              placeholder="Ex: 350000"
            />
          </Field>
        </Sect>

        {/* Origine des fonds */}
        <Sect title="Origine des fonds">
          <Field label="Source principale des fonds" required>
            <Selectt value={form.origineFonds} options={ORIGINE_FONDS_OPTIONS} onChange={(v) => set("origineFonds", v)} />
          </Field>

          {form.origineFonds === "vente" && (
            <Field label="Adresse du bien vendu" hint="Pour permettre la traçabilité de la transaction d'origine.">
              <input className={inputStyle} value={form.origineFondsVenteAdresse} onChange={(e) => set("origineFondsVenteAdresse", e.target.value)} placeholder="Adresse + ville" />
            </Field>
          )}
          {form.origineFonds === "donation" && (
            <Field label="Identité du donateur (nom + lien)">
              <input className={inputStyle} value={form.origineFondsDonateur} onChange={(e) => set("origineFondsDonateur", e.target.value)} placeholder="Ex: Jean Dupont (père)" />
            </Field>
          )}
          {form.origineFonds === "heritage" && (
            <Field label="Identité du défunt et lien de parenté">
              <input className={inputStyle} value={form.origineFondsLienDefunt} onChange={(e) => set("origineFondsLienDefunt", e.target.value)} placeholder="Ex: Marie Dupont (grand-mère)" />
            </Field>
          )}

          <Field label="Précisions complémentaires">
            <textarea className={`${inputStyle} min-h-[80px] resize-none`} value={form.origineFondsPrecisions} onChange={(e) => set("origineFondsPrecisions", e.target.value)} placeholder="Décrivez l'origine des fonds, dates, montants approximatifs…" />
          </Field>
        </Sect>

        {/* Mode de financement & paiement */}
        <Sect title="Financement & paiement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Mode de financement" required>
              <Selectt value={form.modeFinancement} options={MODE_FINANCEMENT_OPTIONS} onChange={(v) => set("modeFinancement", v)} />
            </Field>
            <Field label="Mode de paiement" required hint="Espèces > 1 000 € interdit (art. L.112-6 CMF).">
              <Selectt value={form.modePaiement} options={MODE_PAIEMENT_OPTIONS} onChange={(v) => set("modePaiement", v)} />
            </Field>
          </div>
        </Sect>

        {/* Pièces justificatives */}
        <Sect title="Pièces justificatives" sub="PDF, JPG, PNG — max 10 Mo · Hébergement Paris chiffré">
          {!isMorale && (
            <>
              <FileUpload label="Pièce d'identité (CNI / Passeport / Titre de séjour)" required value={form.urlPieceIdentite} onChange={(v) => set("urlPieceIdentite", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Justificatif de domicile (-3 mois)" required value={form.urlJustifDomicile} onChange={(v) => set("urlJustifDomicile", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Avis d'imposition (dernier reçu)" value={form.urlAvisImposition} onChange={(v) => set("urlAvisImposition", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Justificatifs de revenus (3 derniers bulletins)" value={form.urlJustifRevenus} onChange={(v) => set("urlJustifRevenus", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Justificatif d'origine des fonds" value={form.urlJustifOrigineFonds} onChange={(v) => set("urlJustifOrigineFonds", v)} dossierId={dossierId} kycToken={token} />
            </>
          )}

          {isMorale && (
            <>
              <FileUpload label="Extrait Kbis (-3 mois)" required value={form.urlKbis} onChange={(v) => set("urlKbis", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Statuts à jour" value={form.urlStatuts} onChange={(v) => set("urlStatuts", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="CNI du gérant / représentant légal" required value={form.urlCniGerant} onChange={(v) => set("urlCniGerant", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Justificatif de domicile du gérant" required value={form.urlJustifDomicile} onChange={(v) => set("urlJustifDomicile", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Pièce d'identité (CNI / Passeport gérant)" required value={form.urlPieceIdentite} onChange={(v) => set("urlPieceIdentite", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Derniers bilans / liasses fiscales" value={form.urlBilans} onChange={(v) => set("urlBilans", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Registre des bénéficiaires effectifs (RBE)" value={form.urlRbe} onChange={(v) => set("urlRbe", v)} dossierId={dossierId} kycToken={token} />
              <FileUpload label="Justificatif d'origine des fonds" value={form.urlJustifOrigineFonds} onChange={(v) => set("urlJustifOrigineFonds", v)} dossierId={dossierId} kycToken={token} />
            </>
          )}
        </Sect>

        {/* Consentement RGPD obligatoire */}
        <Sect title="Déclaration & consentement" sub="Obligatoire">
          <p className="text-[13px] text-white/65 leading-relaxed">
            Je certifie sur l'honneur l'exactitude des informations et pièces fournies, et m'engage à
            signaler à mon conseiller tout changement substantiel de ma situation pendant la durée de la
            relation d'affaires (art. L.561-5-1 CMF).
          </p>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition border border-white/[0.10]">
            <button
              type="button"
              onClick={() => set("consentementRgpd", !form.consentementRgpd)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                form.consentementRgpd ? "bg-emerald-500 border-emerald-500" : "border-white/30 hover:border-white/50"
              }`}
              aria-label="Consentement"
            >
              {form.consentementRgpd && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
            <span className="text-[13px] text-white/85 leading-relaxed">
              J'ai lu et compris les informations relatives au traitement de mes données personnelles
              (mention CNIL ci-dessus, version <span className="font-mono text-violet-300">{MENTION_CNIL_VERSION}</span>)
              et je consens à leur traitement aux fins décrites.
              <span className="text-red-400"> *</span>
            </span>
          </label>
        </Sect>

        {/* Submit */}
        <div className="flex flex-col items-center gap-4 mt-10">
          <button
            type="button"
            onClick={submit}
            disabled={!isValid || submitting}
            className="px-10 py-4 rounded-full text-white text-sm font-bold transition-transform hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            {submitting ? "Envoi sécurisé en cours..." : "Transmettre mon dossier"}
          </button>
          <p className="text-[11px] text-white/30 text-center max-w-md">
            Vos données sont chiffrées (TLS 1.3 + AES-256) et hébergées en France. Conservation 5 ans
            (obligation légale L.561-12-1 CMF).
          </p>
          {!isValid && (
            <p className="text-[11px] text-orange-300/80 text-center max-w-md">
              Champs obligatoires (*) manquants — y compris l'acceptation du traitement de vos données.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
