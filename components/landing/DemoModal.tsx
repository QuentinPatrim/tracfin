// components/landing/DemoModal.tsx — Démo narrative Klaris
// On suit Claire Martin (cliente fictive) du clic au PDF, étape par étape.
// Animations intra-étape pour donner vie au produit (typewriter, upload, score).

"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Play, Pause, ArrowRight, Mail, Send, Check, Upload, FileText, Folder,
  ShieldCheck, Lock, Smartphone, Sparkles, Image as ImageIcon, CheckCircle2,
  Hash, Download, Clock, BadgeCheck, ScanSearch, ShieldOff,
  Ban, Fingerprint, Globe,
} from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";

interface Props {
  open: boolean;
  onClose: () => void;
  onCta?: () => void;
}

interface Step {
  num: string;
  title: string;
  caption: string;
  durationMs: number;
  Mockup: React.FC<{ active: boolean }>;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Vous créez le dossier de Claire",
    caption: "5 champs. 8 secondes. Le dossier est créé, le lien KYC est généré et prêt à partir.",
    durationMs: 6500,
    Mockup: Step1_Create,
  },
  {
    num: "02",
    title: "Le lien KYC part chez Claire",
    caption: "Email, SMS ou WhatsApp — Claire n'a aucune app à installer, aucun compte à créer.",
    durationMs: 5500,
    Mockup: Step2_Send,
  },
  {
    num: "03",
    title: "Claire remplit sur son téléphone",
    caption: "82 % des clients finaux utilisent leur mobile. Le formulaire est pensé pour eux.",
    durationMs: 7500,
    Mockup: Step3_Mobile,
  },
  {
    num: "04",
    title: "Klaris analyse et score",
    caption: "L'algorithme Klaris v2 évalue 4 niveaux de vigilance selon le CMF. Verdict en quelques secondes.",
    durationMs: 6500,
    Mockup: Step4_Score,
  },
  {
    num: "05",
    title: "L'attestation est prête",
    caption: "PDF horodaté, signé SHA-256, opposable en cas de contrôle DGCCRF, ACPR ou Ordre.",
    durationMs: 6000,
    Mockup: Step5_Attestation,
  },
];

const TOTAL_STEPS = STEPS.length;

