// components/landing/HeroCarousel.tsx — Carrousel 3 mockups en glass bubble v2

"use client";

import { useEffect, useState } from "react";
import { Mail, Send, ChevronRight } from "lucide-react";
import KlarisLogo from "@/components/ui/KlarisLogo";

type Slide = "dashboard" | "form" | "report";

export default function HeroCarousel() {
  const [active, setActive] = useState<Slide>("dashboard");

  useEffect(() => {
    const order: Slide[] = ["dashboard", "form", "report"];
    const id = setInterval(() => {
      setActive((s) => order[(order.indexOf(s) + 1) % order.length]);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-[580px] flex items-center justify-center">
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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 items-center">
        {(["dashboard", "form", "report"] as Slide[]).map((s) => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className="h-1 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: active === s ? 28 : 6,
              background: active === s ? "linear-gradient(90deg,#6366F1,#A855F7,#EC4899)" : "rgba(255,255,255,0.2)",
            }}
            aria-label={`Slide ${s}`}
          />
        ))}
      </div>
    </div>
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
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] rounded-2xl overflow-hidden"
      style={{
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.08)",
          "0 30px 80px -20px rgba(168,85,247,0.40)",
          "0 12px 30px -8px rgba(0,0,0,0.5)",
        ].join(", "),
      }}
    >
      <div className="bg-white text-slate-900 p-6 relative">
        {/* Highlight top */}
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-900">
          <div className="flex items-center gap-2">
            <KlarisLogo size={28} glow={false} />
            <div className="text-[15px] font-extrabold tracking-tight">Klaris</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">Dossier</div>
            <div className="text-[10px] font-bold">#02919BCF</div>
          </div>
        </div>

        <div className="text-[18px] font-extrabold tracking-tight mb-1">Attestation LCB-FT</div>
        <div className="text-[10px] text-slate-500 mb-4">Évaluation des risques de blanchiment</div>

        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: "#ECFDF5",
            boxShadow: "0 0 0 2px #34D399, 0 8px 24px -6px rgba(52,211,153,0.4)",
          }}
        >
          <div className="text-[8px] font-bold uppercase tracking-[0.2em] mb-1 text-emerald-700">
            Verdict de conformité
          </div>
          <div className="text-[16px] font-extrabold mb-2 tracking-tight text-emerald-700">
            Dossier Valide
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: "100%" }} />
            </div>
            <div className="text-[14px] font-extrabold text-emerald-700">100%</div>
          </div>
        </div>

        <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-violet-600 mb-2 pb-1.5 border-b border-slate-200">
          Détail par critère
        </div>
        <div className="space-y-1.5">
          {["Bénéficiaires effectifs", "Résidence fiscale", "Origine des fonds"].map((label) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-[10px] text-slate-700">{label}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Conforme
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}