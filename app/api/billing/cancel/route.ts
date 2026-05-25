// app/api/billing/cancel/route.ts — Annulation 1-clic de l'abonnement.
//
// Logique :
//   - Marque la subscription Stripe comme `cancel_at_period_end = true`.
//   - L'utilisateur conserve l'accès jusqu'à la fin de la période payée.
//   - Aucun prélèvement supplémentaire ne sera fait.
//   - Pendant un essai, l'annulation empêche le prélèvement de fin d'essai.
//   - Pas besoin de redirection vers le portail Stripe.

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
    return NextResponse.json({ error: "Aucun abonnement à annuler." }, { status: 400 });
  }

  if (status.cancelAtPeriodEnd) {
    return NextResponse.json({
      ok: true,
      message: "Votre abonnement est déjà programmé pour s'arrêter à la fin de la période.",
      alreadyCanceled: true,
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    const updated = await stripe.subscriptions.update(status.stripeSubscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: "Annulation in-app depuis Klaris.",
      },
    });

    // ⚠️ Update DB direct (sans attendre le webhook customer.subscription.updated).
    // En localhost / preview Vercel, le webhook n'est pas appelé par Stripe → la
    // table ne refléterait jamais l'annulation. En prod, le webhook ré-écrira la
    // même valeur quelques secondes plus tard : idempotent, aucun problème.
    if (scope.isOrgContext) {
      await sql`
        UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW()
        WHERE org_id = ${scope.orgId}
      `;
    } else {
      await sql`
        UPDATE subscriptions SET cancel_at_period_end = TRUE, updated_at = NOW()
        WHERE user_id = ${scope.userId} AND org_id IS NULL
      `;
    }

    const periodEnd =
      (updated.items.data[0] as unknown as { current_period_end?: number })?.current_period_end ??
      (updated as unknown as { current_period_end?: number }).current_period_end;

    return NextResponse.json({
      ok: true,
      message: status.isTrialing
        ? "Votre essai est annulé — aucun prélèvement ne sera effectué."
        : "Abonnement annulé. Vous conservez l'accès jusqu'à la fin de la période payée.",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    });
  } catch (e) {
    console.error("Stripe cancel error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur d'annulation" },
      { status: 500 },
    );
  }
}
