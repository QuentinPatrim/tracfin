// app/api/billing/portal/route.ts — Redirige vers le Stripe Customer Portal
// L'utilisateur peut y gérer son abonnement (annuler, changer de plan, mettre à jour CB…)

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const status = await getSubscriptionStatus(userId);
  if (!status.stripeCustomerId) {
    return NextResponse.json(
      { error: "Aucun abonnement à gérer. Souscrivez d'abord." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: status.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe portal error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur Stripe Portal" },
      { status: 500 }
    );
  }
}
