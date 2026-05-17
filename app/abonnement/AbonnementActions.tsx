// app/abonnement/AbonnementActions.tsx — Actions client (portail Stripe + changement de plan)

"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, ArrowRight, ExternalLink, Loader2, Lock } from "lucide-react";

interface Props {
  hasStripe: boolean;
  isTrialing: boolean;
  state: string;
}

export default function AbonnementActions({ hasStripe, isTrialing, state }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'ouvrir le portail");
      if (data.url) window.location.href = data.url;
      else throw new Error("URL invalide");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Bouton portail Stripe — désactivé pour essai (pas encore de customer Stripe) */}
      <button
        type="button"
        onClick={openPortal}
        disabled={!hasStripe || loading}
        className="rounded-xl p-5 text-left transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: hasStripe ? "linear-gradient(135deg, #7c3aed, #ec4899)" : "rgba(124,58,237,0.08)",
          borderColor: hasStripe ? "transparent" : "rgba(124,58,237,0.18)",
          color: hasStripe ? "white" : "#6d28d9",
          boxShadow: hasStripe ? "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 22px rgba(124,58,237,0.30)" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
            style={{
              background: hasStripe ? "rgba(255,255,255,0.15)" : "rgba(124,58,237,0.12)",
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : hasStripe ? (
              <Settings className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </div>
          {hasStripe && <ExternalLink className="w-4 h-4 mt-2 opacity-70" />}
        </div>
        <div className="font-bold text-[16px] leading-tight mb-1">
          {hasStripe ? "Gérer mon abonnement" : "Portail indisponible"}
        </div>
        <div
          className="text-[12.5px] leading-relaxed"
          style={{
            color: hasStripe ? "rgba(255,255,255,0.85)" : "rgba(109,40,217,0.75)",
          }}
        >
          {hasStripe
            ? "Factures, moyen de paiement, changement de plan, résiliation — tout dans l'espace sécurisé Stripe."
            : isTrialing
            ? "Disponible dès la souscription à un plan payant."
            : "Souscrivez à un plan pour accéder au portail."}
        </div>
      </button>

      {/* Bouton Changer de plan */}
      <Link
        href="/tarifs"
        className="rounded-xl p-5 transition-all border"
        style={{
          background: "white",
          borderColor: "rgba(15,23,42,0.10)",
          color: "#0f172a",
          textDecoration: "none",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
            style={{ background: "rgba(124,58,237,0.10)" }}
          >
            <ArrowRight className="w-5 h-5" style={{ color: "#6d28d9" }} />
          </div>
        </div>
        <div className="font-bold text-[16px] leading-tight mb-1">
          {state === "expired" || state === "incomplete"
            ? "Souscrire un plan"
            : isTrialing
            ? "Choisir un plan"
            : "Changer de plan"}
        </div>
        <div className="text-[12.5px] leading-relaxed" style={{ color: "#64748b" }}>
          Comparez les formules Pro et Agence, mensuel ou annuel.
        </div>
      </Link>

      {error && (
        <p className="sm:col-span-2 text-[12.5px] text-rose-600 font-medium mt-1">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
