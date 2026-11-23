// app/tarifs/page.tsx — Tarifs Klaris

"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, ArrowRight, Settings, Building2, User } from "lucide-react";
import { useAuth, useOrganizationList, useClerk } from "@clerk/nextjs";
import FloatingNav from "@/components/landing/FloatingNav";

type Period = "monthly" | "yearly";
type PlanKey = "pro" | "agence";

interface StatusResp {
  isActive: boolean;
  state: string;
  plan: string | null;
  daysLeft: number | null;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string | null;
  /** "personal" ou "org" — renvoyé par /api/subscription/status. */
  scope?: "personal" | "org";
}

// Pour le récap de facturation (date de fin de trial = première facturation)
function formatDateFromNow(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function TarifsPage() {
  const { isSignedIn, orgId } = useAuth();
  const { setActive, createOrganization } = useOrganizationList({ userMemberships: { infinite: false } });
  const { openSignUp } = useClerk();
  const [period, setPeriod] = useState<Period>("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Détermine le scope visible côté UI : contexte org actif ou perso.
  const isOrgContext = !!orgId;

  // Récupère l'état d'abonnement si connecté
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/subscription/status")
      .then((r) => r.ok ? r.json() : null)
      .then(setStatus)
      .catch(() => {});
  }, [isSignedIn]);

  const currentPlanKey: PlanKey | null = status?.plan
    ? (status.plan.startsWith("pro_") ? "pro" : "agence")
    : null;

  const hasActiveSubscription = !!status?.stripeSubscriptionId && (status?.state === "active" || status?.state === "trialing" || status?.state === "past_due");

  /**
   * Aiguillage intelligent :
   * - Plan Agence en contexte perso → demande de créer une org d'abord
   * - Plan Pro en contexte org → demande de sortir du contexte org
   * - Pas de sub Stripe → /api/checkout (création + trial 14j)
   * - Sub Stripe existante (active / trialing / past_due) → /api/billing/change-plan (prorata)
   */
  const handleSubscribe = async (plan: PlanKey) => {
    // Pas connecté → ouverture du sign-up direct (avec plan en metadata pour
    // pré-sélection après inscription).
    if (!isSignedIn) {
      openSignUp({ fallbackRedirectUrl: `/tarifs?plan=${plan}_${period}` });
      return;
    }

    // ─ Scope mismatch : Agence en perso → propose de créer une organisation ─
    if (plan === "agence" && !isOrgContext) {
      if (!createOrganization || !setActive) {
        alert("Le SDK Clerk n'est pas encore chargé, réessayez dans un instant.");
        return;
      }
      const orgName = window.prompt(
        "Nom de votre agence ? (ex: Delsol Immobilier)\n\n" +
        "Une organisation Klaris sera créée, vous en deviendrez l'administrateur, " +
        "et vous pourrez inviter vos collaborateurs ensuite.",
      );
      if (!orgName?.trim()) return;
      setCreatingOrg(true);
      try {
        const org = await createOrganization({ name: orgName.trim() });
        await setActive({ organization: org.id });
        // Recharge la page en contexte org puis l'utilisateur reclique
        window.location.href = `/tarifs?plan=agence_${period}&created=1`;
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erreur lors de la création de l'organisation");
        setCreatingOrg(false);
      }
      return;
    }

    // ─ Scope mismatch : Pro en org → propose de basculer en perso ─
    if (plan === "pro" && isOrgContext) {
      if (!setActive) return;
      const ok = window.confirm(
        "Le plan Pro est individuel. Voulez-vous basculer sur votre compte personnel " +
        "pour y souscrire ? (vous pourrez rebasculer sur l'organisation à tout moment)",
      );
      if (!ok) return;
      await setActive({ organization: null });
      window.location.href = `/tarifs?plan=pro_${period}`;
      return;
    }

    const fullPlan = `${plan}_${period === "monthly" ? "monthly" : "yearly"}`;
    setLoading(plan);
    try {
      if (hasActiveSubscription) {
        // Changement de plan — prorata Stripe
        if (!window.confirm(
          `Confirmer le changement de plan vers ${plan === "pro" ? "Pro" : "Agence"} (${period === "monthly" ? "mensuel" : "annuel"}) ?\n\n` +
          `Le prorata sera appliqué automatiquement par Stripe :\n` +
          `• Upgrade → différence facturée immédiatement\n` +
          `• Downgrade → crédit appliqué à la prochaine facture`,
        )) {
          setLoading(null);
          return;
        }
        const res = await fetch("/api/billing/change-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: fullPlan }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Erreur de changement de plan");
          setLoading(null);
          return;
        }
        alert(data.message || "Plan modifié.");
        window.location.reload();
      } else {
        // Nouvelle souscription — Checkout Session avec trial 14j
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: fullPlan }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || "Erreur de paiement");
          setLoading(null);
        }
      }
    } catch (e) {
      console.error("Erreur abonnement", e);
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert(data.error || "Erreur"); setLoading(null); }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div
      className="klaris-public min-h-screen relative overflow-x-hidden"
    >

      <FloatingNav />

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-12">
          <p className="kl-kicker mb-6">14 jours gratuits, annulable en un clic</p>
          <h1 className="kl-display mb-6" style={{ fontSize: "clamp(2.8rem, 1.6rem + 4.4vw, 5rem)" }}>
            Essayez Klaris, <em>sans engagement.</em>
          </h1>
          <p className="text-[color:var(--lp-text-3)] text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            <strong className="text-[color:var(--lp-text)]">Aucun prélèvement pendant 14 jours.</strong>{" "}
            Vous pouvez annuler à tout moment avant la fin de l'essai — vous ne serez pas débité.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div
            className="inline-flex p-1 rounded-[10px]"
            style={{ background: "var(--lp-surface-2)", boxShadow: "inset 0 0 0 1px var(--lp-border-1)" }}
          >
            <button
              onClick={() => setPeriod("monthly")}
              className={`px-5 py-2 rounded-[8px] text-[13.5px] font-semibold transition-all ${
                period === "monthly" ? "bg-[var(--lp-card-bg)] text-[color:var(--lp-text)] shadow-sm" : "text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-5 py-2 rounded-[8px] text-[13.5px] font-semibold transition-all flex items-center gap-2 ${
                period === "yearly" ? "bg-[var(--lp-card-bg)] text-[color:var(--lp-text)] shadow-sm" : "text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]"
              }`}
            >
              Annuel
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                  period === "yearly" ? "bg-[var(--lp-success-bg)] text-[color:var(--lp-success)]" : "bg-[var(--lp-success-bg)] text-[color:var(--lp-success)]"
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Bandeau scope courant — visible uniquement si connecté */}
        {isSignedIn && (
          <div
            className="max-w-4xl mx-auto mb-4 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap text-[12px]"
            style={{
              background: isOrgContext
                ? "var(--lp-success-bg)"
                : "var(--lp-card-bg-accent)",
              border: `1px solid ${isOrgContext ? "var(--lp-success-border)" : "var(--lp-card-border-accent)"}`,
            }}
          >
            {isOrgContext ? <Building2 className="w-3.5 h-3.5 text-[color:var(--lp-success)]" /> : <User className="w-3.5 h-3.5 text-[color:var(--lp-accent-text)]" />}
            <span className="text-[color:var(--lp-text-2)]">
              Vous souscrivez en contexte{" "}
              <strong className={isOrgContext ? "text-[color:var(--lp-success)]" : "text-[color:var(--lp-accent-text)]"}>
                {isOrgContext ? "organisation" : "personnel"}
              </strong>
              .{" "}
              {isOrgContext
                ? "Le plan Agence s'applique. Pour souscrire à titre personnel (Pro), basculez via le sélecteur en haut à droite."
                : "Le plan Pro s'applique. Pour l'Agence (multi-utilisateurs), créez d'abord une organisation."}
            </span>
          </div>
        )}

        {/* Status banner si abonnement actif */}
        {status?.isActive && currentPlanKey && (
          <div
            className="max-w-4xl mx-auto mb-6 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{
              background: "var(--lp-success-bg)",
              border: "1px solid var(--lp-success-border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--kl-v1)" }} />
              <div>
                <div className="text-[12.5px] font-semibold text-[color:var(--lp-success)]">
                  {status.state === "trialing" ? "Essai gratuit en cours" : "Abonnement actif"}
                </div>
                <div className="text-sm text-[color:var(--lp-text-2)]">
                  {status.state === "trialing"
                    ? `${status.daysLeft} jour${(status.daysLeft ?? 0) > 1 ? "s" : ""} restant${(status.daysLeft ?? 0) > 1 ? "s" : ""} dans votre essai`
                    : `Plan ${currentPlanKey === "pro" ? "Pro" : "Agence"}${status.plan?.endsWith("yearly") ? " · annuel" : " · mensuel"}`}
                </div>
              </div>
            </div>
            {status.state !== "trialing" && (
              <button
                onClick={handlePortal}
                disabled={loading === "portal"}
                className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-[color:var(--lp-success)] hover:text-[color:var(--lp-success)] transition flex items-center gap-2"
                style={{ background: "var(--lp-success-bg)", border: "1px solid var(--lp-success-border)" }}
              >
                <Settings className="w-3.5 h-3.5" />
                {loading === "portal" ? "Redirection…" : "Gérer mon abonnement"}
              </button>
            )}
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <PlanCard
            name="Pro" tagline="Pour les conseillers indépendants"
            priceMonthly={29} priceYearly={23} period={period}
            features={[
              "Jusqu'à 15 dossiers KYC / mois",
              "Fiches Personne Physique & Morale",
              "Scoring Tracfin automatique",
              "Stockage sécurisé Paris (Scaleway)",
              "Export PDF des attestations",
              "Support email",
            ]}
            cta={
              currentPlanKey === "pro"
                ? "Plan actuel"
                : isSignedIn && isOrgContext
                  ? "Basculer sur le compte perso"
                  : hasActiveSubscription
                    ? "Basculer sur Pro (prorata)"
                    : "Démarrer l'essai gratuit"
            }
            onClick={() => handleSubscribe("pro")}
            loading={loading === "pro" || creatingOrg}
            isCurrent={currentPlanKey === "pro"}
            isUpgrade={hasActiveSubscription}
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
            cta={
              currentPlanKey === "agence"
                ? "Plan actuel"
                : isSignedIn && !isOrgContext
                  ? "Créer mon organisation"
                  : hasActiveSubscription
                    ? "Basculer sur Agence (prorata)"
                    : "Démarrer l'essai gratuit"
            }
            onClick={() => handleSubscribe("agence")}
            loading={loading === "agence" || creatingOrg}
            isCurrent={currentPlanKey === "agence"}
            isUpgrade={hasActiveSubscription}
          />
        </div>

        {/* Explication de la facturation — sous les cards, bien visible */}
        {!hasActiveSubscription && (
          <div
            className="max-w-4xl mx-auto mt-14 pt-10 border-t"
            style={{ borderColor: "var(--lp-border-2)" }}
          >
            <div className="grid sm:grid-cols-3 gap-8">
              <BillingStep
                step="Aujourd'hui"
                title="0 €"
                desc="Aucun prélèvement. Vous renseignez votre carte uniquement pour l'auto-conversion à la fin de l'essai."
              />
              <BillingStep
                step={`Le ${formatDateFromNow(14)}`}
                title="Premier prélèvement"
                desc="Sauf annulation préalable, vous serez prélevé du montant du plan choisi. Vous gardez le contrôle."
              />
              <BillingStep
                step="À tout moment"
                title="Annulez en 1 clic"
                desc="Depuis votre espace abonnement, sans passer par le portail Stripe. Aucun frais si annulé avant la fin de l'essai."
              />
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="kl-kicker mb-5">Questions fréquentes</p>
            <h2 className="kl-display kl-h2">Tout ce qu&apos;il faut <em>savoir.</em></h2>
          </div>

          <div className="border-t" style={{ borderColor: "var(--lp-border-2)" }}>
            <FaqItem
              q="Quand est-ce que je suis prélevé ?"
              a="Pas avant la fin de l'essai de 14 jours. La carte est enregistrée à l'inscription uniquement pour automatiser le renouvellement. Aucun débit n'est effectué pendant les 14 premiers jours. Le premier prélèvement intervient à J14, sauf si vous annulez avant."
            />
            <FaqItem
              q="Puis-je annuler à tout moment ?"
              a="Oui — en 1 clic, directement dans Klaris (espace abonnement), sans passer par un portail externe. Si vous annulez pendant l'essai, vous n'êtes pas débité. Si vous annulez après, vous gardez l'accès jusqu'à la fin de la période payée."
            />
            <FaqItem
              q="Que se passe-t-il si je change de plan ?"
              a="Stripe applique automatiquement un prorata. Si vous montez de Pro à Agence à mi-mois, vous ne payez que la différence pour les jours restants. Si vous rétrogradez, le crédit est appliqué à votre prochaine facture (jamais de double facturation)."
            />
            <FaqItem
              q="Mes données sont-elles vraiment sécurisées ?"
              a="Les fiches et les pièces de vos clients sont hébergées dans l'Union européenne (Scaleway Paris + Neon Francfort), chiffrées au repos (AES-256) et en transit (TLS 1.3). Vos données de compte (e-mail, nom) passent par Clerk, société américaine. Conforme RGPD. Voir la page /securite pour le détail des certifications."
            />
            <FaqItem
              q="Comment fonctionne la limite de 15 dossiers du plan Pro ?"
              a="Le compteur se réinitialise au début de chaque cycle de facturation. Vous pouvez basculer vers le plan Agence à tout moment si vous avez besoin de plus — avec prorata appliqué."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function PlanCard({
  name, tagline, priceMonthly, priceYearly, period, features, cta, onClick, popular = false, loading = false, isCurrent = false, isUpgrade = false,
}: {
  name: string; tagline: string; priceMonthly: number; priceYearly: number; period: Period;
  features: string[]; cta: string; onClick: () => void; popular?: boolean; loading?: boolean; isCurrent?: boolean; isUpgrade?: boolean;
}) {
  const price = period === "monthly" ? priceMonthly : priceYearly;

  return (
    <div
      className="relative rounded-2xl p-8 sm:p-9 flex flex-col"
      style={{
        background: popular ? "var(--kl-night)" : "var(--lp-card-bg)",
        color: popular ? "var(--kl-on-field)" : undefined,
        boxShadow: popular
          ? "0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px -40px rgba(18,17,24,0.6)"
          : "0 0 0 1px var(--lp-border-2), 0 1px 2px rgba(18,17,24,0.04)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="kl-display text-[2rem] leading-none">{name.charAt(0) + name.slice(1).toLowerCase()}</div>
        {popular && (
          <span
            className="text-[12px] font-medium px-2.5 py-1 rounded-md"
            style={{ background: "rgba(255,255,255,0.08)", color: "var(--kl-on-field)" }}
          >
            Recommandé pour les agences
          </span>
        )}
      </div>
      <p className="mt-2 text-[14px]" style={{ color: popular ? "var(--kl-on-field-2)" : "var(--lp-text-3)" }}>{tagline}</p>

      <div className="flex items-baseline gap-1.5 mt-8">
        <span className="kl-display kl-num" style={{ fontSize: "4.25rem", lineHeight: 0.9 }}>{price} €</span>
        <span className="text-[14px]" style={{ color: popular ? "var(--kl-on-field-2)" : "var(--lp-text-4)" }}>/ mois</span>
      </div>
      {period === "yearly" ? (
        <div className="text-[12.5px] font-medium mt-3" style={{ color: popular ? "#7FD7AE" : "var(--lp-success)" }}>
          Soit {price * 12} €/an, économisez {(priceMonthly - priceYearly) * 12} €
        </div>
      ) : (
        <div className="mt-3 h-[18px]" />
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={loading || isCurrent}
        className={`kl-btn kl-btn--lg w-full mt-7 disabled:opacity-60 disabled:cursor-default ${popular ? "kl-btn--onfield" : "kl-btn--primary"}`}
        style={isCurrent ? { background: "var(--lp-success-bg)", color: "var(--lp-success)", boxShadow: "inset 0 0 0 1px var(--lp-success-border)" } : undefined}
      >
        {loading ? "Redirection…" : cta}
        {!loading && !isCurrent && <ArrowRight className="w-4 h-4 kl-arrow" />}
        {isCurrent && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>

      <div className="text-center text-[12px] mt-3 leading-snug" style={{ color: popular ? "var(--kl-on-field-3)" : "var(--lp-text-4)" }}>
        {isCurrent ? (
          <span style={{ color: popular ? "#7FD7AE" : "var(--lp-success)" }}>Vous êtes sur ce plan</span>
        ) : isUpgrade ? (
          <span>Prorata appliqué, pas de double facturation</span>
        ) : (
          <span>0 € aujourd&apos;hui · {price} €/mois après 14 jours · annulable à tout moment</span>
        )}
      </div>

      <ul className="mt-8 pt-7 space-y-3 border-t" style={{ borderColor: popular ? "var(--kl-on-field-line)" : "var(--lp-border-1)" }}>
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[14px]" style={{ color: popular ? "var(--kl-on-field-2)" : "var(--lp-text-2)" }}>
            <Check className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.5} style={{ color: popular ? "#fff" : "var(--lp-text)" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BillingStep({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="text-left">
      <div className="text-[12.5px] font-medium mb-2" style={{ color: "var(--lp-text-4)" }}>{step}</div>
      <div className="kl-display text-[1.6rem] leading-tight mb-2" style={{ color: "var(--lp-text)" }}>{title}</div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{desc}</div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b" style={{ borderColor: "var(--lp-border-2)" }}>
      <summary className="cursor-pointer py-6 font-semibold text-[16px] tracking-tight flex items-center justify-between list-none">
        {q}
        <span className="text-[color:var(--lp-text-4)] group-open:rotate-45 transition-transform text-2xl leading-none ml-4 font-light">+</span>
      </summary>
      <div className="pb-6 -mt-1 text-[color:var(--lp-text-3)] text-[15px] leading-relaxed max-w-[62ch]">{a}</div>
    </details>
  );
}
