// app/api/cartography/route.ts — Données de la cartographie des risques L.561-4-1
//
// GET /api/cartography?months=12 → JSON Cartography.
// Auth Clerk requise. Données scopées (perso ou org).

import { NextResponse } from "next/server";
import { computeCartography } from "@/lib/cartography";
import { getScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MONTHS = 12;
const MAX_MONTHS = 60; // 5 ans, alignement obligation conservation

export async function GET(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const monthsParam = Number(url.searchParams.get("months") ?? DEFAULT_MONTHS);
  const months = Number.isFinite(monthsParam)
    ? Math.min(Math.max(monthsParam, 1), MAX_MONTHS)
    : DEFAULT_MONTHS;

  const carto = await computeCartography(scope, months);

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: null,
    action: "cartography.view",
    metadata: { months, total_active: carto.totalActive },
    req,
  });

  return NextResponse.json(carto);
}
