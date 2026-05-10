// app/tarifs/page.tsx — Tarifs Klaris

"use client";

import { useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import FloatingNav from "@/components/landing/FloatingNav";

type Period = "monthly" | "yearly";

export default function TarifsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, period }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Erreur de paiement", e);
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: "#06070D", fontFamily: "Inter, sans-serif" }}
    >
      {/* Orbes ambiants */}
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 800, height: 800, top: -250, left: -180, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
      }} />
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 700, height: 700, bottom: -200, right: -150, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)",
      }} />
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 500, height: 500, top: "40%", left: "50%", zIndex: 0, filter: "blur(110px)",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)",
      }} />

      <FloatingNav />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 0 1px rgba(168,85,247,0.30), 0 1px 0 rgba(255,255,255,0.10) inset, 0 0 24px -4px rgba(168,85,247,0.40)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-200">Tarifs</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] mb-5 leading-[1.05]">
            Des tarifs simples,<br />
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
                backgroundSize: "200% 200%",
                animation: "gradShift 6s ease infinite",
              }}
            >
              transparents
            </span>
            .
          </h1>
          <p className="text-white/55 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Choisissez le plan adapté à votre volume. Sans engagement, annulable à tout moment.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div
            className="inline-flex p-1 rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset",
            }}
          >
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all ${
                period === "monthly" ? "bg-white text-slate-950 shadow-lg" : "text-white/60 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 ${
                period === "yearly" ? "bg-white text-slate-950 shadow-lg" : "text-white/60 hover:text-white"
              }`}
            >
              Annuel
              <span
                className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  period === "yearly" ? "bg-emerald-500/15 text-emerald-700" : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PlanCard
            name="Pro" tagline="Pour les conseillers indépendants"
            priceMonthly={29} priceYearly={23} period={period}
            features={[
              "Jusqu'à 15 dossiers KYC / mois",
              "Fiches Personne Physique & Morale",
              "Scoring Tracfin automatique",
              "Stockage sécurisé Cloudinary",
              "Export PDF des attestations",
              "Support email",
            ]}
            cta="Commencer" onClick={() => handleCheckout("pro")} loading={loading === "pro"}
          />
          <PlanCard
            name="Agence" tagline="Pour les agences immobilières"
            priceMonthly={89} priceYearly={71} period={period}
            popular
            features={[
              "Dossiers KYC illimités",
              "Multi-comptes (5 collaborateurs)",
              "Pré-remplissage automatique",
              "Hébergement EU sécurisé (RGPD)",
              "Export PDF design premium",
              "Support prioritaire",
              "API Webhook (à venir)",
            ]}
            cta="Choisir Agence" onClick={() => handleCheckout("agence")} loading={loading === "agence"}
          />
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-block mb-3 text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{
                background: "linear-gradient(90deg, #6366F1, #A855F7, #EC4899)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Questions fréquentes
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.025em]">
              Tout ce qu'il faut savoir
            </h2>
          </div>

          <div className="space-y-3">
            <FaqItem q="Puis-je annuler à tout moment ?" a="Oui, l'abonnement est sans engagement. Vous pouvez résilier en un clic depuis votre tableau de bord. Vous gardez l'accès jusqu'à la fin de la période payée." />
            <FaqItem q="Mes données sont-elles vraiment sécurisées ?" a="Oui. Toutes les données sont hébergées en Europe (Neon EU + Cloudinary EU), chiffrées au repos et en transit. Conforme RGPD. Vous pouvez exporter ou supprimer vos données à tout moment." />
            <FaqItem q="Comment fonctionne la limite de 15 dossiers du plan Pro ?" a="Le compteur se réinitialise au début de chaque cycle de facturation. Vous pouvez basculer vers le plan Agence à tout moment si vous avez besoin de plus." />
            <FaqItem q="Puis-je essayer avant de payer ?" a="Oui, vous pouvez créer un compte gratuitement et créer 2 dossiers test avant de choisir un plan. Aucune carte bancaire requise pour s'inscrire." />
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes gradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

function PlanCard({
  name, tagline, priceMonthly, priceYearly, period, features, cta, onClick, popular = false, loading = false,
}: {
  name: string; tagline: string; priceMonthly: number; priceYearly: number; period: Period;
  features: string[]; cta: string; onClick: () => void; popular?: boolean; loading?: boolean;
}) {
  const price = period === "monthly" ? priceMonthly : priceYearly;

  return (
    <div
      className="relative rounded-3xl p-8"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        boxShadow: popular
          ? [
              "0 0 0 1px rgba(168,85,247,0.40)",
              "0 1px 0 rgba(255,255,255,0.20) inset",
              "0 30px 80px -20px rgba(168,85,247,0.50)",
              "0 12px 30px -8px rgba(0,0,0,0.5)",
            ].join(", ")
          : [
              "0 0 0 1px rgba(255,255,255,0.08)",
              "0 1px 0 rgba(255,255,255,0.10) inset",
              "0 20px 40px -12px rgba(0,0,0,0.4)",
            ].join(", "),
        transform: popular ? "scale(1.03)" : undefined,
      }}
    >
      {/* Highlight top */}
      <div
        className="absolute inset-x-8 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.30) 50%, transparent)" }}
      />

      {popular && (
        <>
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] text-white"
            style={{
              background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
              backgroundSize: "200% 200%",
              animation: "gradShift 4s ease infinite",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.20) inset, 0 4px 20px rgba(168,85,247,0.60)",
            }}
          >
            Le plus populaire
          </div>
          <div
            className="absolute -top-20 -right-20 w-44 h-44 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #A855F7, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full opacity-30 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)" }}
          />
        </>
      )}

      <div className="relative">
        <div className="mb-1 text-[11px] font-bold tracking-[0.18em] uppercase text-white/50">{name}</div>
        <p className="text-white/40 text-sm mb-6">{tagline}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-5xl font-extrabold tracking-tight">{price}€</span>
          <span className="text-white/40 text-sm">/mois</span>
        </div>
        {period === "yearly" ? (
          <div className="text-[11px] text-emerald-400 font-semibold mb-6">
            Soit {price * 12}€/an, économisez {(priceMonthly - priceYearly) * 12}€
          </div>
        ) : (
          <div className="mb-6 h-[14px]" />
        )}

        <button
          onClick={onClick}
          disabled={loading}
          className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-bold transition-transform hover:scale-[1.02] mb-7 disabled:opacity-50 disabled:cursor-wait"
          style={
            popular
              ? {
                  background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
                  backgroundSize: "200% 200%",
                  animation: "gradShift 6s ease infinite",
                  color: "white",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.30) inset, 0 10px 30px rgba(168,85,247,0.50)",
                }
              : { background: "white", color: "#0F172A" }
          }
        >
          {loading ? "Redirection..." : cta}
          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />}
        </button>

        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-[13px] text-white/70">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={
                  popular
                    ? {
                        background: "rgba(168,85,247,0.20)",
                        boxShadow: "0 0 0 1px rgba(168,85,247,0.40), 0 0 8px rgba(168,85,247,0.30)",
                        color: "#C4B5FD",
                      }
                    : {
                        background: "rgba(52,211,153,0.15)",
                        boxShadow: "0 0 0 1px rgba(52,211,153,0.40), 0 0 8px rgba(52,211,153,0.20)",
                        color: "#34D399",
                      }
                }
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="group rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.08) inset",
      }}
    >
      <summary className="cursor-pointer px-6 py-5 font-bold text-[15px] tracking-tight flex items-center justify-between hover:bg-white/[0.03] transition list-none">
        {q}
        <span className="text-white/40 group-open:rotate-45 transition-transform text-2xl leading-none ml-4">+</span>
      </summary>
      <div className="px-6 pb-5 text-white/55 text-[14px] leading-relaxed">{a}</div>
    </details>
  );
}