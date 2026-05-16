// lib/subscription.ts — Logique d'abonnement Klaris (essai 14j + Stripe)

import { sql } from "@/lib/db";

export type Plan = "pro_monthly" | "pro_yearly" | "agence_monthly" | "agence_yearly";

export type State =
  | "trialing"      // essai 14j en cours
  | "active"        // abonnement payant Stripe valide
  | "past_due"      // paiement échoué (grace ~3j Stripe)
  | "canceled"      // annulé (accès jusqu'à current_period_end)
  | "expired"       // essai écoulé sans abo, ou sub canceled + period_end passé
  | "incomplete";   // checkout commencé mais pas finalisé

export interface SubscriptionStatus {
  state: State;
  plan: Plan | null;
  isActive: boolean;          // accès aux fonctionnalités payantes
  isTrialing: boolean;
  daysLeft: number | null;    // jours restants (essai ou période courante)
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const TRIAL_DAYS = 14;

// ─── Mapping Stripe Price ID → Plan ──────────────────────────────────────
// Les Price IDs viennent des env vars (configurés depuis Stripe Dashboard).
export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro_monthly";
  if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return "pro_yearly";
  if (priceId === process.env.STRIPE_PRICE_AGENCE_MONTHLY) return "agence_monthly";
  if (priceId === process.env.STRIPE_PRICE_AGENCE_YEARLY) return "agence_yearly";
  return null;
}

export function priceIdForPlan(plan: Plan): string | null {
  const map: Record<Plan, string | undefined> = {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    agence_monthly: process.env.STRIPE_PRICE_AGENCE_MONTHLY,
    agence_yearly: process.env.STRIPE_PRICE_AGENCE_YEARLY,
  };
  return map[plan] ?? null;
}

// ─── Lecture / lazy-init ────────────────────────────────────────────────
interface Row {
  state: string;
  plan: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

/**
 * Récupère le statut d'abonnement pour un user Clerk.
 * Si pas de ligne existante → crée automatiquement un essai 14j à partir de NOW().
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const rows = (await sql`
    SELECT state, plan, trial_ends_at, current_period_end, cancel_at_period_end,
           stripe_customer_id, stripe_subscription_id
    FROM subscriptions WHERE user_id = ${userId} LIMIT 1
  `) as unknown as Row[];

  let row: Row;
  if (rows.length === 0) {
    // Lazy-init : premier accès → essai 14j
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const inserted = (await sql`
      INSERT INTO subscriptions (user_id, state, trial_ends_at)
      VALUES (${userId}, 'trialing', ${trialEnd.toISOString()})
      ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
      RETURNING state, plan, trial_ends_at, current_period_end, cancel_at_period_end,
                stripe_customer_id, stripe_subscription_id
    `) as unknown as Row[];
    row = inserted[0];
  } else {
    row = rows[0];
  }

  return computeStatus(row);
}

/** Calcul de l'état actuel à partir d'une row DB (peut différer de row.state si trial expiré sans update). */
function computeStatus(row: Row): SubscriptionStatus {
  const now = new Date();
  const trialEndsAt = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
  const currentPeriodEnd = row.current_period_end ? new Date(row.current_period_end) : null;

  // Détermine state effectif
  let effectiveState: State = row.state as State;

  // Si state = trialing mais trial expiré et pas de sub Stripe active → expired
  if (effectiveState === "trialing" && trialEndsAt && trialEndsAt < now) {
    effectiveState = "expired";
  }

  // Si state = active/past_due mais period_end dépassé et cancel_at_period_end → expired
  if (
    (effectiveState === "active" || effectiveState === "canceled") &&
    currentPeriodEnd && currentPeriodEnd < now
  ) {
    effectiveState = "expired";
  }

  const isTrialing = effectiveState === "trialing";
  const isActive =
    effectiveState === "trialing" ||
    effectiveState === "active" ||
    effectiveState === "past_due" ||
    (effectiveState === "canceled" && !!currentPeriodEnd && currentPeriodEnd > now);

  // Calcule jours restants
  let daysLeft: number | null = null;
  if (isTrialing && trialEndsAt) {
    daysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  } else if (currentPeriodEnd && (effectiveState === "active" || effectiveState === "past_due" || effectiveState === "canceled")) {
    daysLeft = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  }

  return {
    state: effectiveState,
    plan: (row.plan as Plan | null) ?? null,
    isActive,
    isTrialing,
    daysLeft,
    trialEndsAt,
    currentPeriodEnd,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

// ─── Mutations (utilisées par le webhook Stripe) ─────────────────────────

/** Récupère uniquement la date de vue du guide (NULL si jamais vu) */
export async function getSeenGuideAt(userId: string): Promise<Date | null> {
  const rows = (await sql`
    SELECT seen_guide_at FROM subscriptions WHERE user_id = ${userId} LIMIT 1
  `) as unknown as Array<{ seen_guide_at: string | null }>;
  if (rows.length === 0 || !rows[0].seen_guide_at) return null;
  return new Date(rows[0].seen_guide_at);
}

/** Marque le guide onboarding comme vu (au skip ou à la fin) */
export async function markGuideSeen(userId: string): Promise<void> {
  await sql`
    UPDATE subscriptions SET seen_guide_at = NOW(), updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function attachStripeCustomer(userId: string, stripeCustomerId: string) {
  await sql`
    UPDATE subscriptions
    SET stripe_customer_id = ${stripeCustomerId}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function upsertSubscriptionFromStripe(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  state: State;
  plan: Plan | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}) {
  const { stripeCustomerId, stripeSubscriptionId, state, plan, currentPeriodEnd, cancelAtPeriodEnd } = params;

  await sql`
    UPDATE subscriptions SET
      stripe_subscription_id = ${stripeSubscriptionId},
      state = ${state},
      plan = ${plan},
      current_period_end = ${currentPeriodEnd ? currentPeriodEnd.toISOString() : null},
      cancel_at_period_end = ${cancelAtPeriodEnd},
      updated_at = NOW()
    WHERE stripe_customer_id = ${stripeCustomerId}
  `;
}

// ─── Affichage UI : libellés ─────────────────────────────────────────────

export const PLAN_LABELS: Record<Plan, string> = {
  pro_monthly: "Pro · mensuel",
  pro_yearly: "Pro · annuel",
  agence_monthly: "Agence · mensuel",
  agence_yearly: "Agence · annuel",
};

export const STATE_LABELS: Record<State, string> = {
  trialing: "Essai gratuit",
  active: "Abonné",
  past_due: "Paiement en attente",
  canceled: "Annulé (accès jusqu'à la fin)",
  expired: "Abonnement expiré",
  incomplete: "Paiement incomplet",
};
