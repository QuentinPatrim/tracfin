// components/tracfin/TracfinForm.tsx — Formulaire 3 étapes (création + édition + export PDF)

"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Mail } from "lucide-react";
import { computeScore, initialForm, type DossierForm } from "@/lib/tracfin";
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
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "#fafaff", fontFamily: "Inter, sans-serif", color: "#0f172a" }}
    >
      {/* Halos ambiants (light) cohérents avec le dashboard */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 600, height: 600, top: -200, left: -150,
          background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 600, height: 600, top: -150, right: -200,
          background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <header
        className="relative z-10 backdrop-blur-xl"
        style={{
          borderBottom: "1px solid rgba(124,58,237,0.10)",
          background: "rgba(255,255,255,0.85)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition text-sm font-medium"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6d28d9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <div className="flex items-center gap-3">
            {hasKyc && (
              <div
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  borderColor: "rgba(16,185,129,0.30)",
                  color: "#047857",
                }}
              >
                <Mail className="w-3 h-3" />
                KYC reçu — données pré-remplies
              </div>
            )}
            <div
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "#94a3b8" }}
            >
              {dossierId ? "Édition" : "Nouveau dossier"}
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="relative z-10 px-6 pt-8">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {[0, 1, 2].map((i) => {
            const active = i <= step;
            return (
              <div key={i} className="flex-1 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border"
                  style={{
                    background: active ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "white",
                    borderColor: active ? "rgba(124,58,237,0.45)" : "rgba(15,23,42,0.12)",
                    color: active ? "white" : "#94a3b8",
                    boxShadow: active ? "0 4px 14px rgba(124,58,237,0.30)" : "none",
                  }}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className="flex-1 h-px relative" style={{ background: "rgba(15,23,42,0.08)" }}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: i < step ? "100%" : "0%",
                        background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-8 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="mb-7">
            <h1
              className="text-[26px] font-bold tracking-tight mb-2"
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #6d28d9 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {titles[step]}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
              {subs[step]}
            </p>
          </div>

          <div className="transition-all duration-200" style={{ opacity: anim ? 0 : 1, transform: anim ? "translateY(8px)" : "translateY(0)" }}>
            {step === 0 && <Step1 form={form} set={set} />}
            {step === 1 && <Step2 form={form} set={set} dossierId={dossierId} />}
            {step === 2 && <Step3 form={form} set={set} score={score} />}
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-2xl"
        style={{
          borderTop: "1px solid rgba(124,58,237,0.10)",
          background: "rgba(255,255,255,0.92)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={step === 0}
            className="px-5 py-[10px] rounded-full text-sm font-medium transition-all border disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "white",
              borderColor: "rgba(15,23,42,0.12)",
              color: step === 0 ? "#94a3b8" : "#475569",
            }}
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
                  background: i === step
                    ? "linear-gradient(90deg, #7c3aed, #ec4899)"
                    : i < step ? "rgba(124,58,237,0.45)" : "rgba(15,23,42,0.10)",
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
                className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 border"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  borderColor: "rgba(124,58,237,0.25)",
                  color: "#6d28d9",
                }}
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
                className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 20px rgba(124,58,237,0.35)",
                }}
              >
                Suivant
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-wait"
                style={{
                  background: statusGradients[score.statutKey],
                  boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 20px ${statusGlows[score.statutKey]}`,
                }}
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