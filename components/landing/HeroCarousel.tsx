// components/landing/HeroCarousel.tsx — Browser frame fixe avec slides horizontales narratives
//
// Architecture : un cadre type fenêtre navigateur Chrome reste fixe. À l'intérieur,
// les 3 slides se succèdent en glissant horizontalement. Captions explicites sous le
// cadre. Look "vraie app SaaS pro" style Linear / Vercel.

"use client";

import { useEffect, useState } from "react";
import { Play, Sparkles, ScanSearch } from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";

interface Slide {
  id: "dashboard" | "form" | "report";
  step: string;
  title: string;
  Component: React.FC;
  variant: "light" | "pdf";
}

const SLIDES: Slide[] = [
  {
    id: "dashboard",
    step: "01",
    title: "Pilotez tous vos dossiers KYC depuis un seul endroit",
    Component: DashboardMockup,
    variant: "light",
  },
  {
    id: "form",
    step: "02",
    title: "Verdict et marche à suivre, calculés automatiquement",
    Component: FormMockup,
    variant: "light",
  },
  {
    id: "report",
    step: "03",
    title: "Attestation PDF conforme, prête en un clic",
    Component: ReportMockup,
    variant: "pdf",
  },
];

const N = SLIDES.length;

export default function HeroCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hover) return;
    const id = setInterval(() => setActiveIdx((i) => (i + 1) % N), 8000);
    return () => clearInterval(id);
  }, [hover]);

  const openDemo = () => window.dispatchEvent(new Event("klaris:open-demo"));

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full flex flex-col items-center"
    >
      {/* Halo ambiant violet/magenta derrière le cadre */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.30) 0%, rgba(236,72,153,0.16) 35%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Browser frame (statique, plus cliquable — un bouton dédié est en dessous) */}
      <div
        className="relative w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{
          boxShadow: [
            "0 0 0 1px rgba(255,255,255,0.08)",
            "0 36px 90px -20px rgba(124,58,237,0.55)",
            "0 16px 36px -8px rgba(0,0,0,0.50)",
          ].join(", "),
        }}
      >
        {/* Top bar Chrome-like */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 relative z-10"
          style={{
            background: "linear-gradient(180deg, #f7f5fd 0%, #f1edf9 100%)",
            borderBottom: "1px solid rgba(124,58,237,0.10)",
          }}
        >
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "#fda4af" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#fcd34d" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#86efac" }} />
          </div>
          <div className="flex-1 text-center">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{
                background: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-[10.5px] font-mono" style={{ color: "#64748b" }}>
                klaris-app.fr
              </span>
            </div>
          </div>
          <span className="w-3 h-3" />
        </div>

        {/* Viewport — slides en horizontal */}
        <div
          className="relative overflow-hidden"
          style={{ background: "#fafaff", height: 410 }}
        >
          <div
            className="flex w-full h-full transition-transform duration-700"
            style={{
              transform: `translateX(-${activeIdx * 100}%)`,
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {SLIDES.map((slide) => {
              const Mockup = slide.Component;
              return (
                <div
                  key={slide.id}
                  className="shrink-0 w-full h-full overflow-hidden"
                  style={{ background: slide.variant === "pdf" ? "#ffffff" : "#fafaff" }}
                >
                  <Mockup />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Caption narrative + indicators + CTA démo (sous le cadre) */}
      <div className="mt-6 w-full max-w-[480px] flex flex-col items-center text-center px-4">
        <div
          key={activeIdx}
          className="text-[14px] sm:text-[15px] font-semibold text-white/90 transition-opacity duration-500 mb-3.5 min-h-[44px]"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
        >
          <span
            className="inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest align-middle"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "white",
            }}
          >
            {SLIDES[activeIdx].step}
          </span>
          {SLIDES[activeIdx].title}
        </div>

        <div className="flex gap-2 items-center mb-5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: activeIdx === i ? 32 : 8,
                background:
                  activeIdx === i
                    ? "linear-gradient(90deg,#7c3aed,#ec4899)"
                    : "rgba(255,255,255,0.30)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA dédié pour la démo guidée */}
        <button
          type="button"
          onClick={openDemo}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-[13.5px] text-white transition-transform hover:-translate-y-0.5 focus:outline-none"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 30px -8px rgba(124,58,237,0.55), 0 4px 12px -2px rgba(236,72,153,0.30)",
          }}
        >
          <Play className="w-3.5 h-3.5" fill="white" strokeWidth={0} />
          Voir la démo guidée
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1) DASHBOARD MOCKUP (light, reflète le vrai dashboard actuel)
   ═══════════════════════════════════════════════════════════════ */

function DashboardMockup() {
  return (
    <div style={{ background: "#fafaff", color: "#0f172a" }}>
      {/* Mini topbar Klaris */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <KlarisLogo size={22} />
          <span className="text-[12.5px] font-bold tracking-tight" style={{ color: "#0f172a" }}>Klaris</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-md text-[8.5px] uppercase tracking-widest font-bold"
          style={{
            background: "rgba(16,185,129,0.10)",
            border: "1px solid rgba(16,185,129,0.30)",
            color: "#047857",
          }}
        >
          12j d&apos;essai
        </span>
      </div>

      {/* Eyebrow + titre */}
      <div className="px-4 pt-3 pb-2">
        <div
          className="inline-block px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-semibold mb-1"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.18)",
            color: "#6d28d9",
          }}
        >
          ● Pilotage LCB-FT
        </div>
        <div className="text-[15px] font-bold tracking-tight" style={{ color: "#0f172a" }}>
          Tableau de bord
        </div>
      </div>

      {/* KPIs (2x2 mini) */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
        <MiniKpi label="Total" value="6" tone="accent" />
        <MiniKpi label="Conformes" value="3" tone="ok" />
        <MiniKpi label="Vigilance" value="2" tone="warn" />
        <MiniKpi label="Critique" value="1" tone="danger" />
      </div>

      {/* Liste de dossiers */}
      <div className="px-4 pb-4 flex flex-col gap-1.5">
        <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "#94a3b8" }}>
          Dossiers récents
        </div>
        <LightDossierRow nom="Martin Claire" type="Personne physique" statut="conforme" />
        <LightDossierRow nom="Durand Paul" type="Personne physique" statut="vigilance" />
        <LightDossierRow nom="ACME Holding SAS" type="Personne morale" statut="critique" />
      </div>
    </div>
  );
}

