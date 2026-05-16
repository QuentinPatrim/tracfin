// components/landing/HeroCarousel.tsx — Carrousel 3 mockups en glass bubble v2

"use client";

import { useEffect, useState } from "react";
import { Mail, Send, ChevronRight, Play } from "lucide-react";

type Slide = "dashboard" | "form" | "report";

export default function HeroCarousel() {
  const [active, setActive] = useState<Slide>("dashboard");
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const order: Slide[] = ["dashboard", "form", "report"];
    const id = setInterval(() => {
      setActive((s) => order[(order.indexOf(s) + 1) % order.length]);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const openDemo = () => window.dispatchEvent(new Event("klaris:open-demo"));

  return (
    <button
      type="button"
      onClick={openDemo}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Voir la démo guidée"
      className="relative w-full h-[580px] flex items-center justify-center cursor-pointer group bg-transparent border-0 p-0 text-left"
    >
      {/* Hover overlay : Play badge centré */}
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300"
        style={{ opacity: hover ? 1 : 0 }}
      >
        <div
          className="flex items-center gap-2.5 px-5 py-3 rounded-full"
          style={{
            background: "rgba(7,8,15,0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: [
              "0 0 0 1px rgba(255,255,255,0.18)",
              "0 1px 0 rgba(255,255,255,0.18) inset",
              "0 20px 40px -10px rgba(168,85,247,0.5)",
            ].join(", "),
          }}
        >
          <Play className="w-4 h-4 text-white" fill="white" strokeWidth={0} />
          <span className="text-[13px] font-bold text-white tracking-tight">Voir la démo</span>
        </div>
      </div>
      {/* Halo ambiant violet/magenta derrière */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.30) 0%, rgba(99,102,241,0.18) 35%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Slide 1 : Dashboard */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          opacity: active === "dashboard" ? 1 : 0,
          transform: active === "dashboard" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          pointerEvents: active === "dashboard" ? "auto" : "none",
        }}
      >
        <DashboardMockup />
      </div>

      {/* Slide 2 : Form */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          opacity: active === "form" ? 1 : 0,
          transform: active === "form" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          pointerEvents: active === "form" ? "auto" : "none",
        }}
      >
        <FormMockup />
      </div>

      {/* Slide 3 : PDF */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          opacity: active === "report" ? 1 : 0,
          transform: active === "report" ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          pointerEvents: active === "report" ? "auto" : "none",
        }}
      >
        <ReportMockup />
      </div>

      {/* Indicateurs */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 items-center z-20">
        {(["dashboard", "form", "report"] as Slide[]).map((s) => (
          <span
            key={s}
            onClick={(e) => { e.stopPropagation(); setActive(s); }}
            role="button"
            className="h-1 rounded-full transition-all duration-300 cursor-pointer block"
            style={{
              width: active === s ? 28 : 6,
              background: active === s ? "linear-gradient(90deg,#6366F1,#A855F7,#EC4899)" : "rgba(255,255,255,0.2)",
            }}
            aria-label={`Slide ${s}`}
          />
        ))}
      </div>
    </button>
  );
}

/* --------- BUBBLE wrapper réutilisé pour toutes les cards mockups --------- */
function GlassBubble({ children, accent = "violet" }: { children: React.ReactNode; accent?: "violet" | "indigo" }) {
  const accentColor = accent === "violet" ? "168,85,247" : "99,102,241";
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] rounded-3xl p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.08)",
          "0 1px 0 rgba(255,255,255,0.18) inset",
          "0 -1px 0 rgba(0,0,0,0.20) inset",
          `0 30px 80px -20px rgba(${accentColor},0.40)`,
          "0 12px 30px -8px rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      {/* Highlight courbe en haut (faux reflet de lumière) */}
      <div
        className="absolute inset-x-6 top-0 h-px rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.30) 50%, transparent)",
        }}
      />
      {children}
    </div>
  );
}

/* --------- MOCKUPS --------- */

function DashboardMockup() {
  return (
    <GlassBubble accent="violet">
      <div className="flex items-center justify-between mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold">Mes dossiers KYC</div>
        <div className="text-[11px] text-white/30">3 dossiers</div>
      </div>

      <div className="flex flex-col gap-3">
        <DossierCard nom="Martin Claire" type="Personne physique" statut="valide" pct={100} kyc />
        <DossierCard nom="Durand Paul" type="Personne physique" statut="vigilance" pct={71} sent />
        <DossierCard nom="ACME Holding SAS" type="Personne morale" statut="critique" pct={42} />
      </div>
    </GlassBubble>
  );
}

