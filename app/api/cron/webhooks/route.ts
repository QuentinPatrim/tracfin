// app/api/cron/webhooks/route.ts — Dispatch des webhooks sortants (toutes les ~5 min)
//
// Protégé par Authorization: Bearer <CRON_SECRET> (injecté par Vercel Cron).

import { NextResponse } from "next/server";
import { dispatchPendingEvents } from "@/lib/outbound";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorize(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron/webhooks] CRON_SECRET non configuré — endpoint désactivé.");
    return false;
  }
  return (req.headers.get("authorization") ?? "") === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

  const summary = await dispatchPendingEvents(limit);
  return NextResponse.json({ ok: true, ...summary });
}
