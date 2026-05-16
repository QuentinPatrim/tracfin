// components/landing/DemoModal.tsx — Guided tour Klaris (5 étapes auto-play)
// Modal plein écran déclenchée depuis le CTA "Voir la démo".
// Plus tard : on peut swap le contenu de la <Player> par un <video> ou <iframe> Loom.

"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Play, Pause, ArrowRight, Mail, Send, Check, Upload, FileText,
  ShieldCheck, ChevronRight, Image as ImageIcon, Lock,
} from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;        // callback "Essayer gratuitement"
}

const STEP_DURATION_MS = 5500;

interface Step {
  num: string;
  title: string;
  desc: string;
  Mockup: React.FC;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Créez un dossier client",
    desc: "En quelques secondes, ajoutez un nouveau client (personne physique ou morale) depuis votre tableau de bord.",
    Mockup: CreateMockup,
  },
  {
    num: "02",
    title: "Envoyez le lien KYC sécurisé",
    desc: "Un lien personnalisé est généré. Partagez-le par email ou WhatsApp — sans application à installer côté client.",
    Mockup: SendMockup,
  },
  {
    num: "03",
    title: "Le client remplit en ligne",
    desc: "Identité, opération, pièces justificatives — toutes les données sont chiffrées en transit (TLS 1.3) et hébergées en France.",
    Mockup: ClientMockup,
  },
  {
    num: "04",
    title: "Analyse Tracfin automatique",
    desc: "13 critères réglementaires évalués en temps réel. Verdict immédiat selon les 4 niveaux légaux du CMF.",
    Mockup: ScoringMockup,
  },
  {
    num: "05",
    title: "Attestation PDF prête",
    desc: "Téléchargez l'attestation LCB-FT signée avec hash SHA-256, prête à archiver pour 5 ans.",
    Mockup: AttestationMockup,
  },
];