function DossierCard({
  nom, type, statut, pct, kyc = false, sent = false,
}: {
  nom: string;
  type: string;
  statut: "valide" | "vigilance" | "critique";
  pct: number;
  kyc?: boolean;
  sent?: boolean;
}) {
  const cfg = {
    valide: { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.35)", glow: "rgba(52,211,153,0.30)", label: "Dossier valide" },
    vigilance: { color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)", glow: "rgba(251,146,60,0.30)", label: "Vigilance" },
    critique: { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)", glow: "rgba(248,113,113,0.30)", label: "Risque critique" },
  }[statut];

  return (
    <div
      className="relative rounded-2xl p-3.5 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.06)",
          "0 1px 0 rgba(255,255,255,0.10) inset",
          `0 8px 24px -8px ${cfg.glow}`,
        ].join(", "),
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-25 blur-2xl"
        style={{ background: cfg.color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-white/35 font-bold mb-0.5">{type}</div>
            <div className="text-sm font-bold text-white">{nom}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25" />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{
              background: cfg.bg,
              color: cfg.color,
              boxShadow: `0 0 0 1px ${cfg.border}, 0 0 12px -2px ${cfg.glow}`,
            }}
          >
            {cfg.label}
          </span>
          {kyc && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1"
              style={{
                background: "rgba(52,211,153,0.12)",
                boxShadow: "0 0 0 1px rgba(52,211,153,0.35), 0 0 12px -2px rgba(52,211,153,0.30)",
              }}
            >
              <Mail className="w-2.5 h-2.5" />
              KYC reçu
            </span>
          )}
          {sent && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1"
              style={{
                background: "rgba(99,102,241,0.12)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.35), 0 0 12px -2px rgba(99,102,241,0.30)",
              }}
            >
              <Send className="w-2.5 h-2.5" />
              KYC envoyé
            </span>
          )}
        </div>
        <div className="text-[10px] font-bold" style={{ color: cfg.color }}>
          {pct}% conforme
        </div>
      </div>
    </div>
  );
}

