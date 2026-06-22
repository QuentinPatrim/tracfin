// components/landing/DemoModal.tsx — Démo guidée (refonte)
//
// Lecteur cinématique thémé clair/sombre. Les étapes « client » (formulaire) et
// « attestation » utilisent les VRAIS composants (KycPhonePreview = /kyc/demo,
// PdfPreviewFrame = vrai template PDF), synchronisés au thème. Les étapes « agent »
// (créer / envoyer / scorer) sont des recréations fidèles et thémées du dashboard
// (non intégrable en iframe car protégé par auth). Autoplay + contrôles + fondu.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Play, Pause, ArrowRight, Folder, Send, Mail, Smartphone, MessageCircle,
  ScanSearch, Lock, Check, ShieldCheck,
} from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";
import KycPhonePreview from "@/components/landing/KycPhonePreview";
import PdfPreviewFrame from "@/components/landing/PdfPreviewFrame";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;
}

type Kind = "create" | "send" | "kyc" | "score" | "pdf";

interface Step {
  num: string;
  title: string;
  caption: string;
  kind: Kind;
  durationMs: number;
}

const STEPS: Step[] = [
  { num: "01", title: "Vous créez le dossier", caption: "Nom du client, type, e-mail. Le dossier est créé et le lien KYC sécurisé est généré.", kind: "create", durationMs: 6000 },
  { num: "02", title: "Le lien part au client", caption: "Par e-mail, SMS ou WhatsApp — aucune application à installer, aucun compte à créer.", kind: "send", durationMs: 5500 },
  { num: "03", title: "Le client remplit, sur son téléphone", caption: "Le vrai formulaire Klaris, mobile-first. Identité, origine des fonds, pièces, consentement RGPD.", kind: "kyc", durationMs: 9500 },
  { num: "04", title: "Klaris analyse et score", caption: "Scoring LCB-FT à 4 niveaux selon le CMF. Verdict déterministe et auditable en quelques secondes.", kind: "score", durationMs: 6500 },
  { num: "05", title: "L'attestation est prête", caption: "PDF horodaté, signé SHA-256, opposable en cas de contrôle DGCCRF. Le vrai document.", kind: "pdf", durationMs: 8500 },
];

const TOTAL = STEPS.length;

