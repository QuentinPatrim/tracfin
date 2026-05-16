// app/api/onboarding/seen/route.ts — marque le guide onboarding LCB-FT comme vu

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { markGuideSeen, getSubscriptionStatus } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // S'assure que la ligne subscription existe (lazy-init)
  await getSubscriptionStatus(userId);
  await markGuideSeen(userId);

  return NextResponse.json({ ok: true });
}
