// app/api/billing/change-plan/route.ts — Changement de plan (upgrade / downgrade) avec prorata.
//
// Logique :
//   - L'utilisateur a déjà une subscription Stripe (sinon → /api/checkout).
//   - On remplace l'item de la sub par le nouveau price ID.
//   - `proration_behavior: 'create_prorations'` :
//       • Upgrade  → Stripe calcule la différence de prix au prorata des jours
//                    restants et émet une **invoice supplémentaire** facturée
//                    immédiatement (avec la CB enregistrée).
//       • Downgrade → Stripe calcule un crédit au prorata des jours restants
//                     du plan supérieur ; ce crédit est appliqué sur la
//                     prochaine facture (jamais de remboursement).
//   - L'abonnement reste continu, pas d'annulation/recréation.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";
import {
  getSubscriptionStatus, priceIdForPlan, planFromPriceId,
  isAgencePlan, type Plan, type State,
} from "@/lib/subscription";
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

  // Cohérence scope ↔ plan : Agence dans un contexte perso (ou inversement) =
  // erreur. Le changement de plan se fait dans le scope qui le porte déjà.
  if (isAgencePlan(plan) && !scope.isOrgContext) {
    return NextResponse.json(
      { error: "Le plan Agence ne peut être souscrit qu'en contexte organisation." },
      { status: 400 },
    );
  }
  if (!isAgencePlan(plan) && scope.isOrgContext) {
    return NextResponse.json(
      { error: "Le plan Pro ne peut être souscrit qu'en contexte personnel." },
      { status: 400 },
    );
  }

  const newPriceId = priceIdForPlan(plan);
  if (!newPriceId) {
    return NextResponse.json({ error: `Price ID manquant pour ${plan}` }, { status: 500 });
  }

  const status = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });
  if (!status.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Aucun abonnement à modifier. Souscrivez d'abord.", code: "NO_SUBSCRIPTION" },
      { status: 400 },
    );
  }
  if (status.plan === plan) {
    return NextResponse.json(
      { error: "Vous êtes déjà sur ce plan.", code: "SAME_PLAN" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });

  try {
    // Récupère la subscription pour avoir l'ID du premier item (qu'on va remplacer)
    const sub = await stripe.subscriptions.retrieve(status.stripeSubscriptionId);
    const firstItemId = sub.items.data[0]?.id;
    if (!firstItemId) {
      return NextResponse.json({ error: "Subscription sans item" }, { status: 500 });
    }

    // Update : on change le price de l'item, prorata géré par Stripe.
    // `proration_behavior: 'create_prorations'` :
    //   - Upgrade → facture immédiate de la différence (créditée du restant du plan actuel)
    //   - Downgrade → crédit appliqué à la prochaine facture
    const updated = await stripe.subscriptions.update(status.stripeSubscriptionId, {
      items: [
        {
          id: firstItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
      // Si la sub est en trial, on ne casse pas le trial — on laisse Stripe gérer.
      metadata: { ...(sub.metadata ?? {}), plan },
    });

    // ⚠️ Update DB direct (cf. commentaire dans /api/billing/cancel) — pour que
    // l'UI reflète immédiatement le changement, sans attendre le webhook.
    const newFirstItem = updated.items.data[0];
    const newPriceIdFromStripe = newFirstItem?.price?.id;
    const newPlan: Plan | null = newPriceIdFromStripe ? planFromPriceId(newPriceIdFromStripe) : null;
    const periodEnd =
      (newFirstItem as unknown as { current_period_end?: number })?.current_period_end ??
      (updated as unknown as { current_period_end?: number }).current_period_end;
    let newState: State;
    switch (updated.status) {
      case "active": newState = "active"; break;
      case "trialing": newState = "trialing"; break;
      case "past_due": newState = "past_due"; break;
      case "canceled": newState = "canceled"; break;
      case "incomplete": newState = "incomplete"; break;
      default: newState = (status.state as State) ?? "active";
    }
    if (scope.isOrgContext) {
      await sql`
        UPDATE subscriptions SET
          plan = ${newPlan},
          state = ${newState},
          current_period_end = ${periodEnd ? new Date(periodEnd * 1000).toISOString() : null},
          cancel_at_period_end = ${updated.cancel_at_period_end},
          updated_at = NOW()
        WHERE org_id = ${scope.orgId}
      `;
    } else {
      await sql`
        UPDATE subscriptions SET
          plan = ${newPlan},
          state = ${newState},
          current_period_end = ${periodEnd ? new Date(periodEnd * 1000).toISOString() : null},
          cancel_at_period_end = ${updated.cancel_at_period_end},
          updated_at = NOW()
        WHERE user_id = ${scope.userId} AND org_id IS NULL
      `;
    }

    // Récupère la prochaine facture (ou la facture de prorata émise immédiatement)
    // pour donner un retour utilisateur précis.
    let prorationAmountCents: number | null = null;
    let prorationDirection: "upgrade" | "downgrade" | "neutral" = "neutral";
    try {
      const upcoming = await (
        stripe.invoices as unknown as {
          retrieveUpcoming: (params: { customer: string; subscription: string }) => Promise<Stripe.Invoice>;
        }
      ).retrieveUpcoming({
        customer: typeof updated.customer === "string" ? updated.customer : updated.customer.id,
        subscription: updated.id,
      });
      prorationAmountCents = upcoming.amount_due;
      prorationDirection = prorationAmountCents > 0 ? "upgrade" : prorationAmountCents < 0 ? "downgrade" : "neutral";
    } catch {
      // Pas critique si on n'arrive pas à récupérer l'upcoming
    }

    return NextResponse.json({
      ok: true,
      plan,
      message:
        prorationDirection === "upgrade"
          ? "Plan mis à niveau. Le complément au prorata est facturé immédiatement."
          : prorationDirection === "downgrade"
            ? "Plan rétrogradé. Le crédit au prorata sera appliqué à votre prochaine facture."
            : "Plan modifié.",
      prorationAmountCents,
      prorationDirection,
    });
  } catch (e) {
    console.error("Stripe change-plan error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de changement de plan" },
      { status: 500 },
    );
  }
}