export default function DemoModal({ open, onClose, onCta }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPlaying(true);
    setProgress(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goTo((step + 1) % TOTAL);
      else if (e.key === "ArrowLeft") goTo((step - 1 + TOTAL) % TOTAL);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, onClose]);

  useEffect(() => {
    if (!open || !playing) return;
    startRef.current = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startRef.current) / STEPS[step].durationMs);
      setProgress(p);
      if (p >= 1) {
        setStep((s) => (s + 1) % TOTAL);
        startRef.current = performance.now();
        setProgress(0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, step]);

  const goTo = (i: number) => { setStep(i); setProgress(0); startRef.current = performance.now(); };

  if (!open) return null;
  const S = STEPS[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Démo guidée Klaris"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(8,6,14,0.66)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col"
        style={{
          maxHeight: "94vh",
          background: "var(--lp-bg)",
          border: "1px solid var(--lp-border-2)",
          boxShadow: "0 40px 100px -20px rgba(109,94,246,0.35), 0 12px 40px -8px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b" style={{ borderColor: "var(--lp-border-1)" }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <KlarisLogo size={26} />
            <span className="text-[14px] font-bold tracking-tight" style={{ color: "var(--lp-text)" }}>Klaris</span>
            <span
              className="px-2 py-0.5 rounded-md text-[9.5px] font-semibold tracking-widest uppercase"
              style={{ background: "var(--lp-card-bg-accent)", border: "1px solid var(--lp-card-border-accent)", color: "var(--lp-accent-text)" }}
            >
              Démo guidée
            </span>
            <span className="hidden md:block text-[11.5px] ml-1 truncate" style={{ color: "var(--lp-text-4)" }}>
              · le parcours d'un dossier, de A à Z
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la démo"
            className="w-9 h-9 rounded-lg grid place-items-center transition text-[color:var(--lp-text-3)] hover:bg-[var(--lp-surface-2)]"
          >
            <X width={16} height={16} />
          </button>
        </div>

        {/* Stage */}
        <div className="relative px-3 sm:px-6 pt-5 overflow-y-auto" style={{ flex: "1 1 auto" }}>
          <div className="relative mx-auto" style={{ minHeight: 430, maxWidth: 760 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.kind}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: step === i ? 1 : 0,
                  transform: step === i ? "translateY(0) scale(1)" : "translateY(8px) scale(0.985)",
                  transition: "opacity 520ms ease, transform 520ms ease",
                  pointerEvents: step === i ? "auto" : "none",
                }}
                aria-hidden={step !== i}
              >
                <StepView kind={s.kind} />
              </div>
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span
              className="font-mono text-[10.5px] font-semibold px-2 py-1 rounded-md tracking-widest"
              style={{ background: "var(--lp-card-bg-accent)", border: "1px solid var(--lp-card-border-accent)", color: "var(--lp-accent-text)" }}
            >
              {S.num} / {String(TOTAL).padStart(2, "0")}
            </span>
            <h2 className="text-[16px] sm:text-[18px] font-bold tracking-tight" style={{ color: "var(--lp-text)" }}>{S.title}</h2>
          </div>
          <p className="mt-1.5 text-[13px] sm:text-[13.5px] leading-relaxed max-w-3xl" style={{ color: "var(--lp-text-3)" }}>{S.caption}</p>
        </div>

        {/* Controls */}
        <div className="px-4 sm:px-6 py-3.5 mt-3 border-t flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "var(--lp-border-1)" }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-8 h-8 rounded-lg grid place-items-center shrink-0 border transition text-[color:var(--lp-text-3)] hover:bg-[var(--lp-surface-2)]"
              style={{ borderColor: "var(--lp-border-2)" }}
              aria-label={playing ? "Pause" : "Lecture"}
            >
              {playing ? <Pause width={13} height={13} /> : <Play width={13} height={13} fill="currentColor" strokeWidth={0} />}
            </button>
            <div className="flex gap-1.5 items-center overflow-hidden">
              {STEPS.map((_, i) => {
                const isActive = i === step;
                const isPast = i < step;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="h-1.5 rounded-full relative overflow-hidden shrink-0 transition-all"
                    style={{ width: isActive ? 40 : 8, background: isPast ? "var(--lp-accent)" : "var(--lp-surface-3)" }}
                    aria-label={`Étape ${i + 1}`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${Math.round(progress * 100)}%`, background: "var(--lp-cta-grad)", transition: "width 100ms linear" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => { onClose(); onCta?.(); }}
            className="px-4 sm:px-5 py-2 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 shrink-0"
            style={{ background: "var(--lp-cta-grad)", boxShadow: "var(--lp-cta-shadow)" }}
          >
            Essayer gratuitement
            <ArrowRight width={13} height={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Vues d'étape ─────────────────────────── */

function StepView({ kind }: { kind: Kind }) {
  if (kind === "kyc") return <KycPhonePreview />;
  if (kind === "pdf") return <div className="w-full max-w-[420px]"><PdfPreviewFrame compact /></div>;
  if (kind === "create") return <CreateMock />;
  if (kind === "send") return <SendMock />;
  return <ScoreMock />;
}

/** Cadre « fenêtre app » thémé, pour les maquettes côté agent. */
function AppCard({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div
      className="w-full max-w-[460px] rounded-2xl overflow-hidden"
      style={{ background: "var(--lp-card-bg)", border: "1px solid var(--lp-card-border)", boxShadow: "var(--lp-card-shadow)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--lp-border-1)", background: "var(--lp-surface)" }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#fda4af" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#fcd34d" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#86efac" }} />
        </div>
        <div className="flex-1 text-center text-[10.5px] font-mono truncate" style={{ color: "var(--lp-text-4)" }}>{url}</div>
        <Lock width={11} height={11} style={{ color: "var(--lp-success)" }} />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function FieldMock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--lp-text-4)" }}>{label}</div>
      <div
        className="px-2.5 py-1.5 rounded-md text-[12px]"
        style={{
          background: accent ? "var(--lp-card-bg-accent)" : "var(--lp-input-bg)",
          border: `1px solid ${accent ? "var(--lp-card-border-accent)" : "var(--lp-input-border)"}`,
          color: "var(--lp-text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CreateMock() {
  return (
    <AppCard url="klaris-app.fr/dashboard/nouveau">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--lp-icon-bg)", border: "1px solid var(--lp-icon-border)", color: "var(--lp-icon-color)" }}>
          <Folder width={13} height={13} />
        </span>
        <span className="text-[13px] font-bold" style={{ color: "var(--lp-text)" }}>Nouveau dossier</span>
      </div>
      <div className="space-y-2.5">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--lp-text-4)" }}>Type</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="py-1.5 rounded-md text-[11px] font-semibold text-center" style={{ background: "var(--lp-card-bg-accent)", border: "1px solid var(--lp-card-border-accent)", color: "var(--lp-accent-text)" }}>Personne physique</div>
            <div className="py-1.5 rounded-md text-[11px] font-medium text-center" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)", color: "var(--lp-text-4)" }}>Personne morale</div>
          </div>
        </div>
        <FieldMock label="Nom et prénom" value="Camille Rousseau" />
        <FieldMock label="E-mail du client" value="camille.rousseau@example.com" />
      </div>
      <div className="mt-3.5 w-full py-2 rounded-lg text-white text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: "var(--lp-cta-grad)", boxShadow: "var(--lp-cta-shadow)" }}>
        Créer et générer le lien KYC
        <Send width={11} height={11} />
      </div>
    </AppCard>
  );
}

function SendMock() {
  const Channel = ({ icon: Icon, label }: { icon: React.ComponentType<{ width?: number; height?: number }>; label: string }) => (
    <div className="flex-1 py-2 rounded-lg flex flex-col items-center gap-1" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)", color: "var(--lp-text-3)" }}>
      <Icon width={15} height={15} />
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
  return (
    <AppCard url="klaris-app.fr/dashboard/dossier">
      <div className="text-[12.5px] font-semibold mb-1" style={{ color: "var(--lp-text)" }}>Envoyer le lien à Camille</div>
      <div className="text-[11px] mb-3" style={{ color: "var(--lp-text-4)" }}>Aucune app, aucun compte. Le client clique et remplit.</div>
      <div className="rounded-lg px-3 py-2.5 flex items-center gap-2 mb-3" style={{ background: "var(--lp-card-bg-accent)", border: "1px solid var(--lp-card-border-accent)", color: "var(--lp-accent-text)" }}>
        <Lock width={11} height={11} className="shrink-0" />
        <span className="flex-1 text-[10.5px] font-mono truncate">klaris-app.fr/kyc/Yt8K…aB3z</span>
        <Check width={12} height={12} style={{ color: "var(--lp-success)" }} />
      </div>
      <div className="flex gap-2">
        <Channel icon={Mail} label="E-mail" />
        <Channel icon={MessageCircle} label="WhatsApp" />
        <Channel icon={Smartphone} label="SMS" />
      </div>
      <div className="mt-3 text-[10px] flex items-center gap-1.5" style={{ color: "var(--lp-text-4)" }}>
        <Check width={10} height={10} strokeWidth={3} style={{ color: "var(--lp-success)" }} />
        Lien sécurisé · expire dans 30 jours
      </div>
    </AppCard>
  );
}

function ScoreMock() {
  const Chip = ({ label }: { label: string }) => (
    <span className="text-[10px] px-2 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "var(--lp-success-bg)", border: "1px solid var(--lp-success-border)", color: "var(--lp-success)" }}>
      <Check width={9} height={9} strokeWidth={3} />
      {label}
    </span>
  );
  return (
    <AppCard url="klaris-app.fr/dashboard/dossier">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold" style={{ background: "var(--lp-card-bg-accent)", border: "1px solid var(--lp-card-border-accent)", color: "var(--lp-accent-text)" }}>CR</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold leading-tight" style={{ color: "var(--lp-text)" }}>Camille Rousseau</div>
          <div className="text-[10px]" style={{ color: "var(--lp-text-4)" }}>Personne physique · acquéreur</div>
        </div>
        <ScanSearch width={16} height={16} style={{ color: "var(--lp-accent-text)" }} />
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: "var(--lp-success-bg)", border: "1px solid var(--lp-success-border)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5" style={{ color: "var(--lp-success)" }}>
          <ShieldCheck width={11} height={11} /> Verdict · Niveau 1 / 4
        </div>
        <div className="text-[14px] font-bold" style={{ color: "var(--lp-success)" }}>Vigilance standard — Conforme</div>
        <div className="text-[10.5px] mt-0.5" style={{ color: "var(--lp-text-3)" }}>Traiter normalement. Archivage 5 ans (CMF L.561-12-1).</div>
      </div>

      <div className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--lp-text-4)" }}>Critères évalués</div>
      <div className="flex flex-wrap gap-1.5">
        <Chip label="Identité" />
        <Chip label="Origine des fonds" />
        <Chip label="Géographie" />
        <Chip label="Aucun PPE" />
      </div>
      <div className="mt-3 text-[10px] flex items-center gap-1.5" style={{ color: "var(--lp-text-4)" }}>
        <ScanSearch width={10} height={10} />
        Décision rendue en 1,8 s · algorithme déterministe v2 · auditable
      </div>
    </AppCard>
  );
}
