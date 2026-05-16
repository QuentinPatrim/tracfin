// app/api/webhooks/stripe/route.ts — Sync des événements Stripe vers notre table subscriptions

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscriptionFromStripe, planFromPriceId, type State, type Plan } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook non configuré" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // ⚠️ Stripe exige le payload brut pour vérifier la signature
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature failed:", e);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscription(sub);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await handleSubscription(sub);
        }
        break;
      }

      default:
        // Ignore les autres events (pas besoin pour notre logique)
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Plan = on regarde le 1er item de la subscription
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id;
  const plan: Plan | null = priceId ? planFromPriceId(priceId) : null;

  // Mapping Stripe status → notre State
  // (Stripe : trialing | active | past_due | canceled | unpaid | incomplete | incomplete_expired | paused)
  let state: State;
  switch (sub.status) {
    case "active": state = "active"; break;
    case "trialing": state = "active"; break;  // déjà payé même si en trial Stripe
    case "past_due": state = "past_due"; break;
    case "canceled": state = "canceled"; break;
    case "unpaid": state = "past_due"; break;
    case "incomplete": state = "incomplete"; break;
    case "incomplete_expired": state = "expired"; break;
    case "paused": state = "past_due"; break;
    default: state = "incomplete";
  }

  // current_period_end : Stripe API 2026-04-22 le met sur sub.items[0]
  const periodEnd =
    (firstItem as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;

  await upsertSubscriptionFromStripe({
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    state,
    plan,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}
