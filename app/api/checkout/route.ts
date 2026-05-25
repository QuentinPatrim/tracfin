// app/api/checkout/route.ts — Crée une Stripe Checkout Session pour un plan donné
//
// Multi-tenant :
//   - Plan Pro → souscription en contexte personnel (scope.orgId IS NULL).
//   - Plan Agence → souscription en contexte org : il faut un orgId actif ET
//     que l'appelant soit admin Clerk de cette org (le payeur Stripe = l'admin).
//   Métadonnée `clerk_org_id` portée jusqu'au webhook pour persister org_id.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser } from "@clerk/nextjs/server";
import {
  priceIdForPlan,
  getSubscriptionStatus,
  attachStripeCustomer,
  isAgencePlan,
  type Plan,
} from "@/lib/subscription";
import { EDITEUR } from "@/lib/legal";
import { getScope } from "@/lib/scope";

export const runtime = "nodejs";

const VALID_PLANS: Plan[] = ["pro_monthly", "pro_yearly", "agence_monthly", "agence_yearly"];

export async function POST(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const plan = body.plan as Plan | undefined;
  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // ─── Validation scope ↔ plan ──────────────────────────────────────────
  // Plan Agence : doit être souscrit dans le contexte d'une org Clerk, et
  // l'appelant doit en être admin (lui est l'ancre Stripe).
  if (isAgencePlan(plan)) {
    if (!scope.isOrgContext) {
      return NextResponse.json(
        {
          error: "agence_requires_org",
          message:
            "Le plan Agence se souscrit depuis le contexte d'une organisation. " +
            "Créez d'abord une organisation depuis le sélecteur en haut à droite, " +
            "puis réessayez.",
        },
        { status: 400 },
      );
    }
    if (scope.orgRole && !/admin/i.test(scope.orgRole)) {
      return NextResponse.json(
        {
          error: "admin_required",
          message: "Seul un administrateur de l'organisation peut souscrire un abonnement.",
        },
        { status: 403 },
      );
    }
  } else {
    // Plan Pro : doit être souscrit hors contexte org (sinon on créerait un abo
    // perso pour un user qui pilote une org — ambigu).
    if (scope.isOrgContext) {
      return NextResponse.json(
        {
          error: "pro_outside_org",
          message:
            "Le plan Pro est individuel. Sortez du contexte de l'organisation depuis " +
            "le sélecteur en haut à droite pour souscrire à titre personnel.",
        },
        { status: 400 },
      );
    }
  }

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: `Price ID manquant pour ${plan}` }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  // ─── Stripe Customer : 1 par scope. Lookup ou création. ────────────────
  const status = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });
  let stripeCustomerId = status.stripeCustomerId;

  if (!stripeCustomerId) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const customer = await stripe.customers.create({
      email,
      metadata: {
        clerk_user_id: scope.userId,
        clerk_org_id: scope.orgId ?? "",
      },
    });
    stripeCustomerId = customer.id;
    await attachStripeCustomer({ userId: scope.userId, orgId: scope.orgId }, stripeCustomerId);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production" ? EDITEUR.siteUrl : "http://localhost:3000");

  // ─── Cas 1 : sub Stripe déjà active sur ce scope → on bloque (upgrade in-place) ─
  if (
    status.stripeSubscriptionId &&
    (status.state === "active" || status.state === "trialing" || status.state === "past_due")
  ) {
    return NextResponse.json(
      {
        error: "Vous avez déjà un abonnement. Utilisez le changement de plan (prorata appliqué) depuis votre espace abonnement.",
        code: "ALREADY_SUBSCRIBED",
      },
      { status: 409 },
    );
  }

  // ─── Cas 2 : nouvelle Checkout Session ─────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/tarifs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: {
        clerk_user_id: scope.userId,
        clerk_org_id: scope.orgId ?? "",
        plan,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          clerk_user_id: scope.userId,
          clerk_org_id: scope.orgId ?? "",
          plan,
        },
      },
      payment_method_collection: "always",
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur Stripe" },
      { status: 500 },
    );
  }
}