export default function DemoModal({ open, onClose, onCta }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const startRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

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
      else if (e.key === "ArrowRight" && step < TOTAL_STEPS - 1) goTo(step + 1);
      else if (e.key === "ArrowLeft" && step > 0) goTo(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, onClose]);

  useEffect(() => {
    if (!open || !playing) return;
    startRef.current = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / STEPS[step].durationMs);
      setProgress(p);
      if (p >= 1) {
        setStep((s) => (s + 1) % TOTAL_STEPS);
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
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl overflow-hidden border border-white/[0.08]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: "0 40px 100px -20px rgba(124,58,237,0.45), 0 12px 40px -8px rgba(0,0,0,0.6)",
        }}
      >
        {/* halos */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(124,58,237,0.30), transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(236,72,153,0.22), transparent 70%)" }} />

        {/* HEADER */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <KlarisLogo size={28} />
            <div className="text-[14.5px] font-bold tracking-tight text-white">Klaris</div>
            <div
              className="px-2 py-0.5 rounded-md text-[9.5px] font-semibold tracking-widest uppercase border"
              style={{
                background: "rgba(124,58,237,0.10)",
                borderColor: "rgba(124,58,237,0.30)",
                color: "#c4b5fd",
              }}
            >
              Démo guidée
            </div>
            <div className="hidden md:block text-[11.5px] text-white/45 ml-2">
              · Suivez le parcours du dossier de <span className="text-white/65">Claire Martin</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la démo"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X width={15} height={15} />
          </button>
        </div>

        {/* PLAYER */}
        <div className="relative px-3 sm:px-6 pt-4 sm:pt-5 pb-2">
          <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{
              background: "#08090F",
              boxShadow: "0 30px 80px -20px rgba(124,58,237,0.35), 0 12px 30px -8px rgba(0,0,0,0.6)",
            }}
          >
            {/* fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-black/30">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 mx-3">
                <div className="text-[10.5px] text-white/45 font-mono truncate text-center">
                  app.klaris.fr{stepUrl(step)}
                </div>
              </div>
              <Lock width={11} height={11} className="text-emerald-400/80" />
            </div>

            {/* viewport */}
            <div
              className="relative w-full bg-[#06070D]"
              style={{ aspectRatio: "16 / 9", overflow: "hidden" }}
            >
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    opacity: step === i ? 1 : 0,
                    transform: step === i ? "scale(1)" : "scale(0.98)",
                    transition: "opacity 600ms ease, transform 600ms ease",
                    pointerEvents: step === i ? "auto" : "none",
                  }}
                >
                  <s.Mockup active={step === i} />
                </div>
              ))}
            </div>
          </div>

          {/* CAPTION */}
          <div className="mt-4 px-1">
            <div className="flex items-baseline gap-2.5 mb-1.5 flex-wrap">
              <span
                className="font-mono text-[10.5px] font-semibold px-2 py-1 rounded-md tracking-widest"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.30)",
                  color: "#c4b5fd",
                }}
              >
                {S.num} / {String(TOTAL_STEPS).padStart(2, "0")}
              </span>
              <h2 className="text-[16px] sm:text-[18px] font-bold tracking-tight text-white">{S.title}</h2>
            </div>
            <p className="text-[13px] sm:text-[13.5px] text-white/60 leading-relaxed max-w-3xl">{S.caption}</p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="relative px-4 sm:px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-8 h-8 rounded-lg grid place-items-center text-white/65 hover:text-white hover:bg-white/[0.06] transition shrink-0 border border-white/[0.08]"
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
                    className="h-1.5 rounded-full transition-all relative overflow-hidden shrink-0"
                    style={{
                      width: isActive ? 44 : 8,
                      background: isPast
                        ? "linear-gradient(90deg, #7c3aed, #ec4899)"
                        : "rgba(255,255,255,0.10)",
                    }}
                    aria-label={`Étape ${i + 1}`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${Math.round(progress * 100)}%`,
                          background: "linear-gradient(90deg, #7c3aed, #ec4899)",
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
            className="px-4 sm:px-5 py-2 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 22px rgba(124,58,237,0.35)",
            }}
          >
            Essayer gratuitement
            <ArrowRight width={13} height={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function stepUrl(step: number): string {
  return [
    "/dashboard/nouveau",
    "/dashboard/d_a1f7…/envoyé",
    "/kyc/Yt8K…aB3z",
    "/dashboard/d_a1f7…",
    "/dashboard/d_a1f7…/attestation.pdf",
  ][step];
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
   ════════════════════════════════════════════════════════════════════════════ */

function AppFrame({ children }: { children: React.ReactNode }) {
  // Frame "dashboard Klaris" : sidebar discrète + main
  return (
    <div className="absolute inset-0 flex">
      {/* Sidebar miniature */}
      <div className="hidden sm:flex flex-col w-[140px] border-r border-white/[0.05] py-3 px-2.5 gap-2 bg-[#08090F]/80">
        <div className="flex items-center gap-2 px-1.5 pb-2 border-b border-white/[0.04]">
          <KlarisLogo size={20} />
          <div className="text-[11px] font-bold text-white">Klaris</div>
        </div>
        <div className="text-[8.5px] uppercase tracking-widest text-white/35 px-1.5 pt-1">Pilotage</div>
        <div
          className="px-2 py-1.5 rounded-md flex items-center gap-2 text-[11px] font-medium"
          style={{
            background: "rgba(124,58,237,0.10)",
            border: "1px solid rgba(124,58,237,0.22)",
            color: "#c4b5fd",
          }}
        >
          <Folder width={11} height={11} />
          Dossiers
          <span className="ml-auto text-[9px] text-white/45">3</span>
        </div>
        <div className="px-2 py-1.5 rounded-md flex items-center gap-2 text-[11px] text-white/55">
          <BadgeCheck width={11} height={11} />
          Tarifs
        </div>
        <div className="mt-auto p-2 rounded-md border border-white/[0.06] bg-white/[0.02]">
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">Essai</div>
          <div className="text-[10.5px] text-white/75 font-medium">12 jours restants</div>
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Highlight({ active, delay = 0 }: { active: boolean; delay?: number }) {
  // Anneau pulsé violet pour pointer un élément (cursor virtuel)
  if (!active) return null;
  return (
    <span
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        boxShadow: "0 0 0 2px rgba(124,58,237,0.45), 0 0 24px rgba(124,58,237,0.35)",
        animation: `pulseRing 1.4s ease-out ${delay}ms infinite`,
      }}
    />
  );
}

/* ────────────────────── ÉTAPE 1 : Création du dossier ────────────────────── */

function Step1_Create({ active }: { active: boolean }) {
  const [nom, setNom] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [highlightCreate, setHighlightCreate] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!active) {
      setNom(""); setShowEmail(false); setHighlightCreate(false); setShowToast(false);
      return;
    }
    const target = "Claire Martin";
    let i = 0;
    const tw = setInterval(() => {
      i++;
      setNom(target.slice(0, i));
      if (i >= target.length) clearInterval(tw);
    }, 90);

    const t1 = setTimeout(() => setShowEmail(true), 1900);
    const t2 = setTimeout(() => setHighlightCreate(true), 3400);
    const t3 = setTimeout(() => setShowToast(true), 4700);
    return () => { clearInterval(tw); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active]);

  return (
    <AppFrame>
      {/* main : titre */}
      <div className="px-5 pt-4">
        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Tableau de bord</div>
        <div className="text-[16px] font-bold text-white">Dossiers</div>
      </div>

      {/* Modale "Nouveau dossier" en surimpression */}
      <div className="absolute inset-0 grid place-items-center px-5 pb-3">
        <div
          className="relative w-full max-w-[380px] rounded-2xl p-4 border border-white/[0.10]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 20px 60px -10px rgba(124,58,237,0.40), 0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg grid place-items-center"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(236,72,153,0.12))",
                border: "1px solid rgba(124,58,237,0.30)",
              }}
            >
              <Folder width={13} height={13} className="text-violet-200" />
            </div>
            <div className="text-[13px] font-bold text-white">Nouveau dossier</div>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1">Type</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div
                  className="relative py-1.5 rounded-md text-[10.5px] font-semibold text-center text-violet-200"
                  style={{
                    background: "rgba(124,58,237,0.14)",
                    border: "1px solid rgba(124,58,237,0.35)",
                  }}
                >
                  Personne physique
                  <Highlight active={active} />
                </div>
                <div className="py-1.5 rounded-md text-[10.5px] font-medium text-center text-white/40 bg-white/[0.03] border border-white/[0.06]">
                  Personne morale
                </div>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1">Nom et prénom</div>
              <div className="px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.12] text-[11.5px] text-white">
                {nom}
                {nom.length < 13 && <span className="inline-block w-0.5 h-3 bg-violet-300 ml-px align-middle animate-pulse" />}
              </div>
            </div>

            <div
              style={{
                opacity: showEmail ? 1 : 0,
                transform: showEmail ? "translateY(0)" : "translateY(4px)",
                transition: "opacity 400ms, transform 400ms",
              }}
            >
              <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest mb-1">Email du client</div>
              <div className="px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.12] text-[11.5px] text-white/85">
                claire.martin@email.fr
              </div>
            </div>
          </div>

          <div className="relative mt-3.5">
            <button
              className="w-full py-2 rounded-lg text-white text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 20px rgba(124,58,237,0.40)",
              }}
            >
              Créer et générer le lien KYC
              <Send width={11} height={11} />
              {/* Ripple effect quand le bouton est "cliqué" virtuellement */}
              {showToast && (
                <span
                  className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 60%)",
                    animation: "ripple 700ms ease-out",
                  }}
                />
              )}
            </button>
            <Highlight active={highlightCreate} />
          </div>
        </div>
      </div>

      {/* Toast bottom + sparkles */}
      {showToast && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className="relative px-3 py-2 rounded-lg flex items-center gap-2 border"
            style={{
              background: "rgba(16,185,129,0.10)",
              borderColor: "rgba(16,185,129,0.35)",
              color: "#6ee7b7",
              animation: "slideUp 400ms ease both",
              boxShadow: "0 8px 22px rgba(16,185,129,0.20)",
            }}
          >
            <CheckCircle2 width={13} height={13} />
            <span className="text-[11px] font-semibold whitespace-nowrap">Dossier créé · Lien KYC généré</span>

            {/* Sparkles flottants autour du toast */}
            <Sparkles
              width={9}
              height={9}
              className="absolute -top-1 -left-2 text-emerald-300"
              style={{ animation: "sparkleFloat 1.6s ease-out 200ms both", filter: "drop-shadow(0 0 4px rgba(16,185,129,0.6))" }}
            />
            <Sparkles
              width={7}
              height={7}
              className="absolute -top-2 right-4 text-emerald-200"
              style={{ animation: "sparkleFloat 1.6s ease-out 500ms both", filter: "drop-shadow(0 0 4px rgba(16,185,129,0.6))" }}
            />
            <Sparkles
              width={8}
              height={8}
              className="absolute top-0 -right-2 text-emerald-300"
              style={{ animation: "sparkleFloat 1.6s ease-out 800ms both", filter: "drop-shadow(0 0 4px rgba(16,185,129,0.6))" }}
            />
          </div>
        </div>
      )}
    </AppFrame>
  );
}

/* ────────────────────── ÉTAPE 2 : Envoi du lien ────────────────────── */

function Step2_Send({ active }: { active: boolean }) {
  const [sent, setSent] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!active) { setSent(false); setShowStatus(false); return; }
    const t1 = setTimeout(() => setSent(true), 1800);
    const t2 = setTimeout(() => setShowStatus(true), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  return (
    <AppFrame>
      <div className="absolute inset-0 grid place-items-center px-5">
        <div className="relative w-full max-w-[420px]">
          {/* Email card */}
          <div
            className="rounded-2xl p-4 border border-white/[0.10]"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px -10px rgba(124,58,237,0.30)",
              transform: sent ? "translateY(-8px) scale(0.98)" : "translateY(0) scale(1)",
              opacity: sent ? 0.6 : 1,
              transition: "transform 700ms ease, opacity 700ms ease",
            }}
          >
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Mail width={13} height={13} className="text-violet-200" />
                <div className="text-[11px] font-semibold text-white">Email à Claire</div>
              </div>
              <div className="text-[10px] text-white/40 font-mono">14:32</div>
            </div>
            <div className="text-[11.5px] text-white/45 mb-1">À : claire.martin@email.fr</div>
            <div className="text-[12.5px] font-semibold text-white mb-3">
              Klaris · Vérification d'identité pour votre projet immobilier
            </div>
            <div className="text-[11.5px] text-white/65 leading-relaxed">
              Bonjour Claire, dans le cadre de votre projet d'acquisition, merci de remplir votre fiche
              en cliquant sur le lien sécurisé ci-dessous.
            </div>
            <div
              className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2 border"
              style={{
                background: "rgba(124,58,237,0.08)",
                borderColor: "rgba(124,58,237,0.25)",
              }}
            >
              <Lock width={11} height={11} className="text-violet-300" />
              <div className="flex-1 text-[10.5px] font-mono text-violet-200 truncate">
                klaris.fr/kyc/Yt8K…aB3z
              </div>
              <div className="text-[9px] text-white/40">↗</div>
            </div>
          </div>

          {/* "Sent" badge */}
          <div
            className="absolute left-1/2 -bottom-2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-1.5 border"
            style={{
              background: "rgba(16,185,129,0.12)",
              borderColor: "rgba(16,185,129,0.40)",
              color: "#6ee7b7",
              opacity: showStatus ? 1 : 0,
              transform: showStatus ? "translate(-50%, 0) scale(1)" : "translate(-50%, 6px) scale(0.9)",
              transition: "opacity 400ms, transform 400ms",
              boxShadow: "0 6px 18px rgba(16,185,129,0.30)",
            }}
          >
            <CheckCircle2 width={12} height={12} />
            <span className="text-[10.5px] font-semibold tracking-widest uppercase">Envoyé</span>
          </div>

          {/* "Sending" plane + trail de particules */}
          {sent && (
            <>
              <Send
                width={20}
                height={20}
                className="absolute text-violet-300"
                style={{
                  top: "30%",
                  left: "50%",
                  animation: "flyAway 900ms ease-out forwards",
                  filter: "drop-shadow(0 0 8px rgba(124,58,237,0.7))",
                }}
              />
              {/* Trail : 3 particules qui suivent avec délai */}
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{
                    top: "30%",
                    left: "50%",
                    background: i === 0 ? "#c4b5fd" : i === 1 ? "#a78bfa" : "#f0abfc",
                    animation: `flyAway 900ms ease-out ${i * 90}ms forwards, particleTrail 900ms ease-out ${i * 90}ms forwards`,
                    boxShadow: "0 0 8px rgba(124,58,237,0.6)",
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}

/* ────────────────────── ÉTAPE 3 : Mobile KYC ────────────────────── */

function Step3_Mobile({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  // phase 0 : début (header), 1 : identité OK, 2 : upload piece commence, 3 : upload OK, 4 : consentement

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 1300);
    const t2 = setTimeout(() => setPhase(2), 2800);
    const t3 = setTimeout(() => setPhase(3), 4900);
    const t4 = setTimeout(() => setPhase(4), 6200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 py-4 sm:py-6">
      {/* Halo derrière le téléphone */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 380, height: 380,
          background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Side info à gauche (desktop only) */}
      <div className="hidden lg:flex flex-col gap-3 mr-8 max-w-[180px]">
        <Smartphone width={20} height={20} className="text-violet-300" />
        <div className="text-[11px] uppercase tracking-widest text-white/40">Côté client</div>
        <div className="text-[15px] font-bold text-white leading-tight">Claire utilise son téléphone.</div>
        <div className="text-[11.5px] text-white/55 leading-relaxed">
          Le formulaire est mobile-first. Photo de la pièce, upload, signature RGPD — tout passe.
        </div>
      </div>

      {/* Phone frame (légère vibration au submit) */}
      <PhoneFrame shake={phase >= 4}>
        <div className="flex flex-col h-full bg-[#06070D]">
          {/* Status bar du tel */}
          <div className="px-4 pt-2 pb-1 flex items-center justify-between text-[8.5px] font-medium text-white/70">
            <span>14:34</span>
            <div className="flex items-center gap-1">
              <span>●●●●</span>
              <span>5G</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Top bar Klaris */}
          <div className="px-3 py-2 border-b border-white/[0.05] flex items-center gap-1.5">
            <KlarisLogo size={16} />
            <div className="text-[9.5px] font-bold text-white">Klaris</div>
            <div className="ml-auto text-[8px] text-white/40">KYC sécurisé</div>
          </div>

          {/* Contenu scrollable visuel */}
          <div className="flex-1 overflow-hidden">
            <div
              className="px-3 py-3 space-y-3"
              style={{
                transform: phase >= 2 ? "translateY(-40px)" : "translateY(0)",
                transition: "transform 700ms ease",
              }}
            >
              <div>
                <div className="text-[11px] font-bold text-white mb-0.5">Identification</div>
                <div className="text-[8.5px] text-white/45">Pour votre dossier chez votre agence</div>
              </div>

              {/* Champ nom */}
              <MobileField label="Nom et prénom" value="Claire Martin" filled />
              {/* Champ DDN — se remplit en phase 1 */}
              <MobileField
                label="Date de naissance"
                value="12 juin 1986"
                filled={phase >= 1}
                highlight={phase === 0}
              />

              {/* Pièces */}
              <div>
                <div className="text-[8.5px] uppercase tracking-widest text-white/45 font-semibold mb-1.5 mt-1">Pièces</div>
                <UploadRow
                  label="Pièce d'identité"
                  state={phase === 2 ? "uploading" : phase >= 3 ? "ok" : "idle"}
                />
                <UploadRow
                  label="Justificatif domicile"
                  state={phase >= 3 ? "uploading" : "idle"}
                />
              </div>

              {/* Consentement */}
              <div className="mt-2 space-y-1.5">
                <Checkbox label="J'autorise le traitement de mes données" checked={phase >= 4} />
                <Checkbox label="J'accepte la conservation 5 ans (LCB-FT)" checked={phase >= 4} />
              </div>
            </div>
          </div>

          {/* Bouton submit */}
          <div className="px-3 pb-3 pt-1 border-t border-white/[0.05]">
            <button
              className="w-full py-2 rounded-md text-white text-[10.5px] font-semibold inline-flex items-center justify-center gap-1.5 relative"
              style={{
                background: phase >= 4
                  ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                  : "rgba(124,58,237,0.25)",
                opacity: phase >= 4 ? 1 : 0.55,
                boxShadow: phase >= 4 ? "0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px rgba(124,58,237,0.40)" : "none",
                transition: "background 400ms, opacity 400ms",
              }}
            >
              Soumettre mon dossier
              {phase >= 4 && <Highlight active />}
            </button>
          </div>
        </div>
      </PhoneFrame>
    </div>
  );
}

function PhoneFrame({ children, shake = false }: { children: React.ReactNode; shake?: boolean }) {
  return (
    <div
      className="relative"
      style={{
        width: 220,
        height: 440,
        borderRadius: 32,
        padding: 7,
        background: "linear-gradient(180deg, #1a1a2e, #0d0d1f)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 30px 80px -20px rgba(124,58,237,0.40), 0 12px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.12) inset",
        animation: shake ? "phoneShake 500ms ease-in-out 1" : "none",
      }}
    >
      <div
        className="w-full h-full rounded-[26px] overflow-hidden relative"
        style={{ background: "#06070D" }}
      >
        {/* Notch */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black z-10"
        />
        {children}
      </div>
    </div>
  );
}

function MobileField({
  label, value, filled, highlight,
}: {
  label: string;
  value: string;
  filled: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="relative">
      <div className="text-[8px] uppercase tracking-widest text-white/45 font-semibold mb-1">{label}</div>
      <div
        className="px-2 py-1.5 rounded-md border text-[9.5px] transition-all"
        style={{
          background: filled ? "rgba(124,58,237,0.10)" : "rgba(255,255,255,0.03)",
          borderColor: filled ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.08)",
          color: filled ? "#fff" : "rgba(255,255,255,0.30)",
        }}
      >
        {filled ? value : "—"}
        {highlight && <Highlight active />}
      </div>
    </div>
  );
}

function UploadRow({ label, state }: { label: string; state: "idle" | "uploading" | "ok" }) {
  return (
    <div
      className="rounded-md px-2 py-1.5 mb-1.5 flex items-center gap-2 border"
      style={{
        background: state === "ok"
          ? "rgba(16,185,129,0.06)"
          : state === "uploading"
          ? "rgba(124,58,237,0.06)"
          : "rgba(255,255,255,0.02)",
        borderColor: state === "ok"
          ? "rgba(16,185,129,0.30)"
          : state === "uploading"
          ? "rgba(124,58,237,0.25)"
          : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-6 h-6 rounded grid place-items-center"
        style={{
          background: state === "ok" ? "rgba(16,185,129,0.18)" : "rgba(124,58,237,0.12)",
        }}
      >
        {state === "ok" ? (
          <Check width={10} height={10} className="text-emerald-300" strokeWidth={3} />
        ) : state === "uploading" ? (
          <Upload width={10} height={10} className="text-violet-200 animate-pulse" />
        ) : (
          <ImageIcon width={10} height={10} className="text-white/40" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-[9.5px] text-white truncate">{label}</div>
      {state === "uploading" && (
        <div className="w-10 h-1 rounded-full bg-white/10 overflow-hidden shrink-0">
          <div
            className="h-full"
            style={{
              animation: "uploadBar 1.4s ease-out forwards",
              background: "linear-gradient(90deg, #7c3aed, #ec4899)",
            }}
          />
        </div>
      )}
      {state === "ok" && (
        <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-300">OK</span>
      )}
    </div>
  );
}

function Checkbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      <div
        className="w-3 h-3 rounded grid place-items-center shrink-0 mt-0.5 border transition-all"
        style={{
          background: checked ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "rgba(255,255,255,0.03)",
          borderColor: checked ? "rgba(124,58,237,0.40)" : "rgba(255,255,255,0.20)",
        }}
      >
        {checked && <Check width={8} height={8} className="text-white" strokeWidth={4} />}
      </div>
      <div className="text-[8.5px] text-white/70 leading-tight">{label}</div>
    </div>
  );
}

/* ────────────────────── ÉTAPE 4 : Moteur de décision LCB-FT ──────────────────────
   Fidèle à la logique réelle de lib/tracfin.ts :
   1. Gates absolues (gel d'avoirs / sanctions) → ✓ aucune → on continue
   2. Critères de risque évalués un par un
   3. Décision parmi 4 niveaux qualitatifs (pas de score 0-100)
   ─────────────────────────────────────────────────────────────────────────────── */

function Step4_Score({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  // phase 0 : init
  // phase 1 : gates validées (no gel, no sanctions)
  // phase 2 : critères évalués
  // phase 3 : scan des 4 niveaux qui balaie
  // phase 4 : niveau choisi (verdict)

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 1100);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => setPhase(3), 3800);
    const t4 = setTimeout(() => setPhase(4), 4900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  const gates = [
    { icon: ShieldOff, label: "Gel d'avoirs", sub: "Règl. (UE) 2580/2001" },
    { icon: Ban, label: "Sanctions internationales", sub: "UE · ONU · Trésor" },
  ];

  const criteres = [
    { icon: Fingerprint, label: "Identité vérifiée", sub: "Pièce d'identité + nationalité" },
    { icon: Globe, label: "Géographie", sub: "France — hors zone GAFI" },
    { icon: BadgeCheck, label: "Origine des fonds", sub: "Épargne personnelle justifiée" },
    { icon: ShieldCheck, label: "Profil PPE", sub: "Aucune exposition politique" },
  ];

  // 4 niveaux dans l'ordre du CMF — l'algorithme va "balayer" pour choisir
  const niveaux = [
    {
      key: "standard",
      label: "Vigilance standard",
      ref: "L.561-5 à L.561-8",
      color: "#10b981",
      bgGlow: "rgba(16,185,129,0.10)",
      action: "Traiter normalement. Archivage 5 ans.",
    },
    {
      key: "renforcee",
      label: "Vigilance renforcée",
      ref: "L.561-10",
      color: "#fb923c",
      bgGlow: "rgba(251,146,60,0.10)",
      action: "Justificatifs additionnels requis.",
    },
    {
      key: "examen",
      label: "Examen renforcé",
      ref: "L.561-10-2",
      color: "#ef4444",
      bgGlow: "rgba(239,68,68,0.10)",
      action: "Suspension immédiate. Délibération.",
    },
    {
      key: "interdiction",
      label: "Interdiction & déclaration",
      ref: "L.561-15 + Règl. (UE) 2024/1624",
      color: "#7c3aed",
      bgGlow: "rgba(124,58,237,0.12)",
      action: "Refus + déclaration TRACFIN sous 48h.",
    },
  ];

  // L'algorithme converge vers le niveau 0 (vigilance_standard) pour le cas de Claire
  const chosenIdx = 0;

  // Toutes les validations (gates + critères) regroupées en une ligne de chips
  const validations = [
    { label: "Aucun gel d'avoirs", phase: 1 },
    { label: "Aucune sanction", phase: 1 },
    { label: "Identité vérifiée", phase: 2 },
    { label: "Géographie OK", phase: 2 },
    { label: "Origine des fonds OK", phase: 2 },
    { label: "Aucun PPE", phase: 2 },
  ];

  return (
    <AppFrame>
      <div className="absolute inset-0 flex flex-col gap-2.5 p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md grid place-items-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))",
              border: "1px solid rgba(124,58,237,0.35)",
              boxShadow: "0 0 18px rgba(124,58,237,0.30)",
            }}
          >
            <ScanSearch
              width={14}
              height={14}
              className="text-violet-200"
              style={{ animation: phase < 4 ? "rotateScan 2s linear infinite" : "none" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-violet-200">
              Moteur Klaris v2
            </div>
            <div className="text-[10px] text-white/40">Arbre de décision déterministe · CMF L.561</div>
          </div>
          {phase >= 3 && (
            <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 width={11} height={11} />
              Analyse OK
            </span>
          )}
        </div>

        {/* Validations en chips horizontaux */}
        <div className="flex flex-wrap gap-1.5">
          {validations.map((v, i) => {
            const done = phase >= v.phase;
            return (
              <span
                key={v.label}
                className="text-[10px] px-2 py-1 rounded-full border inline-flex items-center gap-1 transition-all duration-500"
                style={{
                  background: done ? "rgba(16,185,129,0.10)" : "rgba(255,255,255,0.03)",
                  borderColor: done ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.08)",
                  color: done ? "#6ee7b7" : "rgba(255,255,255,0.45)",
                  opacity: done ? 1 : 0.5,
                  transitionDelay: done ? `${i * 80}ms` : "0ms",
                }}
              >
                {done && <Check width={9} height={9} strokeWidth={3} />}
                {v.label}
              </span>
            );
          })}
        </div>

        {/* Section décision 4 niveaux */}
        <div className="text-[9px] uppercase tracking-widest text-white/45 font-semibold mt-1 flex items-center gap-1.5">
          <span>Décision · 4 niveaux CMF</span>
          {phase >= 4 && <CheckCircle2 width={10} height={10} className="text-emerald-400 ml-auto" />}
        </div>

        <div className="flex flex-col gap-1.5">
          {niveaux.map((n, i) => {
            const isChosen = phase >= 4 && i === chosenIdx;
            const isEliminated = phase >= 4 && i !== chosenIdx;
            return (
              <div
                key={n.key}
                className="relative rounded-md p-2 border flex items-center gap-2.5 transition-all duration-500"
                style={{
                  background: isChosen
                    ? n.bgGlow
                    : isEliminated
                    ? "rgba(255,255,255,0.015)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: isChosen
                    ? n.color
                    : isEliminated
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.08)",
                  opacity: isEliminated ? 0.32 : 1,
                  boxShadow: isChosen ? `0 0 24px ${n.bgGlow}` : "none",
                }}
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: isChosen ? n.color : "rgba(255,255,255,0.10)" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-semibold leading-tight flex items-center gap-2 flex-wrap"
                    style={{ color: isChosen ? n.color : "rgba(255,255,255,0.80)" }}
                  >
                    {n.label}
                    {isChosen && (
                      <span
                        className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: n.color, color: "#06070D" }}
                      >
                        Choisi
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] mt-0.5"
                    style={{ color: isChosen ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.40)" }}
                  >
                    CMF {n.ref}{isChosen && <> · {n.action}</>}
                  </div>
                </div>
                {isChosen && (
                  <Sparkles
                    width={12}
                    height={12}
                    className="shrink-0"
                    style={{
                      color: n.color,
                      animation: "twinkle 1.4s ease-in-out infinite",
                      filter: `drop-shadow(0 0 6px ${n.color})`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-1.5 border-t border-white/[0.05] flex items-center gap-1.5 text-[9px] text-white/40">
          <Clock width={10} height={10} />
          Décision rendue en 1,8 s · Algorithme déterministe v2.1 · Auditable
        </div>
      </div>
    </AppFrame>
  );
}

function GateRow({
  icon: Icon, label, sub, done, delay,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  label: string;
  sub: string;
  done: boolean;
  delay: number;
}) {
  return (
    <div
      className="flex items-center gap-2 transition-all duration-500"
      style={{
        transitionDelay: done ? `${delay}ms` : "0ms",
        opacity: done ? 1 : 0.4,
      }}
    >
      <div
        className="w-5 h-5 rounded grid place-items-center shrink-0 transition-all"
        style={{
          background: done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${done ? "rgba(16,185,129,0.40)" : "rgba(255,255,255,0.10)"}`,
        }}
      >
        {done
          ? <Check width={10} height={10} className="text-emerald-300" strokeWidth={3} />
          : <Icon width={9} height={9} className="text-white/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-white truncate">{label}</div>
        <div className="text-[8.5px] text-white/40 truncate">{sub}</div>
      </div>
      {done && (
        <span className="text-[7.5px] uppercase tracking-widest font-bold text-emerald-300 shrink-0">Aucun</span>
      )}
    </div>
  );
}

