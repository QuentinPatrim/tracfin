// app/api/integrations/[id]/route.ts — Révocation d'une clé

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope } from "@/lib/scope";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  // Ownership scope-aware
  const rows = scope.isOrgContext
    ? (await sql`
        SELECT id, status, label FROM crm_integrations
        WHERE id = ${id} AND org_id = ${scope.orgId} LIMIT 1
      `) as unknown as Array<{ id: string; status: string; label: string }>
    : (await sql`
        SELECT id, status, label FROM crm_integrations
        WHERE id = ${id} AND user_id = ${scope.userId} AND org_id IS NULL LIMIT 1
      `) as unknown as Array<{ id: string; status: string; label: string }>;

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rows[0].status === "revoked") {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  await sql`
    UPDATE crm_integrations
    SET status = 'revoked', revoked_at = NOW()
    WHERE id = ${id}
  `;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: null,
    action: "integration.revoke",
    metadata: { integration_id: id, label: rows[0].label },
    req,
  });

  return NextResponse.json({ ok: true });
}
