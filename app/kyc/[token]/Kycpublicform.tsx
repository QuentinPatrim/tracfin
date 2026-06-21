// app/kyc/[token]/Kycpublicform.tsx — KYC public refondu mobile-first (wizard)
//
// Wizard 6 étapes + récap final. Auto-save localStorage (hors uploads).
// Palette violet/magenta cohérente avec la landing.
// Mobile-first : tap targets 44px+, inputs 16px (anti-zoom iOS), sticky nav.

"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ShieldCheck, Check, ChevronDown, Plus, Trash2, Lock, FileText, Info,
} from "lucide-react";
import {
  initialKycForm,
  ORIGINE_FONDS_OPTIONS,
  MODE_FINANCEMENT_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
  TYPE_BIEN_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PAYS_OPTIONS,
  FORME_JURIDIQUE_OPTIONS,
  PIECE_IDENTITE_TYPES,
  TYPE_CONTROLE_BE_OPTIONS,
  MENTION_CNIL_VERSION,
  type KycForm,
  type BeneficiaireEffectif,
} from "@/lib/kyc";
import FileUpload from "@/components/kyc/Fileupload";
import { buildDemoKycForm } from "@/lib/demo-kyc";
import Stepper from "./Stepper";
import StepFooter from "./StepFooter";
import { useKycPersist } from "./useKycPersist";

type Partie = "vendeur" | "acquereur";

interface Props {
  token: string;
  dossierId: string;
  partie: Partie;
  /** Pré-remplissage INPI/Pappers activé (clé API présente côté serveur). */
  pappersEnabled?: boolean;
  /** Mode démonstration (tutoriel) : pré-rempli, aucun appel réseau, aucune
   *  sauvegarde, étape pilotée de l'extérieur. Le flux réel n'est PAS affecté. */
  demo?: boolean;
  /** En mode démo, l'étape affichée est pilotée par le parent (le film). */
  controlledStep?: number;
}

/* ─────────── Étapes du wizard ─────────── */
const STEPS = [
  { key: "vous",      label: "Vous" },
  { key: "identite",  label: "Identité" },
  { key: "piece",     label: "Pièce d'identité" },
  { key: "situation", label: "Situation" },
  { key: "operation", label: "Opération immobilière" },
  { key: "pieces",    label: "Pièces justificatives" },
  { key: "recap",     label: "Récapitulatif & envoi" },
] as const;

const TOTAL_STEPS = STEPS.length;

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES UI
   ═══════════════════════════════════════════════════════════════ */

const inputBase =
  "w-full bg-white/[0.04] border border-white/[0.12] rounded-xl px-4 py-3 text-white outline-none transition-all placeholder:text-white/30 focus:border-violet-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-violet-500/15";
// 16px sur mobile (évite le zoom iOS), 14px sur ≥sm
const inputStyle = `${inputBase} text-[16px] sm:text-[14px]`;

function Section({ title, description, icon: Icon, children }: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div
            className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.10))",
              border: "1px solid rgba(124,58,237,0.30)",
            }}
          >
            <Icon className="w-4 h-4 text-violet-200" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-white leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-[13px] text-white/55 leading-relaxed mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, children, error }: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-white/65 tracking-tight">
        {label} {required && <span className="text-pink-300">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11.5px] text-white/40 leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-[11.5px] text-pink-300">{error}</p>
      )}
    </div>
  );
}

function YesNo({ value, onChange }: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={() => onChange(false)}
        className="h-12 rounded-xl border text-[14px] font-semibold transition-all"
        style={{
          background: value === false
            ? "rgba(16,185,129,0.12)"
            : "rgba(255,255,255,0.03)",
          borderColor: value === false
            ? "rgba(16,185,129,0.40)"
            : "rgba(255,255,255,0.10)",
          color: value === false ? "#6ee7b7" : "rgba(255,255,255,0.55)",
        }}
      >
        Non
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className="h-12 rounded-xl border text-[14px] font-semibold transition-all"
        style={{
          background: value === true
            ? "rgba(251,146,60,0.12)"
            : "rgba(255,255,255,0.03)",
          borderColor: value === true
            ? "rgba(251,146,60,0.40)"
            : "rgba(255,255,255,0.10)",
          color: value === true ? "#fdba74" : "rgba(255,255,255,0.55)",
        }}
      >
        Oui
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputStyle} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" className="bg-slate-900">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */

