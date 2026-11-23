// app/abonnement/page.tsx — Page de gestion de l'abonnement utilisateur
// Affiche un récap visuel + redirige vers le Stripe Customer Portal pour gestion détaillée.
//
// Multi-tenant : la page reflète l'abonnement du SCOPE COURANT.
//  - Contexte perso → l'abo Pro de l'user.
//  - Contexte org   → l'abo Agence de l'org (qui couvre tous les membres).
// Pour basculer, l'utilisateur utilise le <OrganizationSwitcher /> du dashboard.

import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt, Sparkles, Calendar, Lock, AlertTriangle, Info, Check, Building2 } from "lucide-react";
import { getSubscriptionStatus, PLAN_LABELS, STATE_LABELS } from "@/lib/subscription";
import { getScope } from "@/lib/scope";
import AbonnementActions from "./AbonnementActions";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AbonnementPage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  const sub = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });

  // Récupère le nom de l'org pour l'afficher dans le contexte (Clerk API).
  let orgName: string | null = null;
  if (scope.orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: scope.orgId });
      orgName = org.name;
    } catch {
      orgName = "Organisation";
    }
  }

  // Détermine la tonalité du statut
  const tone =
    sub.state === "active" ? "ok"
    : sub.state === "trialing" ? "info"
    : sub.state === "past_due" || sub.state === "incomplete" ? "warn"
    : "danger";

  const toneColors = {
    ok:     { fg: "#0F7A4F", bg: "rgba(30,158,106,0.08)", border: "rgba(30,158,106,0.30)", dot: "#16A06A" },
    info:   { fg: "#1F45E0", bg: "rgba(47,91,255,0.08)", border: "rgba(47,91,255,0.30)", dot: "#2F5BFF" },
    warn:   { fg: "#8F5A00", bg: "rgba(227,160,8,0.08)", border: "rgba(227,160,8,0.30)", dot: "#D9980A" },
    danger: { fg: "#A3241F", bg: "rgba(197,48,44,0.08)", border: "rgba(197,48,44,0.30)", dot: "#C23630" },
  }[tone];

  return (
    <div
      className="k-app"
      style={{
        background: "#F5F7FF",
        minHeight: "100vh",
        fontFamily: "var(--font-sans-face), system-ui, sans-serif",
        color: "#0B1435",
      }}
    >

      {/* Header */}
      <header
        className="relative z-10"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(18px) saturate(170%)",
          WebkitBackdropFilter: "blur(18px) saturate(170%)",
          borderBottom: "1px solid rgba(47,91,255,0.10)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "#5B6487" }}
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
        {/* Eyebrow + titre — adapté au scope courant */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold mb-3"
            style={{
              background: scope.isOrgContext ? "rgba(30,158,106,0.08)" : "rgba(47,91,255,0.08)",
              border: `1px solid ${scope.isOrgContext ? "rgba(30,158,106,0.30)" : "rgba(47,91,255,0.18)"}`,
              color: scope.isOrgContext ? "#0F7A4F" : "#1F45E0",
            }}
          >
            {scope.isOrgContext ? (
              <>
                <Building2 className="w-3 h-3" />
                <span>Organisation · {orgName ?? scope.orgId}</span>
              </>
            ) : (
              <>
                <span className="w-1 h-1 rounded-full" style={{ background: "#2F5BFF" }} />
                <span>Espace personnel</span>
              </>
            )}
          </div>
          <h1
            className="text-[34px] font-bold tracking-tight"
            style={{
              color: "#0B1435",
            }}
          >
            {scope.isOrgContext ? `Abonnement ${orgName ?? "de l'organisation"}` : "Mon abonnement"}
          </h1>
          <p className="text-[14.5px] mt-2 leading-relaxed" style={{ color: "#5B6487" }}>
            {scope.isOrgContext
              ? "Plan Agence partagé par tous les membres. Seul un administrateur peut modifier l'abonnement."
              : "Gérez votre plan, vos factures, votre moyen de paiement et votre résiliation depuis l'espace sécurisé Stripe."}
          </p>
        </div>

        {/* Carte statut */}
        <div
          className="rounded-2xl p-6 sm:p-7 mb-5 border"
          style={{
            background: toneColors.bg,
            borderColor: toneColors.border,
            boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 4px 14px rgba(11,20,53,0.12)",
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
              <div className="text-[12px] font-semibold mb-1" style={{ color: toneColors.fg, opacity: 0.7 }}>
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
                background: "rgba(227,160,8,0.08)",
                border: "1px solid rgba(227,160,8,0.30)",
                color: "#7A4C00",
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
          cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
          hasActiveSubscription={!!sub.stripeSubscriptionId && (sub.state === "active" || sub.state === "trialing" || sub.state === "past_due")}
        />

        {/* Section : Comment fonctionne la facturation */}
        <section
          className="mt-8 rounded-2xl p-5 sm:p-6 border"
          style={{
            background: "rgba(255,255,255,0.65)",
            borderColor: "rgba(47,91,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4" style={{ color: "#1F45E0" }} />
            <h2 className="text-[14px] font-bold tracking-tight" style={{ color: "#0B1435" }}>
              Comment fonctionne la facturation
            </h2>
          </div>
          <ul className="space-y-3 text-[13px] leading-relaxed" style={{ color: "#47507A" }}>
            <BillingPoint title="Essai gratuit de 14 jours" desc="Lors de votre première souscription, Stripe ne vous prélève rien pendant 14 jours. La carte est enregistrée uniquement pour automatiser le renouvellement à la fin de l'essai." />
            <BillingPoint title="Premier prélèvement à J14" desc="Sauf annulation préalable, vous êtes prélevé du montant du plan choisi à la fin des 14 jours. Vous recevez un e-mail Stripe quelques jours avant pour vous prévenir." />
            <BillingPoint title="Annulation à tout moment, 1 clic" desc="Depuis cette page (bouton Annuler). Si vous annulez pendant l'essai, aucun débit n'est effectué. Si vous annulez après, vous gardez l'accès jusqu'à la fin de la période payée." />
            <BillingPoint title="Changement de plan avec prorata" desc="Passer de Pro à Agence (ou inverse) ne crée jamais de double facturation : Stripe calcule la différence au prorata des jours restants et l'applique automatiquement." />
            <BillingPoint title="Aucune donnée bancaire chez Klaris" desc="Tout transite directement vers Stripe (Dublin, Irlande). Aucun numéro de carte ni cryptogramme ne touche les serveurs de Klaris." />
          </ul>
        </section>

        {/* Info confidentialité */}
        <div
          className="mt-6 rounded-lg p-4 flex items-start gap-2.5 text-[12.5px]"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px dashed rgba(47,91,255,0.20)",
            color: "#47507A",
          }}
        >
          <Lock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#1F45E0" }} />
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
            style={{ color: "#98A0BD" }}
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

/* ─── BillingPoint (puce explicative) ───────────────────── */

function BillingPoint({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <div
        className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5"
        style={{
          background: "rgba(30,158,106,0.12)",
          border: "1px solid rgba(30,158,106,0.30)",
        }}
      >
        <Check className="w-3 h-3" style={{ color: "#0F7A4F" }} strokeWidth={3} />
      </div>
      <div>
        <div className="font-semibold text-[13px]" style={{ color: "#0B1435" }}>{title}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: "#5B6487" }}>{desc}</div>
      </div>
    </li>
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
        background: accent ? "rgba(227,160,8,0.08)" : "rgba(255,255,255,0.65)",
        border: `1px solid ${accent ? "rgba(227,160,8,0.30)" : "rgba(11,20,53,0.08)"}`,
      }}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-semibold mb-1" style={{ color: accent ? "#7A4C00" : "#98A0BD" }}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div
        className="text-[14px] font-semibold"
        style={{
          color: accent ? "#7A4C00" : "#0B1435",
          fontFamily: mono ? "var(--font-jetbrains-mono, ui-monospace, monospace)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
