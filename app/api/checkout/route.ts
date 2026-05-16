// app/api/checkout/route.ts — Crée une Stripe Checkout Session pour un plan donné

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import {
  priceIdForPlan, getSubscriptionStatus, attachStripeCustomer,
  type Plan,
} from "@/lib/subscription";

export const runtime = "nodejs";

const VALID_PLANS: Plan[] = ["pro_monthly", "pro_yearly", "agence_monthly", "agence_yearly"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: `Price ID manquant pour ${plan}` }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  // Récupère ou crée le Stripe Customer pour cet user Clerk
  const status = await getSubscriptionStatus(userId);
  let stripeCustomerId = status.stripeCustomerId;

  if (!stripeCustomerId) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const customer = await stripe.customers.create({
      email,
      metadata: { clerk_user_id: userId },
    });
    stripeCustomerId = customer.id;
    await attachStripeCustomer(userId, stripeCustomerId);
  }

  // URL de base (Vercel ou local)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/tarifs?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: { clerk_user_id: userId, plan },
      subscription_data: {
        metadata: { clerk_user_id: userId, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur Stripe" },
      { status: 500 }
    );
  }
}
