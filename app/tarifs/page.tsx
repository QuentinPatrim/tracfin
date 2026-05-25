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
          {/* Badge "14 jours gratuits" très visible, bien au-dessus du titre */}
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(52,211,153,0.10))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 0 1px rgba(16,185,129,0.40), 0 1px 0 rgba(255,255,255,0.10) inset, 0 0 28px -4px rgba(16,185,129,0.40)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#10B981", boxShadow: "0 0 0 4px rgba(16,185,129,0.30)" }}
            />
            <span className="text-[12px] font-bold tracking-[0.14em] uppercase text-emerald-300">
              14 jours gratuits · annulable en 1 clic
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] mb-5 leading-[1.05]">
            Essayez Klaris,<br />
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
                backgroundSize: "200% 200%",
                animation: "gradShift 6s ease infinite",
              }}
            >
              sans engagement
            </span>
            .
          </h1>
          <p className="text-white/65 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            <strong className="text-white">Aucun prélèvement pendant 14 jours.</strong>{" "}
            Vous pouvez annuler à tout moment avant la fin de l'essai — vous ne serez pas débité.
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

        {/* Bandeau scope courant — visible uniquement si connecté */}
        {isSignedIn && (
          <div
            className="max-w-4xl mx-auto mb-4 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap text-[12px]"
            style={{
              background: isOrgContext
                ? "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(52,211,153,0.04))"
                : "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(168,85,247,0.04))",
              border: `1px solid ${isOrgContext ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.25)"}`,
            }}
          >
            {isOrgContext ? <Building2 className="w-3.5 h-3.5 text-emerald-300" /> : <User className="w-3.5 h-3.5 text-violet-300" />}
            <span className="text-white/85">
              Vous souscrivez en contexte{" "}
              <strong className={isOrgContext ? "text-emerald-300" : "text-violet-300"}>
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
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.06))",
              border: "1px solid rgba(16,185,129,0.30)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981", boxShadow: "0 0 0 4px rgba(16,185,129,0.20)" }} />
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-emerald-300">
                  {status.state === "trialing" ? "Essai gratuit en cours" : "Abonnement actif"}
                </div>
                <div className="text-sm text-white/80">
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
                className="px-4 py-2 rounded-full text-[12px] font-bold text-emerald-300 hover:text-emerald-200 transition flex items-center gap-2"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.35)" }}
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
            className="max-w-4xl mx-auto mt-8 rounded-2xl p-5 sm:p-6"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(52,211,153,0.03))",
              border: "1px solid rgba(16,185,129,0.20)",
            }}
          >
            <div className="grid sm:grid-cols-3 gap-5">
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
              a="Oui. Toutes les données sont hébergées en Europe (Scaleway Paris + Neon Frankfurt), chiffrées au repos (AES-256) et en transit (TLS 1.3). Conforme RGPD. Voir la page /securite pour le détail des certifications."
            />
            <FaqItem
              q="Comment fonctionne la limite de 15 dossiers du plan Pro ?"
              a="Le compteur se réinitialise au début de chaque cycle de facturation. Vous pouvez basculer vers le plan Agence à tout moment si vous avez besoin de plus — avec prorata appliqué."
            />
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
  name, tagline, priceMonthly, priceYearly, period, features, cta, onClick, popular = false, loading = false, isCurrent = false, isUpgrade = false,
}: {
  name: string; tagline: string; priceMonthly: number; priceYearly: number; period: Period;
  features: string[]; cta: string; onClick: () => void; popular?: boolean; loading?: boolean; isCurrent?: boolean; isUpgrade?: boolean;
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
          disabled={loading || isCurrent}
          className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-bold transition-transform hover:scale-[1.02] mb-2 disabled:opacity-60 disabled:cursor-default disabled:hover:scale-100"
          style={
            isCurrent
              ? {
                  background: "rgba(16,185,129,0.15)",
                  color: "#34D399",
                  boxShadow: "0 0 0 1px rgba(16,185,129,0.40), 0 1px 0 rgba(255,255,255,0.10) inset",
                }
              : popular
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
          {loading ? "Redirection…" : cta}
          {!loading && !isCurrent && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />}
          {isCurrent && <Check className="w-4 h-4" strokeWidth={3} />}
        </button>

        {/* Sous-texte explicatif : selon le contexte */}
        <div className="text-center text-[11px] mb-6 leading-snug" style={{ color: "rgba(255,255,255,0.50)" }}>
          {isCurrent ? (
            <span style={{ color: "rgba(52,211,153,0.85)" }}>✓ Vous êtes sur ce plan</span>
          ) : isUpgrade ? (
            <span>Prorata Stripe appliqué · pas de double facturation</span>
          ) : (
            <span>0 € aujourd'hui · {price}€/mois après 14 jours · annulable à tout moment</span>
          )}
        </div>

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

function BillingStep({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-emerald-300/85 mb-1.5">
        {step}
      </div>
      <div className="text-[15px] font-bold text-white mb-1">{title}</div>
      <div className="text-[12.5px] text-white/55 leading-relaxed">{desc}</div>
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