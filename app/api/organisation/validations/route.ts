// app/api/organisation/validations/route.ts — File d'attente des validations (correspondant)

import { NextResponse } from "next/server";
import { getScope } from "@/lib/scope";
import { getPendingValidations, listOrgMembers, canValidate } from "@/lib/correspondant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!scope.isOrgContext || !scope.orgId) {
    return NextResponse.json({ isOrgContext: false, pending: [], canValidate: false, currentUserId: scope.userId });
  }

  const [pending, members, userCanValidate] = await Promise.all([
    getPendingValidations(scope.orgId),
    listOrgMembers(scope.orgId),
    canValidate(scope.userId, scope.orgId, scope.orgRole),
  ]);
  const nameMap = Object.fromEntries(members.map((m) => [m.userId, m.name]));

  return NextResponse.json({
    isOrgContext: true,
    currentUserId: scope.userId,
    canValidate: userCanValidate,
    pending: pending.map((p) => ({
      ...p,
      requested_by_name: nameMap[p.requested_by] ?? p.requested_by,
    })),
  });
}