function CritereRow({
  icon: Icon, label, sub, done, delay,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  label: string;
  sub: string;
  done: boolean;
  delay: number;
}) {
  return (
    <div
      className="flex items-center gap-2 transition-all duration-500"
      style={{
        transitionDelay: done ? `${delay}ms` : "0ms",
        opacity: done ? 1 : 0.4,
        transform: done ? "translateX(0)" : "translateX(-4px)",
      }}
    >
      <div
        className="w-5 h-5 rounded grid place-items-center shrink-0 transition-all"
        style={{
          background: done ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${done ? "rgba(124,58,237,0.40)" : "rgba(255,255,255,0.10)"}`,
        }}
      >
        <Icon width={9} height={9} className={done ? "text-violet-200" : "text-white/40"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-white truncate">{label}</div>
        <div className="text-[8.5px] text-white/40 truncate">{sub}</div>
      </div>
      {done && (
        <span className="text-[7.5px] uppercase tracking-widest font-bold text-emerald-300 shrink-0">✓ Vert</span>
      )}
    </div>
  );
}

/* ────────────────────── ÉTAPE 5 : Attestation ────────────────────── */

function Step5_Attestation({ active }: { active: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [hashTyped, setHashTyped] = useState("");
  const [showDl, setShowDl] = useState(false);

  useEffect(() => {
    if (!active) { setRevealed(false); setHashTyped(""); setShowDl(false); return; }
    const t1 = setTimeout(() => setRevealed(true), 600);
    // hash typewriter
    const fullHash = "a1f7b2c8…3bc4";
    let i = 0;
    const tw = setInterval(() => {
      i++;
      setHashTyped(fullHash.slice(0, i));
      if (i >= fullHash.length) clearInterval(tw);
    }, 80);
    const t2 = setTimeout(() => setShowDl(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(tw); };
  }, [active]);

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 py-4 sm:py-6">
      {/* Halo */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 380, height: 380,
          background: "radial-gradient(circle, rgba(124,58,237,0.20), transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="hidden lg:flex flex-col gap-3 mr-6 max-w-[170px]">
        <FileText width={20} height={20} className="text-violet-300" />
        <div className="text-[11px] uppercase tracking-widest text-white/40">Sortie finale</div>
        <div className="text-[15px] font-bold text-white leading-tight">Attestation prête.</div>
        <div className="text-[11.5px] text-white/55 leading-relaxed">
          PDF horodaté, hash SHA-256, archivé 5 ans. Opposable en cas de contrôle.
        </div>
      </div>

      {/* PDF mockup */}
      <div
        className="relative w-full max-w-[360px]"
        style={{
          transform: revealed ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.95)",
          opacity: revealed ? 1 : 0,
          transition: "all 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Rayons radiants autour du PDF — effet "document officiel" */}
        {revealed && (
          <>
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: "radial-gradient(circle at center, rgba(124,58,237,0.20), transparent 60%)",
                animation: "radiantBurst 1.4s ease-out 200ms 1",
              }}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                animation: "radiantBurst 1.6s ease-out 200ms 1",
                mixBlendMode: "screen",
              }}
            >
              {/* 8 rayons partant du centre */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 360) / 8;
                return (
                  <line
                    key={i}
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="10"
                    stroke="url(#rayGrad)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    transform={`rotate(${angle} 50 50)`}
                    opacity="0.55"
                  />
                );
              })}
              <defs>
                <linearGradient id="rayGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="rgba(124,58,237,0)" />
                  <stop offset="60%" stopColor="rgba(124,58,237,0.7)" />
                  <stop offset="100%" stopColor="rgba(236,72,153,0.9)" />
                </linearGradient>
              </defs>
            </svg>
          </>
        )}

        <div
          className="relative rounded-xl overflow-hidden bg-white"
          style={{
            boxShadow: "0 30px 80px -20px rgba(124,58,237,0.50), 0 12px 30px -8px rgba(0,0,0,0.5)",
          }}
        >
          <div className="h-1.5" style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)" }} />
          <div className="p-4 text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <KlarisLogo size={20} />
                <div className="text-[11.5px] font-bold tracking-tight text-slate-900">Klaris</div>
                <div
                  className="px-1.5 py-0.5 rounded text-[7.5px] font-bold tracking-widest"
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    color: "#7c3aed",
                    border: "1px solid rgba(124,58,237,0.22)",
                  }}
                >
                  ATTESTATION
                </div>
              </div>
              <div className="text-right">
                <div className="text-[6.5px] uppercase tracking-widest text-slate-400 font-semibold">Dossier</div>
                <div className="text-[8.5px] font-bold font-mono text-slate-700">#a1f7b2c8</div>
              </div>
            </div>

            {/* Titre */}
            <div
              className="text-[15px] font-bold tracking-tight mb-2.5 leading-tight"
              style={{
                background: "linear-gradient(90deg, #1b1438 0%, #4c1d95 60%, #7c3aed 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Attestation de Conformité<br />LCB-FT
            </div>

            <div className="text-[9px] text-slate-500 mb-3">Claire Martin · Personne physique · 16 mai 2026</div>

            {/* Verdict */}
            <div
              className="rounded-lg p-2.5 mb-3 border"
              style={{
                background: "#ecfdf5",
                borderColor: "rgba(16,185,129,0.40)",
              }}
            >
              <div className="text-[7px] font-bold uppercase tracking-widest mb-0.5 text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Verdict · Niveau 1/4
              </div>
              <div className="text-[12px] font-bold tracking-tight text-emerald-700 mb-1.5">
                Vigilance standard
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: "100%", background: "linear-gradient(90deg,#059669,#10b981)" }} />
                </div>
                <div className="text-[10px] font-bold text-emerald-700">100 %</div>
              </div>
            </div>

            {/* SHA-256 */}
            <div className="flex items-center gap-1.5 mb-1.5 text-[8px] text-slate-500 relative">
              <Hash width={9} height={9} />
              <span className="font-semibold uppercase tracking-widest">SHA-256</span>
              <span className="font-mono text-slate-700 ml-auto">{hashTyped || "·"}</span>
            </div>

            {/* Stamp "Certifié" qui s'applique en bas-droit du PDF */}
            {hashTyped.length >= 5 && (
              <div
                className="absolute top-1/2 right-3 pointer-events-none"
                style={{
                  animation: "stampSeal 600ms ease-out 1 forwards",
                  transform: "translate(-50%, -50%) rotate(-12deg)",
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-md border-2 inline-flex items-center gap-1.5"
                  style={{
                    borderColor: "#7c3aed",
                    background: "rgba(124,58,237,0.06)",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.95) inset",
                  }}
                >
                  <BadgeCheck width={11} height={11} style={{ color: "#7c3aed" }} />
                  <span className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: "#7c3aed" }}>
                    Certifié
                  </span>
                </div>
              </div>
            )}

            {/* Critères */}
            <div className="space-y-1 pt-1.5 border-t border-slate-100">
              {["Identité vérifiée", "Origine des fonds", "Profil de risque"].map((l) => (
                <div key={l} className="flex items-center justify-between py-0.5">
                  <span className="text-[8.5px] text-slate-700">{l}</span>
                  <span
                    className="text-[6.5px] font-bold uppercase tracking-widest px-1 py-0.5 rounded bg-emerald-50 text-emerald-700"
                    style={{ border: "1px solid #a7f3d0" }}
                  >
                    ● Conforme
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download bubble */}
        {showDl && (
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-full flex items-center gap-2 border whitespace-nowrap"
            style={{
              background: "rgba(7,8,15,0.92)",
              borderColor: "rgba(124,58,237,0.40)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 12px 28px rgba(124,58,237,0.40)",
              animation: "slideUp 400ms ease both",
            }}
          >
            <Download width={12} height={12} className="text-violet-200" />
            <span className="text-[10.5px] font-semibold text-white">Téléchargé · Archivé 5 ans</span>
          </div>
        )}
      </div>

      {/* keyframes globales — partagés par toutes les étapes */}
      <style jsx global>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.55), 0 0 0 0 rgba(124,58,237,0.40); }
          70% { box-shadow: 0 0 0 6px rgba(124,58,237,0), 0 0 0 12px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0), 0 0 0 0 rgba(124,58,237,0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        @keyframes flyAway {
          0% { transform: translate(-50%, -50%) rotate(-12deg); opacity: 0.9; }
          100% { transform: translate(60px, -90px) rotate(20deg); opacity: 0; }
        }
        @keyframes uploadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes rotateScan {
          to { transform: rotate(360deg); }
        }
        @keyframes scanBeam {
          0% { top: -20%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          15% { transform: translateY(-2px) scale(1); opacity: 1; }
          85% { transform: translateY(-14px) scale(1); opacity: 0.85; }
          100% { transform: translateY(-22px) scale(0.5); opacity: 0; }
        }
        @keyframes cameraFlash {
          0% { opacity: 0; }
          12% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes phoneShake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-2px); }
          30%, 60%, 90% { transform: translateX(2px); }
        }
        @keyframes radiantBurst {
          0% { transform: scale(0.6); opacity: 0; }
          40% { opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes stampSeal {
          0% { transform: translate(-50%, -50%) scale(2.2) rotate(-18deg); opacity: 0; }
          60% { transform: translate(-50%, -50%) scale(0.95) rotate(-12deg); opacity: 0.95; }
          80% { transform: translate(-50%, -50%) scale(1.05) rotate(-12deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(-12deg); opacity: 1; }
        }
        @keyframes particleTrail {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
