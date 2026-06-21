// app/api/organisation/correspondants/route.ts — Gestion des correspondants LCB-FT
//
// GET    → liste des membres de l'org + flag correspondant
// POST   → désigne un membre comme correspondant (admin only)
// DELETE → retire un correspondant (admin only)

import { NextResponse } from "next/server";
import { getScope } from "@/lib/scope";
import { listOrgMembers, designateCorrespondant, removeCorrespondant } from "@/lib/correspondant";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(orgRole: string | null): boolean {
  return !!orgRole && /admin/i.test(orgRole);
}

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isOrgContext || !scope.orgId) {
    return NextResponse.json(
      { error: "org_required", message: "La désignation de correspondants n'a de sens qu'en contexte organisation." },
      { status: 400 },
    );
  }

  const members = await listOrgMembers(scope.orgId);
  return NextResponse.json({
    members,
    canManage: isAdmin(scope.orgRole),
    currentUserId: scope.userId,
  });
}

export async function POST(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isOrgContext || !scope.orgId) {
    return NextResponse.json({ error: "org_required" }, { status: 400 });
  }
  if (!isAdmin(scope.orgRole)) {
    return NextResponse.json({ error: "Seul un administrateur peut désigner un correspondant." }, { status: 403 });
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  // Vérifie que le userId est bien membre de l'org (sécurité)
  const members = await listOrgMembers(scope.orgId);
  if (!members.some((m) => m.userId === body.userId)) {
    return NextResponse.json({ error: "Cet utilisateur n'est pas membre de l'organisation." }, { status: 400 });
  }

  await designateCorrespondant(scope.orgId, body.userId, scope.userId);
  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: null,
    action: "correspondant.designate",
    metadata: { designated_user: body.userId },
    req,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.isOrgContext || !scope.orgId) {
    return NextResponse.json({ error: "org_required" }, { status: 400 });
  }
  if (!isAdmin(scope.orgRole)) {
    return NextResponse.json({ error: "Seul un administrateur peut retirer un correspondant." }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  await removeCorrespondant(scope.orgId, userId);
  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: null,
    action: "correspondant.remove",
    metadata: { removed_user: userId },
    req,
  });

  return NextResponse.json({ ok: true });
}
