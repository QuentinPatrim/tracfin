// app/api/subscription/status/route.ts — Renvoie le statut d'abonnement de l'utilisateur courant

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getSubscriptionStatus(userId);
  return NextResponse.json({
    state: status.state,
    plan: status.plan,
    isActive: status.isActive,
    isTrialing: status.isTrialing,
    daysLeft: status.daysLeft,
    trialEndsAt: status.trialEndsAt,
    currentPeriodEnd: status.currentPeriodEnd,
    cancelAtPeriodEnd: status.cancelAtPeriodEnd,
  });
}