export default function KycPublicForm({ token, dossierId, partie, pappersEnabled = false, demo = false, controlledStep }: Props) {
  const isVendeur = partie === "vendeur";
  const isAcquereur = partie === "acquereur";
  const [form, setForm] = useState<KycForm>(() => (demo ? buildDemoKycForm(partie) : initialKycForm));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cnilOpen, setCnilOpen] = useState(false);

  // En mode démo, l'étape visible est pilotée par le parent (le film tutoriel).
  const displayStep = demo && controlledStep != null ? controlledStep : step;

  // Auto-save localStorage (désactivé en mode démo).
  const { restoredAt, clear: clearPersist } = useKycPersist(
    token,
    form,
    setForm,
    step,
    setStep,
    demo,
  );

  const set = useCallback(<K extends keyof KycForm>(k: K, v: KycForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  const isMorale = form.typeClient === "morale";

  /* ─── Validation par étape ─── */
  const validation = useMemo(() => {
    switch (step) {
      case 0: // Vous
        return {
          ok: !!(form.typeClient && form.emailContact.trim() && /\S+@\S+\.\S+/.test(form.emailContact)),
          msg: !form.emailContact.trim()
            ? "Renseignez votre email."
            : !/\S+@\S+\.\S+/.test(form.emailContact)
            ? "Email invalide."
            : null,
        };
      case 1: // Identité
        if (isMorale) {
          return {
            ok: !!(form.nomPrenom.trim() && form.formeJuridique && form.siren.trim() && form.paysNationalite && form.adresse.trim()),
            msg: !form.nomPrenom.trim() ? "Dénomination sociale requise."
              : !form.formeJuridique ? "Forme juridique requise."
              : !form.siren.trim() ? "SIREN requis."
              : !form.paysNationalite ? "Pays d'immatriculation requis."
              : !form.adresse.trim() ? "Adresse du siège requise."
              : null,
          };
        }
        return {
          ok: !!(form.nomPrenom.trim() && form.dateNaissance && form.lieuNaissance.trim() && form.nationalite.trim() && form.paysNationalite && form.adresse.trim() && form.secteurActivite),
          msg: !form.nomPrenom.trim() ? "Nom et prénom requis."
            : !form.dateNaissance ? "Date de naissance requise."
            : !form.lieuNaissance.trim() ? "Lieu de naissance requis."
            : !form.nationalite.trim() ? "Nationalité requise."
            : !form.paysNationalite ? "Pays d'origine requis."
            : !form.adresse.trim() ? "Adresse requise."
            : !form.secteurActivite ? "Secteur d'activité requis."
            : null,
        };
      case 2: // Pièce d'identité (champs uniquement, l'upload est step 5)
        return {
          ok: !!(form.pieceIdentiteType && form.pieceIdentiteNumero.trim() && form.pieceIdentiteExpiration),
          msg: !form.pieceIdentiteType ? "Type de pièce requis."
            : !form.pieceIdentiteNumero.trim() ? "Numéro requis."
            : !form.pieceIdentiteExpiration ? "Date d'expiration requise."
            : null,
        };
      case 3: // Situation (PPE + résidence fiscale + BE si PM)
        if (isMorale && form.beneficiairesEffectifsJson.length === 0) {
          return { ok: false, msg: "Au moins un bénéficiaire effectif requis." };
        }
        return {
          ok: form.ppe !== null && form.ppeProcheDetecte !== null && !!form.paysResidenceFiscale,
          msg: form.ppe === null ? "Indiquez si vous êtes une PPE."
            : form.ppeProcheDetecte === null ? "Indiquez si un proche est PPE."
            : !form.paysResidenceFiscale ? "Pays de résidence fiscale requis."
            : null,
        };
      case 4: // Opération
        // Pour un vendeur, on n'exige pas origine/financement/paiement (il reçoit l'argent)
        if (isVendeur) {
          return {
            ok: !!(form.typeBien && form.lieuBien.trim() && form.montantOperation.trim()),
            msg: !form.typeBien ? "Type de bien requis."
              : !form.lieuBien.trim() ? "Adresse du bien requise."
              : !form.montantOperation.trim() ? "Prix de vente requis."
              : null,
          };
        }
        return {
          ok: !!(form.typeBien && form.lieuBien.trim() && form.montantOperation.trim() && form.origineFonds && form.modeFinancement && form.modePaiement),
          msg: !form.typeBien ? "Type de bien requis."
            : !form.lieuBien.trim() ? "Adresse du bien requise."
            : !form.montantOperation.trim() ? "Montant requis."
            : !form.origineFonds ? "Origine des fonds requise."
            : !form.modeFinancement ? "Mode de financement requis."
            : !form.modePaiement ? "Mode de paiement requis."
            : null,
        };
      case 5: // Pièces justificatives
        if (isMorale) {
          return {
            ok: !!(form.urlKbis && form.urlPieceIdentite && form.urlJustifDomicile && form.urlCniGerant),
            msg: !form.urlKbis ? "Extrait Kbis requis."
              : !form.urlPieceIdentite ? "Pièce d'identité requise."
              : !form.urlJustifDomicile ? "Justificatif de domicile du gérant requis."
              : !form.urlCniGerant ? "CNI du gérant requise."
              : null,
          };
        }
        return {
          ok: !!(form.urlPieceIdentite && form.urlJustifDomicile),
          msg: !form.urlPieceIdentite ? "Photo de la pièce d'identité requise."
            : !form.urlJustifDomicile ? "Justificatif de domicile requis."
            : null,
        };
      case 6: // Récap
        return {
          ok: form.consentementRgpd,
          msg: !form.consentementRgpd ? "Cochez l'acceptation du traitement de vos données pour transmettre." : null,
        };
      default:
        return { ok: true, msg: null };
    }
  }, [step, form, isMorale, isVendeur]);

  /* ─── Navigation ─── */
  const goNext = () => {
    if (!validation.ok) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goPrev = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const jumpTo = (i: number) => {
    if (i <= step) {
      setStep(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ─── Soumission ─── */
  const submit = async () => {
    if (!validation.ok) return;
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
      clearPersist();
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'envoi. Réessayez.");
      setSubmitting(false);
    }
  };

  /* ─── Page de succès ─── */
  if (submitted) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6"
        style={{ background: "#06070D", color: "white", fontFamily: "Inter, sans-serif" }}>
        <BackgroundHalos />
        <div className="relative z-10 text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(52,211,153,0.10))",
              border: "1px solid rgba(16,185,129,0.40)",
              boxShadow: "0 0 40px rgba(16,185,129,0.30)",
            }}
          >
            <Check className="w-10 h-10 text-emerald-300" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight mb-3">
            Merci, c'est envoyé.
          </h1>
          <p className="text-white/65 leading-relaxed mb-6">
            Vos informations sont arrivées à votre conseiller, chiffrées et hébergées en France.
            Vous serez recontacté(e) prochainement.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.10] text-[11px] uppercase tracking-widest text-white/55">
            <Lock className="w-3 h-3" />
            Données conservées 5 ans (L.561-12-1 CMF)
          </div>
        </div>
      </div>
    );
  }

  /* ─── Wizard ─── */
  return (
    <div
      className="min-h-screen relative pb-4"
      style={{ background: "#06070D", color: "white", fontFamily: "Inter, sans-serif" }}
    >
      <BackgroundHalos />

      <Stepper steps={STEPS as unknown as Array<{ key: string; label: string }>} current={displayStep} onJumpBack={demo ? () => {} : jumpTo} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Bandeau "saisie restaurée" */}
        {restoredAt && displayStep === 0 && (
          <div
            className="mb-5 rounded-xl p-3 flex items-center gap-2.5 border"
            style={{
              background: "rgba(16,185,129,0.06)",
              borderColor: "rgba(16,185,129,0.30)",
            }}
          >
            <Info className="w-4 h-4 text-emerald-300 shrink-0" />
            <div className="text-[12.5px] text-white/85">
              <span className="font-semibold text-emerald-300">Saisie restaurée.</span>{" "}
              Vous reprenez où vous vous étiez arrêté{new Date(restoredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) ? ` (sauvegardé le ${new Date(restoredAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })})` : ""}.
            </div>
          </div>
        )}

        {/* ÉTAPES */}
        {displayStep === 0 && <Step0_Vous form={form} set={set} cnilOpen={cnilOpen} setCnilOpen={setCnilOpen} isVendeur={isVendeur} />}
        {displayStep === 1 && <Step1_Identite form={form} set={set} isMorale={isMorale} token={token} pappersEnabled={pappersEnabled} />}
        {displayStep === 2 && <Step2_Piece form={form} set={set} isMorale={isMorale} />}
        {displayStep === 3 && <Step3_Situation form={form} set={set} isMorale={isMorale} />}
        {displayStep === 4 && <Step4_Operation form={form} set={set} isVendeur={isVendeur} />}
        {displayStep === 5 && <Step5_Pieces form={form} set={set} dossierId={dossierId} token={token} isMorale={isMorale} />}
        {displayStep === 6 && <Step6_Recap form={form} set={set} jumpTo={jumpTo} isVendeur={isVendeur} />}
      </div>

      {/* Barre de navigation — masquée en mode démo (le film pilote les étapes) */}
      {!demo && (
        <StepFooter
          isFirst={step === 0}
          isLast={step === TOTAL_STEPS - 1}
          canProceed={validation.ok}
          submitting={submitting}
          validationMessage={validation.msg}
          onPrev={goPrev}
          onNext={goNext}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ÉTAPES DU WIZARD
   ═══════════════════════════════════════════════════════════════ */

type Setter = <K extends keyof KycForm>(k: K, v: KycForm[K]) => void;

/* ─── ÉTAPE 0 : Type de client + contact ─── */
function Step0_Vous({ form, set, cnilOpen, setCnilOpen, isVendeur }: {
  form: KycForm; set: Setter; cnilOpen: boolean; setCnilOpen: (b: boolean) => void; isVendeur: boolean;
}) {
  return (
    <>
      {/* Badge rôle visible dès l'ouverture */}
      <div className="mb-5 flex justify-center">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] uppercase tracking-widest font-bold"
          style={{
            background: isVendeur ? "rgba(124,58,237,0.10)" : "rgba(236,72,153,0.10)",
            border: `1px solid ${isVendeur ? "rgba(124,58,237,0.30)" : "rgba(236,72,153,0.30)"}`,
            color: isVendeur ? "#c4b5fd" : "#f9a8d4",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isVendeur ? "#7c3aed" : "#ec4899" }} />
          Vous êtes le {isVendeur ? "vendeur" : "acquéreur"} du bien
        </span>
      </div>

      <Section
        title="Commençons par vous"
        description={
          isVendeur
            ? "Votre conseiller doit identifier formellement chaque partie de la transaction, y compris le vendeur (CMF L.561-5). Cela prend environ 5 minutes."
            : "Votre conseiller doit identifier formellement le client de la transaction (CMF L.561-5). Cela prend environ 5 minutes."
        }
        icon={ShieldCheck}
      >
        <Field label="Vous êtes" required>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { value: "physique", label: "Particulier" },
              { value: "morale", label: "Société" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set("typeClient", o.value as "physique" | "morale")}
                className="h-12 rounded-xl border text-[14px] font-semibold transition-all"
                style={{
                  background: form.typeClient === o.value
                    ? "linear-gradient(180deg, rgba(124,58,237,0.18), rgba(236,72,153,0.08))"
                    : "rgba(255,255,255,0.03)",
                  borderColor: form.typeClient === o.value
                    ? "rgba(124,58,237,0.40)"
                    : "rgba(255,255,255,0.10)",
                  color: form.typeClient === o.value ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Email" required hint="Pour que votre conseiller puisse vous recontacter.">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputStyle}
            value={form.emailContact}
            onChange={(e) => set("emailContact", e.target.value)}
            placeholder="vous@email.fr"
          />
        </Field>

        <Field label="Téléphone">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputStyle}
            value={form.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            placeholder="06 XX XX XX XX"
          />
        </Field>
      </Section>

      {/* Mention CNIL collapsible */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "rgba(124,58,237,0.22)", background: "rgba(124,58,237,0.04)" }}
      >
        <button
          type="button"
          onClick={() => setCnilOpen(!cnilOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-violet-300" />
            <span className="text-[13px] font-semibold text-violet-100">
              Traitement de vos données — RGPD
            </span>
          </div>
          <ChevronDown
            className="w-4 h-4 text-white/55 transition-transform"
            style={{ transform: cnilOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {cnilOpen && (
          <div className="px-4 pb-4 text-[12.5px] text-white/65 leading-relaxed space-y-2.5 border-t border-white/[0.05] pt-3">
            <p><strong className="text-white">Finalité</strong> — Obligations LCB-FT (CMF L.561-1 et suiv.).</p>
            <p><strong className="text-white">Hébergement</strong> — France (Paris) et UE (Frankfurt). Aucun transfert hors UE.</p>
            <p><strong className="text-white">Sécurité</strong> — Chiffrement TLS 1.3 + AES-256, accès journalisés.</p>
            <p><strong className="text-white">Conservation</strong> — 5 ans à compter de la fin de la relation (art. L.561-12-1 CMF).</p>
            <p><strong className="text-white">Vos droits</strong> — Accès, rectification, opposition (limité par l'obligation légale), réclamation CNIL.</p>
            <p className="text-[11px] text-white/40 pt-1">Version : {MENTION_CNIL_VERSION}</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── ÉTAPE 1 : Identité ─── */
function Step1_Identite({ form, set, isMorale, token, pappersEnabled }: { form: KycForm; set: Setter; isMorale: boolean; token: string; pappersEnabled: boolean }) {
  return (
    <Section
      title={isMorale ? "La société" : "Votre identité"}
      description={isMorale ? "Coordonnées et immatriculation." : "Identification réglementaire."}
    >
      <Field label={isMorale ? "Dénomination sociale" : "Nom et prénom"} required>
        <input
          className={inputStyle}
          value={form.nomPrenom}
          onChange={(e) => set("nomPrenom", e.target.value)}
          autoComplete={isMorale ? "organization" : "name"}
          placeholder={isMorale ? "ACME SAS" : "Prénom NOM"}
        />
      </Field>

      {!isMorale && (
        <>
          <Field label="Date de naissance" required>
            <input
              type="date"
              className={inputStyle}
              value={form.dateNaissance}
              onChange={(e) => set("dateNaissance", e.target.value)}
            />
          </Field>
          <Field label="Lieu de naissance" required>
            <input
              className={inputStyle}
              value={form.lieuNaissance}
              onChange={(e) => set("lieuNaissance", e.target.value)}
              placeholder="Ville, pays"
            />
          </Field>
          <Field label="Nationalité" required>
            <input
              className={inputStyle}
              value={form.nationalite}
              onChange={(e) => set("nationalite", e.target.value)}
              placeholder="Française"
            />
          </Field>
          <Field label="Pays d'origine (catégorie)" required hint="Catégorisation utilisée pour l'analyse réglementaire.">
            <Selectt value={form.paysNationalite} options={PAYS_OPTIONS} onChange={(v) => set("paysNationalite", v)} />
          </Field>
          <Field label="Profession">
            <input
              className={inputStyle}
              value={form.profession}
              onChange={(e) => set("profession", e.target.value)}
              placeholder="Ingénieur, médecin, retraité…"
            />
          </Field>
          <Field label="Secteur d'activité" required>
            <Selectt value={form.secteurActivite} options={SECTEUR_ACTIVITE_OPTIONS} onChange={(v) => set("secteurActivite", v)} />
          </Field>
        </>
      )}

      {isMorale && (
        <>
          <Field label="Forme juridique" required>
            <Selectt value={form.formeJuridique} options={FORME_JURIDIQUE_OPTIONS} onChange={(v) => set("formeJuridique", v)} />
          </Field>
          <Field label="N° SIREN" required hint="9 chiffres sans espace · le bouton ci-dessous récupère automatiquement les informations depuis l'INPI">
            <input
              inputMode="numeric"
              className={inputStyle}
              value={form.siren}
              onChange={(e) => set("siren", e.target.value.replace(/\s/g, ""))}
              placeholder="123456789"
              maxLength={9}
            />
          </Field>

          {pappersEnabled && <PappersLookupButton form={form} set={set} token={token} />}

          <Field label="Date de constitution">
            <input
              type="date"
              className={inputStyle}
              value={form.dateConstitution}
              onChange={(e) => set("dateConstitution", e.target.value)}
            />
          </Field>
          <Field label="Pays d'immatriculation (catégorie)" required>
            <Selectt value={form.paysNationalite} options={PAYS_OPTIONS} onChange={(v) => set("paysNationalite", v)} />
          </Field>
          <Field label="Activité principale">
            <input
              className={inputStyle}
              value={form.activitePrincipale}
              onChange={(e) => set("activitePrincipale", e.target.value)}
              placeholder="Ex : Holding immobilière"
            />
          </Field>
          <Field label="Nom du gérant / représentant légal">
            <input
              className={inputStyle}
              value={form.nomGerant}
              onChange={(e) => set("nomGerant", e.target.value)}
            />
          </Field>
          <Field label="Secteur d'activité de la société" required>
            <Selectt value={form.secteurActivite} options={SECTEUR_ACTIVITE_OPTIONS} onChange={(v) => set("secteurActivite", v)} />
          </Field>
        </>
      )}

      <Field label={isMorale ? "Adresse du siège" : "Adresse complète"} required>
        <input
          className={inputStyle}
          value={form.adresse}
          onChange={(e) => set("adresse", e.target.value)}
          autoComplete="street-address"
          placeholder="N°, rue, code postal, ville"
        />
      </Field>
    </Section>
  );
}

/* ─── Bouton lookup INPI/Pappers — pré-remplit l'identité morale ─────────── */

// Validation SIREN locale (Luhn) — pure JS, pas d'import lib/pappers (qui
// embarquerait la logique fetch côté client + leak potentiel env var).
function isSirenValid(s: string): boolean {
  const d = s.replace(/\s/g, "");
  if (!/^\d{9}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(d[i], 10);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

// Normalise les formes juridiques INPI vers les options du select Klaris.
function mapFormeJuridique(label: string): string {
  const l = label.toLowerCase();
  if (/sas\b|société par actions simplifiée/.test(l) && !/sasu/.test(l)) return "SAS";
  if (/sasu/.test(l)) return "SASU";
  if (/sarl|société à responsabilité limitée/.test(l) && !/eurl/.test(l)) return "SARL";
  if (/eurl/.test(l)) return "EURL";
  if (/société civile immobilière|\bsci\b/.test(l)) return "SCI";
  if (/société anonyme|\bsa\b/.test(l)) return "SA";
  if (/snc|société en nom collectif/.test(l)) return "SNC";
  return "autre";
}

interface PappersNormalized {
  siren: string;
  denomination: string;
  formeJuridique: string;
  dateConstitution: string | null;
  adresseSiege: string;
  activitePrincipale: string;
  capital: number | null;
  dirigeantPrincipal: {
    nom: string;
    prenom: string;
    nomComplet: string;
    qualite: string;
    dateNaissance: string | null;
    nationalite: string | null;
  } | null;
  beneficiairesEffectifs: Array<{
    nom: string;
    prenom: string;
    nomComplet: string;
    dateNaissance: string | null;
    nationalite: string | null;
    pourcentageParts: number | null;
    pourcentageVotes: number | null;
  }>;
  statutActif: boolean;
}

function PappersLookupButton({ form, set, token }: { form: KycForm; set: Setter; token: string }) {
  const sirenOk = isSirenValid(form.siren);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const run = async () => {
    if (!sirenOk) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(
        `/api/pappers/lookup?siren=${encodeURIComponent(form.siren)}&kycToken=${encodeURIComponent(token)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const company = data.company as PappersNormalized;

      // ─ Pré-remplissage du formulaire ─
      if (company.denomination) set("nomPrenom", company.denomination);
      if (company.formeJuridique) set("formeJuridique", mapFormeJuridique(company.formeJuridique));
      if (company.dateConstitution) set("dateConstitution", company.dateConstitution);
      if (company.activitePrincipale) set("activitePrincipale", company.activitePrincipale);
      if (company.adresseSiege) set("adresse", company.adresseSiege);
      if (company.dirigeantPrincipal?.nomComplet) {
        set("nomGerant", company.dirigeantPrincipal.nomComplet);
      }

      // BE structurés : on remplit beneficiairesEffectifsJson si Pappers en a
      if (company.beneficiairesEffectifs.length > 0) {
        const beList: BeneficiaireEffectif[] = company.beneficiairesEffectifs.map((b) => {
          // Détermine le type de contrôle dominant : si votes > parts c'est "vote"
          // sinon "capital" (le critère AML retient le plus fort des deux).
          const parts = b.pourcentageParts ?? 0;
          const votes = b.pourcentageVotes ?? 0;
          const typeControle = votes > parts ? "vote" : "capital";
          const pct = Math.max(parts, votes);
          return {
            nom: b.nomComplet || [b.prenom, b.nom].filter(Boolean).join(" "),
            // pctDetention attendu en string (saisie progressive UI). On formatte.
            pctDetention: pct > 0 ? pct.toString() : "",
            typeControle,
          };
        });
        set("beneficiairesEffectifsJson", beList);
      }

      // Stocke le snapshot brut pour transmission au POST (preuve d'audit)
      set("pappersSnapshot", data.snapshot);

      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4 mb-1"
      style={{
        background: "linear-gradient(180deg, rgba(168,85,247,0.06), rgba(99,102,241,0.03) 60%, transparent)",
        border: "1px solid rgba(168,85,247,0.22)",
      }}
    >
      <button
        type="button"
        onClick={run}
        disabled={!sirenOk || loading}
        className="flex items-center justify-center gap-2.5 rounded-lg px-4 py-3 transition-all w-full"
        style={{
          background: sirenOk && !loading
            ? "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)"
            : "rgba(255,255,255,0.04)",
          border: sirenOk ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
          cursor: sirenOk && !loading ? "pointer" : "not-allowed",
          opacity: sirenOk && !loading ? 1 : 0.5,
          boxShadow: sirenOk && !loading
            ? "0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 16px rgba(168,85,247,0.25)"
            : "none",
          color: "white",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Récupération en cours…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {success ? "Re-récupérer depuis l'INPI" : sirenOk ? "Récupérer automatiquement depuis l'INPI" : "Saisissez un SIREN valide pour activer"}
          </>
        )}
      </button>

      {error && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-[12.5px]"
          style={{
            background: "rgba(220,38,38,0.10)",
            border: "1px solid rgba(220,38,38,0.30)",
            color: "#fca5a5",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-[12.5px] flex items-start gap-2"
          style={{
            background: "rgba(16,185,129,0.10)",
            border: "1px solid rgba(16,185,129,0.30)",
            color: "#6ee7b7",
          }}
        >
          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <strong>Données INPI récupérées.</strong> Dénomination, forme juridique, date de constitution,
            adresse, dirigeant et bénéficiaires effectifs pré-remplis. Vérifiez les informations puis
            poursuivez — vous pouvez modifier librement si besoin.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ÉTAPE 2 : Pièce d'identité (champs) ─── */
function Step2_Piece({ form, set, isMorale }: { form: KycForm; set: Setter; isMorale: boolean }) {
  return (
    <Section
      title="Pièce d'identité"
      description={isMorale ? "Pièce du représentant légal (Arrêté 6 janv. 2021)." : "Informations de votre pièce officielle (Arrêté 6 janv. 2021)."}
      icon={FileText}
    >
      <Field label="Type de pièce" required>
        <Selectt value={form.pieceIdentiteType} options={PIECE_IDENTITE_TYPES} onChange={(v) => set("pieceIdentiteType", v)} />
      </Field>
      <Field label="Numéro" required>
        <input
          className={inputStyle}
          value={form.pieceIdentiteNumero}
          onChange={(e) => set("pieceIdentiteNumero", e.target.value.toUpperCase())}
          placeholder="Numéro du document"
        />
      </Field>
      <Field label="Date d'expiration" required>
        <input
          type="date"
          className={inputStyle}
          value={form.pieceIdentiteExpiration}
          onChange={(e) => set("pieceIdentiteExpiration", e.target.value)}
        />
      </Field>
      <Field label="Autorité de délivrance" hint="Préfecture, mairie, ambassade…">
        <input
          className={inputStyle}
          value={form.pieceIdentiteAutorite}
          onChange={(e) => set("pieceIdentiteAutorite", e.target.value)}
          placeholder="Préfecture de Paris"
        />
      </Field>

      <div
        className="rounded-xl px-3 py-2.5 text-[12px] text-white/55 border"
        style={{ background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.20)" }}
      >
        <span className="text-violet-200 font-semibold">📷 Photo à l'étape suivante</span> — la photo de votre pièce sera demandée plus loin, avec un accès direct à votre appareil photo.
      </div>
    </Section>
  );
}

/* ─── ÉTAPE 3 : Situation (PPE + résidence fiscale + BE) ─── */
function Step3_Situation({ form, set, isMorale }: { form: KycForm; set: Setter; isMorale: boolean }) {
  return (
    <>
      {isMorale && (
        <Section
          title="Bénéficiaires effectifs"
          description="Toute personne détenant > 25 % du capital ou un pouvoir de contrôle (art. R.561-1 CMF)."
        >
          <BeneficiairesEffectifsEditor
            value={form.beneficiairesEffectifsJson}
            onChange={(v) => set("beneficiairesEffectifsJson", v)}
          />
        </Section>
      )}

      <Section
        title="Personne politiquement exposée"
        description="Cadre légal — L.561-10 1° CMF. Toutes les réponses restent confidentielles."
      >
        <Field
          label={isMorale
            ? "Le représentant légal exerce-t-il une fonction politique, juridictionnelle ou administrative importante ?"
            : "Exercez-vous une fonction politique, juridictionnelle ou administrative importante ?"}
          required
        >
          <YesNo value={form.ppe} onChange={(v) => set("ppe", v)} />
        </Field>
        {form.ppe && (
          <Field label="Précisions sur la fonction">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.ppePrecisions}
              onChange={(e) => set("ppePrecisions", e.target.value)}
              placeholder="Fonction, organisme, période…"
            />
          </Field>
        )}

        <Field
          label="Un proche (conjoint, parent, enfant, frère/sœur, beau-parent) exerce-t-il une telle fonction ?"
          required
          hint="L'entourage immédiat d'une PPE est aussi soumis à vigilance renforcée."
        >
          <YesNo value={form.ppeProcheDetecte} onChange={(v) => set("ppeProcheDetecte", v)} />
        </Field>
        {form.ppeProcheDetecte && (
          <Field label="Précisions (lien, nom, fonction)">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.ppeProchePrecisions}
              onChange={(e) => set("ppeProchePrecisions", e.target.value)}
              placeholder="Ex : père, Jean Dupont, ancien préfet de…"
            />
          </Field>
        )}
      </Section>

      <Section title="Résidence fiscale">
        <Field label="Pays de résidence fiscale (catégorie)" required>
          <Selectt
            value={form.paysResidenceFiscale}
            options={PAYS_OPTIONS}
            onChange={(v) => set("paysResidenceFiscale", v)}
          />
        </Field>
      </Section>
    </>
  );
}

/* ─── Éditeur Bénéficiaires Effectifs ─── */
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
        <div className="text-[12.5px] text-white/45 italic">
          Aucun bénéficiaire effectif déclaré. Ajoutez-en au moins un.
        </div>
      )}

      {value.map((be, i) => (
        <div
          key={i}
          className="rounded-xl p-3.5 border flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
              Bénéficiaire #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-8 h-8 rounded-lg hover:bg-red-500/15 hover:text-red-300 text-white/40 grid place-items-center transition"
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
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              max="100"
              inputMode="numeric"
              placeholder="% détenu"
              className={inputStyle}
              value={be.pctDetention}
              onChange={(e) => update(i, { pctDetention: e.target.value })}
            />
            <Selectt
              value={be.typeControle}
              options={TYPE_CONTROLE_BE_OPTIONS}
              onChange={(v) => update(i, { typeControle: v })}
              placeholder="Contrôle"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-200 px-3 py-2 rounded-lg border transition"
        style={{ background: "rgba(124,58,237,0.10)", borderColor: "rgba(124,58,237,0.30)" }}
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter un bénéficiaire effectif
      </button>
    </div>
  );
}

/* ─── ÉTAPE 4 : Opération ─── */
function Step4_Operation({ form, set, isVendeur }: { form: KycForm; set: Setter; isVendeur: boolean }) {
  return (
    <Section
      title={isVendeur ? "Le bien que vous vendez" : "L'opération immobilière"}
      description={
        isVendeur
          ? "Informations sur le bien que vous cédez. Le financement de l'acquéreur ne vous concerne pas."
          : "Le bien concerné et le financement envisagé."
      }
    >
      <Field label="Type de bien" required>
        <Selectt value={form.typeBien} options={TYPE_BIEN_OPTIONS} onChange={(v) => set("typeBien", v)} />
      </Field>
      <Field label="Adresse du bien" required>
        <input
          className={inputStyle}
          value={form.lieuBien}
          onChange={(e) => set("lieuBien", e.target.value)}
          placeholder="N°, rue, code postal, ville, pays"
        />
      </Field>
      <Field label={isVendeur ? "Prix de vente (€)" : "Montant de l'opération (€)"} required>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className={inputStyle}
          value={form.montantOperation}
          onChange={(e) => set("montantOperation", e.target.value)}
          placeholder="Ex : 350000"
        />
      </Field>

      {/* Champs propres à l'ACQUÉREUR uniquement */}
      {!isVendeur && (
        <>
          <Field label="Mode de financement" required>
            <Selectt value={form.modeFinancement} options={MODE_FINANCEMENT_OPTIONS} onChange={(v) => set("modeFinancement", v)} />
          </Field>
          <Field label="Mode de paiement" required hint="Espèces > 1 000 € interdit (art. L.112-6 CMF).">
            <Selectt value={form.modePaiement} options={MODE_PAIEMENT_OPTIONS} onChange={(v) => set("modePaiement", v)} />
          </Field>

          <Field label="Source principale des fonds" required>
            <Selectt value={form.origineFonds} options={ORIGINE_FONDS_OPTIONS} onChange={(v) => set("origineFonds", v)} />
          </Field>
          {form.origineFonds === "vente" && (
            <Field label="Adresse du bien vendu">
              <input
                className={inputStyle}
                value={form.origineFondsVenteAdresse}
                onChange={(e) => set("origineFondsVenteAdresse", e.target.value)}
                placeholder="Adresse + ville"
              />
            </Field>
          )}
          {form.origineFonds === "donation" && (
            <Field label="Identité du donateur">
              <input
                className={inputStyle}
                value={form.origineFondsDonateur}
                onChange={(e) => set("origineFondsDonateur", e.target.value)}
                placeholder="Ex : Jean Dupont (père)"
              />
            </Field>
          )}
          {form.origineFonds === "heritage" && (
            <Field label="Identité du défunt et lien de parenté">
              <input
                className={inputStyle}
                value={form.origineFondsLienDefunt}
                onChange={(e) => set("origineFondsLienDefunt", e.target.value)}
                placeholder="Ex : Marie Dupont (grand-mère)"
              />
            </Field>
          )}
          <Field label="Précisions complémentaires">
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.origineFondsPrecisions}
              onChange={(e) => set("origineFondsPrecisions", e.target.value)}
              placeholder="Décrivez l'origine des fonds, dates, montants…"
            />
          </Field>
        </>
      )}

      {/* Champs propres au VENDEUR : origine du bien vendu */}
      {isVendeur && (
        <>
          <Field
            label="Comment avez-vous acquis ce bien ?"
            hint="Mode d'acquisition antérieur : achat, héritage, donation, construction, etc."
          >
            <textarea
              className={`${inputStyle} min-h-[80px] resize-none`}
              value={form.origineFondsPrecisions}
              onChange={(e) => set("origineFondsPrecisions", e.target.value)}
              placeholder="Ex : Acheté en 2015 via un prêt bancaire ; héritage de mes parents en 2018 ; construit en 2010…"
            />
          </Field>
          <div
            className="rounded-xl px-3 py-2.5 text-[12px] border"
            style={{
              background: "rgba(124,58,237,0.05)",
              borderColor: "rgba(124,58,237,0.20)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <span className="text-violet-200 font-semibold">ℹ️ Bon à savoir</span> — En tant que vendeur, vous n&apos;avez pas à renseigner le mode de paiement ou de financement de l&apos;acquéreur. C&apos;est lui qui s&apos;en occupe de son côté.
          </div>
        </>
      )}
    </Section>
  );
}

/* ─── ÉTAPE 5 : Pièces justificatives ─── */
function Step5_Pieces({ form, set, dossierId, token, isMorale }: {
  form: KycForm;
  set: Setter;
  dossierId: string;
  token: string;
  isMorale: boolean;
}) {
  return (
    <Section
      title="Pièces justificatives"
      description="📷 Vous pouvez prendre une photo directement, c'est chiffré et hébergé en France."
    >
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
    </Section>
  );
}

/* ─── ÉTAPE 6 : Récap + consentement ─── */
function Step6_Recap({ form, set, jumpTo, isVendeur }: { form: KycForm; set: Setter; jumpTo: (i: number) => void; isVendeur: boolean }) {
  // Helper : valeur brute → label humain (ex: "green_fr" → "France")
  const lbl = <T extends { value: string; label: string }>(
    options: readonly T[],
    value: string,
  ): string => (value ? options.find((o) => o.value === value)?.label ?? value : "");

  return (
    <Section
      title="Récapitulatif"
      description="Vérifiez que tout est correct avant l'envoi."
    >
      <RecapBlock
        label="Identité"
        items={[
          { k: "Type", v: form.typeClient === "morale" ? "Société" : "Particulier" },
          { k: "Email", v: form.emailContact },
          { k: "Nom", v: form.nomPrenom },
          { k: "Adresse", v: form.adresse },
        ]}
        onEdit={() => jumpTo(1)}
      />
      <RecapBlock
        label="Pièce d'identité"
        items={[
          { k: "Type", v: lbl(PIECE_IDENTITE_TYPES, form.pieceIdentiteType) },
          { k: "Numéro", v: form.pieceIdentiteNumero },
          { k: "Expiration", v: form.pieceIdentiteExpiration },
        ]}
        onEdit={() => jumpTo(2)}
      />
      <RecapBlock
        label="Situation"
        items={[
          { k: "PPE", v: form.ppe ? "Oui" : "Non" },
          { k: "Proche PPE", v: form.ppeProcheDetecte ? "Oui" : "Non" },
          { k: "Résidence fiscale", v: lbl(PAYS_OPTIONS, form.paysResidenceFiscale) },
        ]}
        onEdit={() => jumpTo(3)}
      />
      <RecapBlock
        label={isVendeur ? "Le bien vendu" : "Opération"}
        items={
          isVendeur
            ? [
                { k: "Type de bien", v: lbl(TYPE_BIEN_OPTIONS, form.typeBien) },
                { k: "Adresse", v: form.lieuBien },
                { k: "Prix de vente", v: form.montantOperation ? `${Number(form.montantOperation).toLocaleString("fr-FR")} €` : "" },
                { k: "Origine du bien", v: lbl(ORIGINE_FONDS_OPTIONS, form.origineFonds) },
              ]
            : [
                { k: "Type de bien", v: lbl(TYPE_BIEN_OPTIONS, form.typeBien) },
                { k: "Adresse", v: form.lieuBien },
                { k: "Montant", v: form.montantOperation ? `${Number(form.montantOperation).toLocaleString("fr-FR")} €` : "" },
                { k: "Origine des fonds", v: lbl(ORIGINE_FONDS_OPTIONS, form.origineFonds) },
                { k: "Mode de financement", v: lbl(MODE_FINANCEMENT_OPTIONS, form.modeFinancement) },
                { k: "Mode de paiement", v: lbl(MODE_PAIEMENT_OPTIONS, form.modePaiement) },
              ]
        }
        onEdit={() => jumpTo(4)}
      />

      {/* Consentement RGPD */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.30)" }}
      >
        <p className="text-[13px] text-white/80 leading-relaxed mb-3">
          Je certifie sur l'honneur l'exactitude des informations et pièces fournies, et m'engage à
          signaler à mon conseiller tout changement substantiel de ma situation (art. L.561-5-1 CMF).
        </p>
        <button
          type="button"
          onClick={() => set("consentementRgpd", !form.consentementRgpd)}
          className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition"
          style={{
            background: form.consentementRgpd ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
            borderColor: form.consentementRgpd ? "rgba(16,185,129,0.40)" : "rgba(255,255,255,0.10)",
          }}
        >
          <span
            className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
            style={{
              background: form.consentementRgpd ? "#10b981" : "transparent",
              borderColor: form.consentementRgpd ? "#10b981" : "rgba(255,255,255,0.30)",
            }}
          >
            {form.consentementRgpd && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
          <span className="text-[12.5px] text-white/85 leading-relaxed flex-1">
            J'ai lu et compris les informations relatives au traitement de mes données personnelles
            (mention RGPD à l'étape 1, version <span className="font-mono text-violet-200">{MENTION_CNIL_VERSION}</span>)
            et je consens à leur traitement aux fins décrites.{" "}
            <span className="text-pink-300">*</span>
          </span>
        </button>
      </div>
    </Section>
  );
}

function RecapBlock({ label, items, onEdit }: {
  label: string;
  items: { k: string; v: string }[];
  onEdit: () => void;
}) {
  return (
    <div
      className="rounded-xl p-3.5 border"
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-widest text-white/55 font-semibold">{label}</div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] font-semibold text-violet-200 hover:text-violet-100 transition"
        >
          Modifier
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-1.5">
        {items.map((it) => (
          <div key={it.k} className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] text-white/50 shrink-0">{it.k}</dt>
            <dd className="text-[12.5px] text-white/85 text-right truncate">{it.v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ─── Halos d'arrière-plan (cohérent avec landing) ─── */
function BackgroundHalos() {
  return (
    <>
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 500, height: 500, top: -200, left: -100,
          background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 400, height: 400, bottom: -150, right: -100,
          background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </>
  );
}
