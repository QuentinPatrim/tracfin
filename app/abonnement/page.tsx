// app/abonnement/page.tsx — Page de gestion de l'abonnement utilisateur
// Affiche un récap visuel + redirige vers le Stripe Customer Portal pour gestion détaillée.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt, Sparkles, Calendar, Lock, AlertTriangle } from "lucide-react";
import { getSubscriptionStatus, PLAN_LABELS, STATE_LABELS } from "@/lib/subscription";
import AbonnementActions from "./AbonnementActions";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AbonnementPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const sub = await getSubscriptionStatus(userId);

  // Détermine la tonalité du statut
  const tone =
    sub.state === "active" ? "ok"
    : sub.state === "trialing" ? "info"
    : sub.state === "past_due" || sub.state === "incomplete" ? "warn"
    : "danger";

  const toneColors = {
    ok:     { fg: "#047857", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.30)", dot: "#10b981" },
    info:   { fg: "#6d28d9", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.30)", dot: "#7c3aed" },
    warn:   { fg: "#b45309", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.30)", dot: "#f59e0b" },
    danger: { fg: "#b91c1c", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.30)", dot: "#dc2626" },
  }[tone];

  return (
    <div
      style={{
        background: "#fafaff",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* Halos ambiants light */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          width: 600, height: 600, top: -200, left: -150,
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Header */}
      <header
        className="relative z-10"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(18px) saturate(170%)",
          WebkitBackdropFilter: "blur(18px) saturate(170%)",
          borderBottom: "1px solid rgba(124,58,237,0.10)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>
          <Link href="/" className="inline-flex items-center gap-2">
            <KlarisLogo size={28} />
            <span className="text-[14.5px] font-bold tracking-tight">Klaris</span>
          </Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* Eyebrow + titre */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest font-semibold mb-3"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.18)",
              color: "#6d28d9",
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: "#7c3aed" }} />
            Espace personnel
          </div>
          <h1
            className="text-[34px] font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #6d28d9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Mon abonnement
          </h1>
          <p className="text-[14.5px] mt-2 leading-relaxed" style={{ color: "#64748b" }}>
            Gérez votre plan, vos factures, votre moyen de paiement et votre résiliation
            depuis l'espace sécurisé Stripe.
          </p>
        </div>

        {/* Carte statut */}
        <div
          className="rounded-2xl p-6 sm:p-7 mb-5 border"
          style={{
            background: toneColors.bg,
            borderColor: toneColors.border,
            boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 4px 14px rgba(124,58,237,0.06)",
          }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-3 h-3 rounded-full mt-1.5 shrink-0"
              style={{
                background: toneColors.dot,
                boxShadow: `0 0 0 4px ${toneColors.border}`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: toneColors.fg, opacity: 0.7 }}>
                Statut
              </div>
              <div className="text-[24px] font-bold leading-tight" style={{ color: toneColors.fg }}>
                {STATE_LABELS[sub.state]}
              </div>
            </div>
          </div>

          {/* Grille d'infos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={Sparkles}
              label="Formule"
              value={sub.plan ? PLAN_LABELS[sub.plan] : "Aucune (essai gratuit)"}
            />
            {sub.isTrialing && sub.trialEndsAt && (
              <InfoRow
                icon={Calendar}
                label="Fin de l'essai"
                value={formatDate(sub.trialEndsAt)}
                accent={sub.daysLeft !== null && sub.daysLeft <= 3}
              />
            )}
            {sub.currentPeriodEnd && !sub.isTrialing && (
              <InfoRow
                icon={Calendar}
                label={sub.cancelAtPeriodEnd ? "Accès jusqu'au" : "Prochain renouvellement"}
                value={formatDate(sub.currentPeriodEnd)}
              />
            )}
            {sub.daysLeft !== null && (
              <InfoRow
                icon={Calendar}
                label="Jours restants"
                value={`${sub.daysLeft} jour${sub.daysLeft > 1 ? "s" : ""}`}
                accent={sub.daysLeft <= 3}
              />
            )}
            <InfoRow
              icon={CreditCard}
              label="Identifiant client Stripe"
              value={sub.stripeCustomerId ? `…${sub.stripeCustomerId.slice(-8)}` : "Non créé"}
              mono
            />
          </div>

          {sub.cancelAtPeriodEnd && (
            <div
              className="mt-4 rounded-lg p-3 flex items-start gap-2 text-[12.5px]"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.30)",
                color: "#92400e",
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Votre abonnement est <strong>annulé</strong>. Vous gardez l'accès jusqu'au{" "}
                <strong>{formatDate(sub.currentPeriodEnd)}</strong>, puis l'accès aux fonctionnalités
                payantes sera coupé.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <AbonnementActions
          hasStripe={!!sub.stripeCustomerId}
          isTrialing={sub.isTrialing}
          state={sub.state}
        />

        {/* Info confidentialité */}
        <div
          className="mt-6 rounded-lg p-4 flex items-start gap-2.5 text-[12.5px]"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px dashed rgba(124,58,237,0.20)",
            color: "#475569",
          }}
        >
          <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#6d28d9" }} />
          <span>
            La gestion de votre paiement (CB, prélèvement SEPA, factures, résiliation) se fait dans
            l'espace sécurisé <strong>Stripe</strong> (hébergement UE — Dublin). Aucune donnée bancaire
            ne transite ni n'est stockée par Klaris.
          </span>
        </div>

        {/* Récap factures (lien) */}
        <div className="mt-8 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium"
            style={{ color: "#94a3b8" }}
            disabled
            title="Disponible directement dans le portail Stripe"
          >
            <Receipt className="w-3.5 h-3.5" />
            Vos factures sont accessibles dans le portail Stripe ↑
          </button>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}

/* ─── InfoRow ───────────────────────────────────────────── */

function InfoRow({
  icon: Icon, label, value, mono, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: accent ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.65)",
        border: `1px solid ${accent ? "rgba(245,158,11,0.30)" : "rgba(15,23,42,0.08)"}`,
      }}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-semibold mb-1" style={{ color: accent ? "#92400e" : "#94a3b8" }}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div
        className="text-[14px] font-semibold"
        style={{
          color: accent ? "#92400e" : "#0f172a",
          fontFamily: mono ? "var(--font-jetbrains-mono, ui-monospace, monospace)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