function MiniKpi({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone: "accent" | "ok" | "warn" | "danger";
}) {
  const cfg = {
    accent: { fg: "#6d28d9", bar: "linear-gradient(90deg,#7c3aed,#ec4899)" },
    ok:     { fg: "#047857", bar: "linear-gradient(90deg,#10b981,#34d399)" },
    warn:   { fg: "#b45309", bar: "linear-gradient(90deg,#f59e0b,#fbbf24)" },
    danger: { fg: "#b91c1c", bar: "linear-gradient(90deg,#dc2626,#ef4444)" },
  }[tone];
  return (
    <div
      className="relative rounded-lg p-2"
      style={{
        background: "white",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      <div className="absolute top-0 left-2 right-2 h-0.5 rounded-full" style={{ background: cfg.bar }} />
      <div className="text-[7.5px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#94a3b8" }}>{label}</div>
      <div className="text-[15px] font-bold tabular-nums" style={{ color: cfg.fg }}>{value}</div>
    </div>
  );
}

function LightDossierRow({
  nom, type, statut,
}: {
  nom: string;
  type: string;
  statut: "conforme" | "vigilance" | "critique";
}) {
  const cfg = {
    conforme:  { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.30)", color: "#047857", label: "Conforme" },
    vigilance: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)", color: "#b45309", label: "Vigilance renforcée" },
    critique:  { bg: "rgba(220,38,38,0.10)",  border: "rgba(220,38,38,0.30)",  color: "#b91c1c", label: "Critique" },
  }[statut];
  const initials = nom.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
      style={{
        background: "white",
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-7 h-7 rounded-full grid place-items-center text-[9.5px] font-bold shrink-0"
          style={{ background: "rgba(124,58,237,0.08)", color: "#6d28d9", border: "1px solid rgba(124,58,237,0.18)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold truncate" style={{ color: "#0f172a" }}>{nom}</div>
          <div className="text-[8.5px]" style={{ color: "#94a3b8" }}>{type}</div>
        </div>
      </div>
      <span
        className="px-1.5 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-widest whitespace-nowrap shrink-0"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2) DETAIL DOSSIER MOCKUP (light) — fidèle au vrai panneau detail
   Header dossier + Verdict niveau (NiveauDisc) + Action recommandée + Marche à suivre compacte
   ═══════════════════════════════════════════════════════════════ */

function FormMockup() {
  return (
    <div style={{ background: "#fafaff" }}>
      {/* Header dossier (avatar + nom + type) */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.08)" }}
      >
        <div
          className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-[11px] font-bold"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.20)",
            color: "#6d28d9",
          }}
        >
          MC
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-bold leading-tight" style={{ color: "#0f172a" }}>
            Martin Claire
          </div>
          <div className="text-[10px]" style={{ color: "#94a3b8" }}>
            Personne physique · Maj. il y a 2 h
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-bold whitespace-nowrap"
          style={{
            background: "rgba(16,185,129,0.10)",
            border: "1px solid rgba(16,185,129,0.30)",
            color: "#047857",
          }}
        >
          KYC reçu
        </span>
      </div>

      {/* Verdict niveau */}
      <div className="px-4 pt-3">
        <div
          className="text-[11px] font-bold mb-0.5"
          style={{ color: "#047857" }}
        >
          Vigilance standard — Conforme
        </div>
        <div className="text-[9px] mb-3" style={{ color: "#94a3b8" }}>
          CMF L.561-5 à L.561-8
        </div>

        <div className="flex items-center gap-3 mb-3">
          <NiveauDiscMock tone="success" />
          <div className="flex-1 min-w-0">
            <div className="text-[8.5px] uppercase tracking-widest font-bold mb-0.5" style={{ color: "#94a3b8" }}>
              Verdict
            </div>
            <div className="text-[10.5px] leading-snug" style={{ color: "#475569" }}>
              Traiter normalement. Archivage 5 ans.
            </div>
          </div>
        </div>
      </div>

      {/* Marche à suivre — version compacte type carte */}
      <div className="px-4 pb-4">
        <div
          className="rounded-lg p-3 border"
          style={{
            background: "rgba(16,185,129,0.06)",
            borderColor: "rgba(16,185,129,0.30)",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-7 h-7 rounded-md grid place-items-center shrink-0"
              style={{
                background: "rgba(16,185,129,0.14)",
                border: "1px solid rgba(16,185,129,0.30)",
              }}
            >
              <Sparkles width={13} height={13} style={{ color: "#047857" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8.5px] uppercase tracking-widest font-bold mb-0.5" style={{ color: "#047857", opacity: 0.75 }}>
                ✓ Marche à suivre terminée
              </div>
              <div className="text-[11px] font-semibold leading-tight" style={{ color: "#047857" }}>
                Aucune action particulière
              </div>
            </div>
          </div>

          {/* Mini stepper */}
          <div className="mt-2 flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex-1 h-1 rounded-full"
                style={{ background: "#10b981" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Boutons actions (style preview) */}
      <div className="px-4 pb-4 flex flex-col gap-1.5">
        <MiniActionBtn label="Ouvrir le dossier" primary icon={<ScanSearch width={11} height={11} />} />
        <MiniActionBtn label="Attestation PDF" />
        <MiniActionBtn label="Télécharger le dossier (ZIP)" />
      </div>
    </div>
  );
}

function NiveauDiscMock({ tone }: { tone: "success" | "warn" | "danger" }) {
  const cfg = {
    success: { from: "#10b981", to: "#34d399", glow: "rgba(16,185,129,0.35)" },
    warn:    { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.35)" },
    danger:  { from: "#dc2626", to: "#f43f5e", glow: "rgba(220,38,38,0.35)" },
  }[tone];
  return (
    <div
      className="rounded-full shrink-0 relative"
      style={{
        width: 44,
        height: 44,
        background: `linear-gradient(135deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
        boxShadow: `0 0 0 3px ${cfg.glow}, 0 4px 12px ${cfg.glow}, 0 1px 0 rgba(255,255,255,0.40) inset`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 5, left: 7, right: 7, height: 14,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.45), transparent)",
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function MiniActionBtn({
  label, primary, icon,
}: {
  label: string;
  primary?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold border"
      style={
        primary
          ? {
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              borderColor: "transparent",
              color: "white",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 4px 12px rgba(124,58,237,0.30)",
            }
          : {
              background: "white",
              borderColor: "rgba(15,23,42,0.10)",
              color: "#475569",
            }
      }
    >
      {icon}
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3) PDF MOCKUP (attestation, déjà sur fond blanc — on garde)
   ═══════════════════════════════════════════════════════════════ */

function ReportMockup() {
  return (
    <div className="relative overflow-hidden" style={{ background: "white" }}>
      {/* Bandeau dégradé top */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)" }} />

      <div className="relative p-5 text-slate-900" style={{ fontFamily: "Inter, sans-serif", color: "#0B0822" }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EDE9F4]">
          <div className="flex items-center gap-2">
            <KlarisLogo size={22} />
            <div className="text-[13px] font-extrabold tracking-tight">Klaris</div>
            <div
              className="ml-1 px-1.5 py-0.5 rounded-full text-[7.5px] font-bold tracking-[0.16em] uppercase"
              style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid #E5DBFB" }}
            >
              Attestation
            </div>
          </div>
          <div className="text-right">
            <div className="text-[7px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#7A7592" }}>Dossier</div>
            <div className="text-[9px] font-bold font-mono">#02919BCF</div>
          </div>
        </div>

        {/* Titre */}
        <h3
          className="text-[17px] font-extrabold tracking-tight leading-[1.1] mb-3"
          style={{
            backgroundImage: "linear-gradient(90deg, #1B1438 0%, #4C1D95 60%, #7C3AED 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Attestation de<br />Conformité LCB-FT
        </h3>

        {/* Verdict */}
        <div
          className="rounded-xl p-3 mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(#F2FBF7,#ECFDF5) padding-box, linear-gradient(135deg,#059669,#10B981 60%,#34D399) border-box",
            border: "1.5px solid transparent",
          }}
        >
          <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#047857" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
            Verdict · Niveau 1 / 4
          </div>
          <div className="text-[15px] font-extrabold tracking-tight" style={{ color: "#047857" }}>
            Dossier conforme
          </div>
          <div className="text-[10px] mt-1" style={{ color: "#047857", opacity: 0.85 }}>
            Traiter normalement. Archivage 5 ans.
          </div>
        </div>

        {/* Section critères */}
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#EDE9F4]">
          <span
            className="font-mono text-[7.5px] font-bold px-1.5 py-0.5 rounded text-white"
            style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
          >02</span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{
              backgroundImage: "linear-gradient(135deg,#7C3AED,#EC4899)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Détail des critères
          </span>
        </div>
        <div className="space-y-1">
          {[
            { name: "Bénéficiaires effectifs", sub: "Personne physique" },
            { name: "Résidence fiscale", sub: "France / UE" },
            { name: "Origine des fonds", sub: "Épargne — justifiée" },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between py-1">
              <div>
                <div className="text-[10px] font-semibold leading-tight" style={{ color: "#0B0822" }}>{c.name}</div>
                <div className="text-[8px] mt-0.5" style={{ color: "#7A7592" }}>{c.sub}</div>
              </div>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold tracking-[0.14em] uppercase whitespace-nowrap"
                style={{ background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: "#10B981" }} />
                Conforme
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[#EDE9F4] flex items-center justify-between">
          <span className="text-[7px] font-bold tracking-[0.16em] uppercase" style={{ color: "#7C3AED" }}>
            Document confidentiel
          </span>
          <span className="text-[7.5px] font-mono" style={{ color: "#7A7592" }}>SHA-256 · a1f7…3bc4</span>
        </div>
      </div>
    </div>
  );
}

