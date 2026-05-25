// app/api/subscription/status/route.ts — Statut d'abonnement du scope courant

import { NextResponse } from "next/server";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getScope } from "@/lib/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });
  return NextResponse.json({
    state: status.state,
    plan: status.plan,
    isActive: status.isActive,
    isTrialing: status.isTrialing,
    daysLeft: status.daysLeft,
    trialEndsAt: status.trialEndsAt,
    currentPeriodEnd: status.currentPeriodEnd,
    cancelAtPeriodEnd: status.cancelAtPeriodEnd,
    stripeSubscriptionId: status.stripeSubscriptionId,
    // Indique au frontend quel scope est actif (utile pour afficher "abo perso"
    // vs "abo de l'org X").
    scope: scope.isOrgContext ? "org" : "personal",
  });
}
