// components/tracfin/TracfinForm.tsx — Formulaire 3 étapes (création + édition + export PDF)

"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Mail } from "lucide-react";
import { computeScore, initialForm, type DossierForm } from "@/lib/tracfin";
import AmbientOrbs from "./AmbientOrbs";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";

interface Props {
  initialData?: Partial<DossierForm>;
  dossierId?: string;
  hasKyc?: boolean;
}

export default function TracfinForm({ initialData, dossierId, hasKyc = false }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [anim, setAnim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 180);
  };

  const canNext0 = form.nomPrenom.trim().length > 0;
  const canNext1 = !!(
    // Risque géographique
    form.residenceFiscale && form.lieuBien &&
    // Comportement
    form.comportement &&
    // Origine des fonds
    form.origineFonds &&
    // Transaction
    form.typeBien && form.montageFinancier && form.modePaiement && form.coherencePrix &&
    // Bénéficiaires effectifs
    form.rbe &&
    // Gates absolues
    form.gelAvoirs !== null && form.sanctionsListe !== null &&
    // PPE étendue
    form.ppe !== null && form.ppeProcheDetecte !== null
  );

  const titles = ["Identification du Client", "Analyse des Risques", "Récapitulatif & Validation"];
  const subs = [
    "Renseignez les informations d'identité et collectez les pièces justificatives.",
    "Évaluez chaque facteur de risque selon les critères réglementaires LCB-FT.",
    "Consultez le verdict de conformité et finalisez l'attestation.",
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
      router.push("/dashboard");
      router.refresh();
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

  const statusGradients: Record<string, string> = {
    valid: "linear-gradient(135deg,#34D399,#059669)",
    vigilance: "linear-gradient(135deg,#FB923C,#EA580C)",
    stop: "linear-gradient(135deg,#FB923C,#EA580C)",
    critical: "linear-gradient(135deg,#F87171,#DC2626)",
  };
  const statusGlows: Record<string, string> = {
    valid: "rgba(52,211,153,0.35)",
    vigilance: "rgba(251,146,60,0.35)",
    stop: "rgba(251,146,60,0.35)",
    critical: "rgba(248,113,113,0.35)",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07080F", fontFamily: "Inter, sans-serif" }}>
      <AmbientOrbs />

      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <div className="flex items-center gap-3">
            {hasKyc && (
              <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                KYC reçu — données pré-remplies
              </div>
            )}
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              {dossierId ? "Édition" : "Nouveau dossier"}
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="relative z-10 px-6 pt-8">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  i <= step ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/[0.03] border-white/10 text-white/40"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div className="flex-1 h-px bg-white/10 relative">
                  <div className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-8 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-white">{titles[step]}</h1>
            <p className="text-sm text-white/60 leading-relaxed">{subs[step]}</p>
          </div>

          <div className="transition-all duration-200" style={{ opacity: anim ? 0 : 1, transform: anim ? "translateY(8px)" : "translateY(0)" }}>
            {step === 0 && <Step1 form={form} set={set} />}
            {step === 1 && <Step2 form={form} set={set} />}
            {step === 2 && <Step3 form={form} set={set} score={score} />}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.08] backdrop-blur-2xl" style={{ background: "rgba(7,8,15,0.92)" }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={step === 0}
            className={`px-5 py-[11px] rounded-full border text-sm font-medium transition-all backdrop-blur-md ${
              step === 0
                ? "bg-white/[0.03] border-white/10 text-white/30 cursor-not-allowed"
                : "bg-white/[0.05] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            Précédent
          </button>

          <div className="flex gap-1.5 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 22 : 5,
                  background: i === step ? "linear-gradient(90deg,#6366F1,#8B5CF6)" : i < step ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step === 2 && dossierId && (
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting}
                className="px-5 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 backdrop-blur-md disabled:opacity-50"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: "#818CF8" }}
              >
                <FileDown className="w-4 h-4" />
                {exporting ? "Génération..." : "Exporter PDF"}
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={() => nav(1)}
                disabled={step === 0 ? !canNext0 : !canNext1}
                className="px-7 py-3 rounded-full text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="px-7 py-3 rounded-full text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-wait"
                style={{ background: statusGradients[score.statutKey], boxShadow: `0 4px 18px ${statusGlows[score.statutKey]}` }}
              >
                {saving ? "Enregistrement..." : dossierId ? "Mettre à jour" : "Valider le Dossier"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}