function FormMockup() {
  return (
    <GlassBubble accent="indigo">
      <div className="flex items-center gap-2 mb-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i <= 1 ? "text-white" : "text-white/40"
              }`}
              style={
                i <= 1
                  ? {
                      background: "linear-gradient(135deg, #6366F1, #A855F7)",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 16px rgba(139,92,246,0.5)",
                    }
                  : { background: "rgba(255,255,255,0.04)", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }
              }
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div className="flex-1 h-px bg-white/10 relative">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: i < 1 ? "100%" : "0%",
                    background: "linear-gradient(90deg, #6366F1, #A855F7)",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-base font-extrabold mb-1 tracking-tight">Analyse des risques</div>
      <div className="text-[11px] text-white/55 mb-4 leading-relaxed">
        Évaluez chaque facteur selon les critères LCB-FT.
      </div>

      <div
        className="rounded-xl p-4 mb-3"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.10) inset",
        }}
      >
        <div className="text-[9px] uppercase tracking-[0.15em] text-violet-300 font-bold mb-3">Profil client</div>
        <div className="space-y-2.5">
          <RiskRow label="Résidence fiscale" value="France / UE" risk="green" />
          <RiskRow label="Comportement" value="Réticent ou imprécis" risk="orange" />
          <RiskRow label="Origine des fonds" value="Épargne personnelle" risk="green" />
        </div>
      </div>

      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.10) inset",
        }}
      >
        <div className="text-[10px] uppercase tracking-widest text-white/45 font-bold">Score live</div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full"
              style={{ width: "70%", background: "#FB923C", boxShadow: "0 0 8px #FB923C" }}
            />
          </div>
          <div className="text-sm font-extrabold text-orange-400">70%</div>
        </div>
      </div>
    </GlassBubble>
  );
}

function RiskRow({ label, value, risk }: { label: string; value: string; risk: "green" | "orange" | "red" }) {
  const cfg = {
    green: { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.35)", glow: "rgba(52,211,153,0.30)", label: "Conforme" },
    orange: { color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)", glow: "rgba(251,146,60,0.30)", label: "Vigilance" },
    red: { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)", glow: "rgba(248,113,113,0.30)", label: "Critique" },
  }[risk];

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest text-white/35 font-bold">{label}</span>
        <span className="text-[11px] text-white/85">{value}</span>
      </div>
      <span
        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
        style={{
          background: cfg.bg,
          color: cfg.color,
          boxShadow: `0 0 0 1px ${cfg.border}, 0 0 12px -2px ${cfg.glow}`,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function ReportMockup() {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] rounded-xl overflow-hidden bg-white"
      style={{
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.08)",
          "0 30px 80px -20px rgba(168,85,247,0.50)",
          "0 12px 30px -8px rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      {/* Bandeau dégradé top — signature Klaris */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)" }} />

      {/* Glow ambient en coin (façon PDF maquette) */}
      <div
        className="absolute -right-16 -top-16 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.18), rgba(236,72,153,0.07) 60%, transparent 70%)" }}
      />

      <div className="relative p-6 text-slate-900" style={{ fontFamily: "Inter, sans-serif", color: "#0B0822" }}>
        {/* Header brand + meta */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDE9F4]">
          <div className="flex items-center gap-2.5">
            {/* Logo conique façon maquette */}
            <div className="relative w-7 h-7 rounded-full"
              style={{
                background: "conic-gradient(from 220deg, #7C3AED, #A855F7 30%, #EC4899 60%, #7C3AED)",
                boxShadow: "0 4px 12px rgba(124,58,237,0.30)",
              }}
            >
              <div className="absolute inset-[6px] rounded-full bg-white" />
              <div className="absolute inset-[9px] rounded-full" style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }} />
            </div>
            <div className="text-[15px] font-extrabold tracking-tight">Klaris</div>
            <div
              className="ml-1 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-[0.16em] uppercase"
              style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid #E5DBFB" }}
            >
              Attestation
            </div>
          </div>
          <div className="text-right">
            <div className="text-[7px] uppercase tracking-[0.18em] text-[#7A7592] font-semibold">Dossier</div>
            <div className="text-[10px] font-bold font-mono text-[#0B0822]">#02919BCF</div>
          </div>
        </div>

        {/* Titre dégradé + sceau */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className="text-[20px] font-extrabold tracking-tight leading-[1.1]"
            style={{
              backgroundImage: "linear-gradient(90deg, #1B1438 0%, #4C1D95 60%, #7C3AED 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Attestation de<br />Conformité LCB-FT
          </h3>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-bold tracking-[0.14em] uppercase whitespace-nowrap"
            style={{
              border: "1px dashed #C7B8F3",
              color: "#9333EA",
              background: "#FAF6FF",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C3AED", boxShadow: "0 0 0 3px rgba(124,58,237,0.18)" }} />
            Vérifié
          </span>
        </div>

        {/* Verdict box (bordure dégradée vert façon maquette) */}
        <div
          className="rounded-xl p-3 mb-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(#F2FBF7,#ECFDF5) padding-box, linear-gradient(135deg,#059669,#10B981 60%,#34D399) border-box",
            border: "1.5px solid transparent",
          }}
        >
          <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#047857" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
            Verdict · Niveau 1 / 4
          </div>
          <div className="text-[16px] font-extrabold tracking-tight mb-2" style={{ color: "#047857" }}>
            Dossier conforme
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(16,185,129,0.15)" }}>
              <div className="h-full" style={{
                width: "100%",
                background: "linear-gradient(90deg,#059669,#10B981)",
                boxShadow: "0 0 12px rgba(16,185,129,0.45)",
              }} />
            </div>
            <div className="text-[14px] font-extrabold" style={{ color: "#047857" }}>100%</div>
          </div>
        </div>

        {/* Section numérotée */}
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#EDE9F4]">
          <span
            className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded text-white tracking-[0.06em]"
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
            <div key={c.name} className="flex items-center justify-between py-1.5">
              <div>
                <div className="text-[10px] font-semibold text-[#0B0822] leading-tight">{c.name}</div>
                <div className="text-[8px] text-[#7A7592] mt-0.5">{c.sub}</div>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-bold tracking-[0.14em] uppercase whitespace-nowrap"
                style={{
                  background: "#ECFDF5",
                  color: "#047857",
                  border: "1px solid #A7F3D0",
                }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: "#10B981", boxShadow: "0 0 0 2px rgba(16,185,129,0.20)" }} />
                Conforme
              </span>
            </div>
          ))}
        </div>

        {/* Footer mini */}
        <div className="mt-3 pt-2.5 border-t border-[#EDE9F4] flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-bold tracking-[0.16em] uppercase"
            style={{ background: "#F5F0FF", color: "#7C3AED", border: "1px solid #E5DBFB" }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: "#7C3AED" }} />
            Document confidentiel
          </span>
          <span className="text-[8px] font-mono text-[#7A7592]">SHA-256 · a1f7…3bc4</span>
        </div>
      </div>
    </div>
  );
}