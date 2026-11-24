// components/tracfin/TracfinForm.tsx — Formulaire 3 étapes (création + édition + export PDF)

"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileDown } from "lucide-react";
import { computeScore, initialForm, type DossierForm } from "@/lib/tracfin";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

interface Props {
  initialData?: Partial<DossierForm>;
  dossierId?: string;
  /** Conservé pour compatibilité : le badge « fiche reçue » est dans l'en-tête de la fiche. */
  hasKyc?: boolean;
  /** Criblage sanctions automatique activé (clé OpenSanctions présente). */
  screeningEnabled?: boolean;
}

export default function TracfinForm({ initialData, dossierId, screeningEnabled = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<DossierForm>({ ...initialForm, ...initialData });
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof DossierForm>(k: K, v: DossierForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  const score = computeScore(form);

  const nav = (dir: number) => {
    setAnim(true);
    setTimeout(() => {
      setStep((s) => s + dir);
      setAnim(false);
      const top = scrollRef.current?.getBoundingClientRect().top;
      if (top !== undefined && top < 0) scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  const canNext0 = form.nomPrenom.trim().length > 0;
  const isVendeur = form.partie === "vendeur";
  const canNext1 = !!(
    // Risque géographique (applicable aux 2)
    form.residenceFiscale && form.lieuBien &&
    // Comportement (applicable aux 2)
    form.comportement &&
    // Type de bien (applicable aux 2)
    form.typeBien &&
    // Bénéficiaires effectifs (applicable aux 2)
    form.rbe &&
    // Gates absolues (applicables aux 2)
    form.gelAvoirs !== null && form.sanctionsListe !== null &&
    // PPE étendue (applicable aux 2)
    form.ppe !== null && form.ppeProcheDetecte !== null &&
    // Champs propres à l'ACQUÉREUR uniquement
    (isVendeur || (form.origineFonds && form.montageFinancier && form.modePaiement && form.coherencePrix))
  );

  const titles = ["Identification du client", "Analyse des risques", "Niveau de vigilance et attestation"];
  const short = ["Identification", "Analyse", "Niveau et attestation"];
  const subs = [
    "Renseignez les informations d'identité et collectez les pièces justificatives.",
    "Évaluez chaque facteur de risque selon les critères réglementaires LCB-FT.",
    "Vérifiez le niveau de vigilance retenu et finalisez l'attestation.",
  ];

  const submit = async () => {
    setSaving(true);
    try {
      const url = dossierId ? `/api/dossiers/${dossierId}` : "/api/dossiers";
      const method = dossierId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `HTTP ${res.status}`);
      }
      if (dossierId) {
        // On reste sur la fiche : le niveau calculé et la suite à donner s'affichent en haut.
        router.refresh();
        setSaving(false);
        setSaved(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSaved(false), 4000);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      alert(`Erreur lors de la sauvegarde : ${msg}`);
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    if (!dossierId) return;
    setExporting(true);
    try {
      // Sauvegarde d'abord l'état actuel
      await fetch(`/api/dossiers/${dossierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      // Puis télécharge le PDF
      const res = await fetch(`/api/dossiers/${dossierId}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossier-tracfin-${dossierId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de la génération du PDF");
    } finally {
      setExporting(false);
    }
  };

  const statusBg: Record<string, string> = {
    valid: "#16A06A",
    vigilance: "#DD6B20",
    stop: "#DD6B20",
    critical: "#C23630",
  };
  const canGo = (i: number) => i < step;

  return (
    <div ref={scrollRef} className="kd-card kd-form" style={{ scrollMarginTop: 24 }}>
      {/* Étapes */}
      <div className="kd-steps">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            className="kd-step"
            data-on={i === step ? "" : undefined}
            data-done={i < step ? "" : undefined}
            onClick={() => canGo(i) && nav(i - step)}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check width={14} height={14} strokeWidth={3} /> : i + 1}</span>
            <b>{short[i]}</b>
          </button>
        ))}
        <div className="kd-step-bar"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      </div>

      <div className="kd-form-in">
        <h3 className="kd-form-t">{titles[step]}</h3>
        <p className="kd-form-s">{subs[step]}</p>
        <div className="transition-all duration-200" style={{ opacity: anim ? 0 : 1, transform: anim ? "translateY(8px)" : "translateY(0)" }}>
          {step === 0 && <Step1 form={form} set={set} />}
          {step === 1 && <Step2 form={form} set={set} dossierId={dossierId} screeningEnabled={screeningEnabled} />}
          {step === 2 && <Step3 form={form} set={set} score={score} />}
        </div>
      </div>

      <div className="kd-form-foot">
        <button type="button" className="kd-btn" onClick={() => nav(-1)} disabled={step === 0} aria-label="Étape précédente">
          <ArrowLeft width={16} height={16} /><span className="max-sm:hidden">Précédent</span>
        </button>
        <span className="kd-grow" />
        <span className="kd-dots" aria-hidden>
          {[0, 1, 2].map((i) => <i key={i} data-on={i === step ? "" : undefined} data-done={i < step ? "" : undefined} />)}
        </span>
        <span className="kd-grow" />
        {step === 2 && dossierId && (
          <button type="button" className="kd-btn" onClick={exportPdf} disabled={exporting}>
            <FileDown width={16} height={16} />{exporting ? "Génération…" : "PDF"}
          </button>
        )}
        {step < 2 ? (
          <button type="button" className="kd-btn kd-btn--pri" onClick={() => nav(1)} disabled={step === 0 ? !canNext0 : !canNext1}>
            Suivant<ArrowRight width={16} height={16} />
          </button>
        ) : (
          <button
            type="button"
            className="kd-btn kd-btn--pri"
            onClick={submit}
            disabled={saving}
            style={{ background: statusBg[score.statutKey], boxShadow: "none" }}
          >
            {saving ? "Enregistrement…" : saved ? "Enregistré" : dossierId ? "Enregistrer ce niveau" : "Valider le dossier"}
          </button>
        )}
      </div>
    </div>
  );
}
