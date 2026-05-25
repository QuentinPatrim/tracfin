// app/abonnement/AbonnementActions.tsx — Actions client : changer de plan, annuler / réactiver, portail Stripe
//
// L'annulation et la réactivation sont gérées **en 1 clic depuis Klaris**, sans
// rediriger l'utilisateur vers stripe.com. Le portail Stripe reste accessible
// (lien secondaire) pour la gestion fine : factures, méthode de paiement, etc.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, ArrowRight, ExternalLink, Loader2, Lock,
  XCircle, RotateCw, Receipt,
} from "lucide-react";

interface Props {
  hasStripe: boolean;
  isTrialing: boolean;
  state: string;
  /** A-t-il déjà demandé une annulation programmée ? */
  cancelAtPeriodEnd?: boolean;
  /** A-t-il une subscription Stripe active ? */
  hasActiveSubscription?: boolean;
}

export default function AbonnementActions({
  hasStripe, isTrialing, state, cancelAtPeriodEnd = false, hasActiveSubscription = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "portal" | "cancel" | "reactivate">(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'ouvrir le portail");
      if (data.url) window.location.href = data.url;
      else throw new Error("URL invalide");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setLoading(null);
    }
  };

  const cancelSubscription = async () => {
    const confirmMsg = isTrialing
      ? "Annuler votre essai gratuit ?\n\nVous ne serez pas prélevé. Vous gardez l'accès jusqu'à la fin de l'essai, puis l'accès aux fonctionnalités payantes sera coupé."
      : "Annuler votre abonnement ?\n\nVous gardez l'accès jusqu'à la fin de la période déjà payée. Aucun prélèvement supplémentaire ne sera effectué.";
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    setSuccessMessage(null);
    setLoading("cancel");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'annulation");
      setSuccessMessage(data.message || "Abonnement annulé.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const reactivateSubscription = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading("reactivate");
    try {
      const res = await fetch("/api/billing/reactivate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de réactivation");
      setSuccessMessage(data.message || "Abonnement réactivé.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Actions principales en grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Changer de plan — toujours accessible */}
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
              : hasActiveSubscription
                ? "Changer de plan (prorata appliqué)"
                : "Choisir un plan"}
          </div>
          <div className="text-[12.5px] leading-relaxed" style={{ color: "#64748b" }}>
            {hasActiveSubscription
              ? "Upgrade ou downgrade en 1 clic : Stripe calcule le prorata automatiquement."
              : "Comparez les formules Pro et Agence, mensuel ou annuel."}
          </div>
        </Link>

        {/* Annuler OU Réactiver, selon état */}
        {hasActiveSubscription && !cancelAtPeriodEnd && (
          <button
            type="button"
            onClick={cancelSubscription}
            disabled={loading !== null}
            className="rounded-xl p-5 text-left transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "white",
              borderColor: "rgba(220,38,38,0.18)",
              color: "#0f172a",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
                style={{ background: "rgba(220,38,38,0.08)" }}
              >
                {loading === "cancel" ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#dc2626" }} />
                ) : (
                  <XCircle className="w-5 h-5" style={{ color: "#dc2626" }} />
                )}
              </div>
            </div>
            <div className="font-bold text-[16px] leading-tight mb-1">
              {isTrialing ? "Annuler l'essai gratuit" : "Annuler mon abonnement"}
            </div>
            <div className="text-[12.5px] leading-relaxed" style={{ color: "#64748b" }}>
              {isTrialing
                ? "Aucun prélèvement. Accès conservé jusqu'à la fin de l'essai, puis bloqué."
                : "Aucun prélèvement supplémentaire. Accès conservé jusqu'à la fin de la période payée."}
            </div>
          </button>
        )}

        {hasActiveSubscription && cancelAtPeriodEnd && (
          <button
            type="button"
            onClick={reactivateSubscription}
            disabled={loading !== null}
            className="rounded-xl p-5 text-left transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderColor: "transparent",
              color: "white",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 22px rgba(16,185,129,0.30)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg grid place-items-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {loading === "reactivate" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCw className="w-5 h-5" />
                )}
              </div>
            </div>
            <div className="font-bold text-[16px] leading-tight mb-1">
              Réactiver mon abonnement
            </div>
            <div className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
              Annule la résiliation programmée. Vos prélèvements reprennent normalement.
            </div>
          </button>
        )}

        {/* Si pas de sub Stripe encore (essai initial Klaris, jamais souscrit) → bouton désactivé */}
        {!hasActiveSubscription && (
          <div
            className="rounded-xl p-5 border"
            style={{
              background: "rgba(124,58,237,0.06)",
              borderColor: "rgba(124,58,237,0.18)",
              color: "#6d28d9",
              opacity: 0.65,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: "rgba(124,58,237,0.12)" }}>
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div className="font-bold text-[16px] leading-tight mb-1">
              Annulation
            </div>
            <div className="text-[12.5px] leading-relaxed">
              Disponible dès que vous aurez souscrit à un plan.
            </div>
          </div>
        )}
      </div>

      {/* Lien secondaire vers le portail Stripe (factures, CB, etc.) */}
      {hasStripe && (
        <button
          type="button"
          onClick={openPortal}
          disabled={loading !== null}
          className="w-full rounded-xl p-4 transition-all border text-left flex items-center gap-3 disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.6)",
            borderColor: "rgba(15,23,42,0.08)",
            color: "#0f172a",
          }}
        >
          <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: "rgba(15,23,42,0.04)" }}>
            {loading === "portal" ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#64748b" }} />
            ) : (
              <Receipt className="w-4 h-4" style={{ color: "#64748b" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13.5px] mb-0.5">Factures & moyen de paiement</div>
            <div className="text-[11.5px] leading-relaxed" style={{ color: "#64748b" }}>
              Téléchargez vos factures, mettez à jour votre carte — espace sécurisé Stripe.
            </div>
          </div>
          <ExternalLink className="w-4 h-4 shrink-0" style={{ color: "#94a3b8" }} />
          <Settings className="w-3 h-3 shrink-0 opacity-0" />
        </button>
      )}

      {/* Feedback (succès / erreur) */}
      {successMessage && (
        <div
          className="rounded-lg p-3 text-[12.5px] font-medium border"
          style={{
            background: "rgba(16,185,129,0.08)",
            borderColor: "rgba(16,185,129,0.30)",
            color: "#047857",
          }}
        >
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div
          className="rounded-lg p-3 text-[12.5px] font-medium border"
          style={{
            background: "rgba(220,38,38,0.06)",
            borderColor: "rgba(220,38,38,0.30)",
            color: "#b91c1c",
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