export default function DemoModal({ open, onClose, onCta }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  // Reset à l'ouverture
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setPlaying(true);
    setProgress(0);
  }, [open]);

  // Lock scroll background
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Auto-play + progress bar
  useEffect(() => {
    if (!open || !playing) return;
    startRef.current = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / STEP_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        setStep((s) => (s + 1) % STEPS.length);
        startRef.current = performance.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, step]);

  const goTo = (i: number) => {
    setStep(i);
    setProgress(0);
    startRef.current = performance.now();
  };

  if (!open) return null;

  const S = STEPS[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10"
      style={{
        background: "rgba(7,8,15,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.10)",
            "0 1px 0 rgba(255,255,255,0.16) inset",
            "0 40px 100px -20px rgba(124,58,237,0.45)",
            "0 12px 40px -8px rgba(0,0,0,0.6)",
          ].join(", "),
        }}
      >
        {/* glow */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.35), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(236,72,153,0.25), transparent 70%)" }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <KlarisLogo size={26} />
            <div className="text-[15px] font-extrabold tracking-tight text-white">Klaris</div>
            <div
              className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))",
                border: "1px solid rgba(168,85,247,0.35)",
                color: "#C4B5FD",
              }}
            >
              Démo guidée
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PLAYER */}
        <div className="relative px-3 sm:px-7 pt-4 sm:pt-6 pb-3">
          {/* Browser chrome */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "#0A0B14",
              boxShadow: [
                "0 0 0 1px rgba(255,255,255,0.08)",
                "0 30px 80px -20px rgba(168,85,247,0.40)",
                "0 12px 30px -8px rgba(0,0,0,0.5)",
              ].join(", "),
            }}
          >
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-black/30">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 mx-3">
                <div className="text-[10px] text-white/40 font-mono truncate text-center">
                  app.klaris.fr{stepUrl(step)}
                </div>
              </div>
              <Lock className="w-3 h-3 text-emerald-400/80" />
            </div>

            {/* Mockup viewport */}
            <div
              className="relative w-full bg-[#07080F]"
              style={{ aspectRatio: "16 / 9.5", overflow: "hidden" }}
            >
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 py-6"
                  style={{
                    opacity: step === i ? 1 : 0,
                    transform: step === i ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
                    transition: "opacity 500ms ease, transform 500ms ease",
                    pointerEvents: step === i ? "auto" : "none",
                  }}
                >
                  <s.Mockup />
                </div>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="mt-5 sm:mt-6 px-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-mono text-[10px] font-bold px-2 py-1 rounded-md"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  color: "#fff",
                  letterSpacing: "0.06em",
                }}
              >
                {S.num} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">{S.title}</h2>
            </div>
            <p className="text-sm text-white/55 leading-relaxed max-w-3xl">{S.desc}</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="relative px-5 sm:px-7 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition shrink-0"
              aria-label={playing ? "Pause" : "Lecture"}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Step dots / progress */}
            <div className="flex gap-1.5 items-center overflow-hidden">
              {STEPS.map((_, i) => {
                const isActive = i === step;
                const isPast = i < step;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="h-1.5 rounded-full transition-all relative overflow-hidden shrink-0"
                    style={{
                      width: isActive ? 44 : 8,
                      background: isPast
                        ? "linear-gradient(90deg,#7C3AED,#EC4899)"
                        : "rgba(255,255,255,0.12)",
                    }}
                    aria-label={`Étape ${i + 1}`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${Math.round(progress * 100)}%`,
                          background: "linear-gradient(90deg,#7C3AED,#EC4899)",
                          transition: "width 100ms linear",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => { onClose(); onCta?.(); }}
            className="px-5 py-2.5 rounded-full text-white text-[13px] font-bold inline-flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
            style={{
              background: "linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)",
              backgroundSize: "200% 200%",
              animation: "gradShift 6s ease infinite",
              boxShadow: "0 10px 30px -6px rgba(168,85,247,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function stepUrl(step: number): string {
  return [
    "/dashboard/nouveau",
    "/dashboard/[id]/wait",
    "/kyc/abc123…",
    "/dashboard/[id]",
    "/dashboard/[id]/attestation.pdf",
  ][step];
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* MOCKUPS DES 5 ÉTAPES                                                          */
/* ════════════════════════════════════════════════════════════════════════════ */

function Card({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.08)",
          "0 1px 0 rgba(255,255,255,0.10) inset",
          glow ? "0 20px 60px -10px rgba(168,85,247,0.35)" : "0 8px 24px -8px rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}

/* ─── ÉTAPE 1 : CRÉATION DOSSIER ─────────────────────────────────────────── */
function CreateMockup() {
  return (
    <Card glow className="w-full max-w-md p-5 sm:p-6">
      <div className="text-center mb-5">
        <div
          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-3"
          style={{
            background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.08))",
            boxShadow: "0 0 0 1px rgba(168,85,247,0.40), 0 0 24px rgba(168,85,247,0.30)",
          }}
        >
          <Send className="w-4 h-4 text-violet-200" />
        </div>
        <div className="text-xl font-extrabold tracking-tight text-white mb-1">Créer un dossier</div>
        <div className="text-[11px] text-white/50">Quelques informations sur votre client</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1.5">Type de client</div>
          <div className="flex gap-2">
            <div
              className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-center text-violet-200"
              style={{
                background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.08))",
                boxShadow: "0 0 0 1px rgba(168,85,247,0.40)",
              }}
            >
              Personne Physique
            </div>
            <div className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-center text-white/40 bg-white/[0.03] border border-white/10">
              Personne Morale
            </div>
          </div>
        </div>

        <div>
          <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1.5">Nom et prénom</div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.12] text-[12px] text-white">
            Martin Claire<span className="inline-block w-0.5 h-3 bg-violet-300 ml-0.5 animate-pulse align-middle" />
          </div>
        </div>

        <div>
          <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1.5">Email du client</div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.12] text-[12px] text-white/85">
            claire.martin@email.fr
          </div>
        </div>
      </div>

      <button
        className="w-full mt-5 py-2.5 rounded-full text-white text-[12px] font-bold inline-flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg,#6366F1,#A855F7,#EC4899)",
          boxShadow: "0 8px 20px rgba(168,85,247,0.50), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        Créer le dossier et générer le lien
        <Send className="w-3 h-3" />
      </button>
    </Card>
  );
}

/* ─── ÉTAPE 2 : ENVOI LIEN KYC ───────────────────────────────────────────── */
function SendMockup() {
  return (
    <Card glow className="w-full max-w-md p-5 sm:p-6 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{
          background: "linear-gradient(180deg, rgba(52,211,153,0.22), rgba(52,211,153,0.08))",
          boxShadow: "0 0 0 1px rgba(52,211,153,0.40), 0 0 30px rgba(52,211,153,0.30)",
        }}
      >
        <Check className="w-5 h-5 text-emerald-300" strokeWidth={2.5} />
      </div>
      <div className="text-xl font-extrabold tracking-tight text-white mb-1">Dossier créé</div>
      <div className="text-[11px] text-white/50 mb-5">Le lien KYC pour Martin Claire est prêt.</div>

      <div className="mb-5 px-3 py-2 rounded-xl bg-white/[0.03] flex items-center gap-2"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <div className="flex-1 text-[10px] font-mono text-white/80 truncate text-left">
          klaris.fr/kyc/Yt8K…aB3z
        </div>
        <div
          className="px-2.5 py-1 rounded-md text-[10px] font-bold text-violet-200"
          style={{ background: "rgba(168,85,247,0.18)" }}
        >
          Copier
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-white/45 mb-2 font-bold">Partager via</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { Icon: Mail, label: "Email", color: "#A5B4FC" },
          { Icon: Send, label: "WhatsApp", color: "#34D399" },
          { Icon: FileText, label: "Message", color: "#C4B5FD" },
        ].map(({ Icon, label, color }) => (
          <div
            key={label}
            className="py-2.5 rounded-xl flex flex-col items-center gap-1"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            <span className="text-[10px] text-white/70 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── ÉTAPE 3 : FORMULAIRE CLIENT ─────────────────────────────────────────── */
function ClientMockup() {
  return (
    <Card glow className="w-full max-w-md p-5 sm:p-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <ShieldCheck className="text-white w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-bold text-white">Klaris</span>
        </div>
        <div className="text-lg font-extrabold tracking-tight text-white mb-0.5">Vérification d'identité</div>
        <div className="text-[10px] text-white/45">Obligations LCB-FT</div>
      </div>

      <div className="mb-3">
        <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1.5">Identité</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.10] text-[10px] text-white">
            Martin Claire
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.10] text-[10px] text-white">
            12/06/1986
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1.5">Pièces justificatives</div>
        <div className="space-y-2">
          <div
            className="rounded-xl px-3 py-2 flex items-center gap-2.5"
            style={{ background: "rgba(52,211,153,0.05)", boxShadow: "0 0 0 1px rgba(52,211,153,0.30)" }}
          >
            <div className="w-7 h-7 rounded-md bg-white/[0.05] flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="flex-1 text-[10px] text-white">Pièce d'identité.jpg</div>
            <div className="flex items-center gap-1 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
              <Check className="w-2.5 h-2.5" />
              Reçu
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-2 flex items-center gap-2.5"
            style={{ background: "rgba(99,102,241,0.05)", boxShadow: "0 0 0 1px rgba(99,102,241,0.30)" }}
          >
            <div className="w-7 h-7 rounded-md bg-white/[0.05] flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            </div>
            <div className="flex-1 text-[10px] text-white/70">Justificatif domicile.pdf</div>
            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: "68%",
                  background: "linear-gradient(90deg,#6366F1,#A855F7)",
                  boxShadow: "0 0 8px rgba(139,92,246,0.6)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-white/[0.03]" style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
        <Lock className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] text-white/55">Chiffrement TLS 1.3 + AES-256 · Paris</span>
      </div>
    </Card>
  );
}

/* ─── ÉTAPE 4 : SCORING ───────────────────────────────────────────────────── */
function ScoringMockup() {
  return (
    <Card glow className="w-full max-w-md p-5 sm:p-6">
      {/* Stepper */}
      <div className="flex items-center gap-1.5 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                i <= 2 ? "text-white" : "text-white/40"
              }`}
              style={
                i <= 2
                  ? {
                      background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 12px rgba(139,92,246,0.5)",
                    }
                  : { background: "rgba(255,255,255,0.04)" }
              }
            >
              {i + 1}
            </div>
            {i < 2 && <div className="flex-1 h-px bg-gradient-to-r from-violet-500 to-pink-500" />}
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-violet-300 font-bold mb-1">Verdict de conformité</div>
      <div className="text-xl font-extrabold tracking-tight mb-1 text-emerald-400">Vigilance standard</div>
      <div className="text-[10px] text-white/50 mb-3 leading-relaxed">CMF L.561-5 à L.561-8 · Dossier conforme</div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full"
            style={{
              width: "100%",
              background: "linear-gradient(90deg,#059669,#10B981)",
              boxShadow: "0 0 12px rgba(16,185,129,0.5)",
            }}
          />
        </div>
        <div className="text-base font-extrabold text-emerald-400">100%</div>
      </div>

      <div className="text-[9px] font-bold uppercase tracking-widest text-violet-300 mb-2 pb-1.5 border-b border-white/[0.06]">
        Détail par critère
      </div>
      <div className="space-y-1.5">
        {[
          { name: "Bénéficiaires effectifs", label: "Conforme", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.40)" },
          { name: "Origine des fonds", label: "Conforme", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.40)" },
          { name: "Mode de paiement", label: "Conforme", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.40)" },
          { name: "Cohérence du prix", label: "Conforme", color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.40)" },
        ].map((c) => (
          <div key={c.name} className="flex items-center justify-between py-1.5">
            <span className="text-[10px] text-white/85">{c.name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
              style={{ background: c.bg, color: c.color, boxShadow: `0 0 0 1px ${c.border}` }}
            >
              ● {c.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── ÉTAPE 5 : PDF ATTESTATION ───────────────────────────────────────────── */
function AttestationMockup() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* glow */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.25), transparent 70%)" }}
      />
      <div
        className="relative rounded-xl overflow-hidden bg-white"
        style={{
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.06)",
            "0 30px 80px -20px rgba(168,85,247,0.50)",
            "0 12px 30px -8px rgba(0,0,0,0.5)",
          ].join(", "),
        }}
      >
        <div className="h-1.5" style={{ background: "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)" }} />
        <div className="p-5 text-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full" style={{ background: "conic-gradient(from 220deg, #7C3AED, #A855F7 30%, #EC4899 60%, #7C3AED)" }}>
                <div className="absolute inset-[5px] rounded-full bg-white" />
                <div className="absolute inset-[8px] rounded-full" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }} />
              </div>
              <div className="text-[13px] font-extrabold tracking-tight">Klaris</div>
              <div
                className="px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest"
                style={{ background: "rgba(124,58,237,0.10)", color: "#7C3AED", border: "1px solid rgba(168,85,247,0.30)" }}
              >
                ATTESTATION
              </div>
            </div>
            <div className="text-right">
              <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold">Dossier</div>
              <div className="text-[9px] font-bold font-mono">#577A7E48</div>
            </div>
          </div>

          {/* Title */}
          <div
            className="text-[18px] font-extrabold tracking-tight mb-3 leading-tight"
            style={{
              backgroundImage: "linear-gradient(90deg, #1B1438 0%, #4C1D95 60%, #7C3AED 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Attestation de Conformité<br />LCB-FT
          </div>

          {/* Verdict */}
          <div
            className="rounded-xl p-3 mb-3 relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #F2FBF7 0%, #ECFDF5 100%)",
              boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.45)",
            }}
          >
            <div className="text-[7px] font-bold uppercase tracking-[0.2em] mb-1 text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
              Verdict · Niveau 1 / 4
            </div>
            <div className="text-[14px] font-extrabold tracking-tight text-emerald-700 mb-2">
              Dossier conforme
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-emerald-200/60 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: "100%", background: "linear-gradient(90deg,#059669,#10B981)" }} />
              </div>
              <div className="text-[12px] font-extrabold text-emerald-700">100%</div>
            </div>
          </div>

          {/* Critères mini */}
          <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100">
            <span className="text-[7px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>02</span>
            <span className="text-[8px] font-bold tracking-widest uppercase" style={{ backgroundImage: "linear-gradient(135deg,#7C3AED,#EC4899)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              Critères
            </span>
          </div>
          <div className="space-y-1">
            {["Bénéficiaires effectifs", "Résidence fiscale", "Origine des fonds"].map((l) => (
              <div key={l} className="flex items-center justify-between py-1">
                <span className="text-[9px] text-slate-700">{l}</span>
                <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700" style={{ border: "1px solid #A7F3D0" }}>
                  ● Conforme
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
