// app/api/billing/reactivate/route.ts — Réactivation 1-clic.
//
// Si l'utilisateur a cliqué "Annuler" mais que la période payée n'est pas encore
// écoulée, il peut **revenir en arrière** : on remet cancel_at_period_end=false.
// L'abonnement reprend son cours normal, sans interruption.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getScope } from "@/lib/scope";

export const runtime = "nodejs";

export async function POST() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const status = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });
  if (!status.stripeSubscriptionId) {
    return NextResponse.json({ error: "Aucun abonnement à réactiver." }, { status: 400 });
  }
  if (!status.cancelAtPeriodEnd) {
    return NextResponse.json({
      ok: true,
      message: "Votre abonnement est déjà actif (pas d'annulation en attente).",
      alreadyActive: true,
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    await stripe.subscriptions.update(status.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update DB direct (cf. commentaire dans /api/billing/cancel).
    if (scope.isOrgContext) {
      await sql`
        UPDATE subscriptions SET cancel_at_period_end = FALSE, updated_at = NOW()
        WHERE org_id = ${scope.orgId}
      `;
    } else {
      await sql`
        UPDATE subscriptions SET cancel_at_period_end = FALSE, updated_at = NOW()
        WHERE user_id = ${scope.userId} AND org_id IS NULL
      `;
    }

    return NextResponse.json({
      ok: true,
      message: "Abonnement réactivé. Le prochain renouvellement est rétabli.",
    });
  } catch (e) {
    console.error("Stripe reactivate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de réactivation" },
      { status: 500 },
    );
  }
}
