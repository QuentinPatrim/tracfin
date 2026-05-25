// app/api/dossiers/[id]/kyc-link/route.ts — Génère un lien KYC pour un dossier

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getScope, findScopedDossier } from "@/lib/scope";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Vérifie que le dossier appartient au scope ET n'est pas archivé.
  const dossier = await findScopedDossier<{ archived_at: string | null }>(
    id,
    scope,
    "archived_at",
  );
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) {
    return NextResponse.json({ error: "Dossier archivé" }, { status: 409 });
  }

  // Token aléatoire (24 caractères, sûr pour l'URL). expires_at explicite à 30j.
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO kyc_links (dossier_id, user_id, org_id, token, status, expires_at)
    VALUES (
      ${id}, ${scope.userId}, ${scope.orgId},
      ${token}, 'pending', ${expiresAt}
    )
  `;
  await sql`UPDATE dossiers SET kyc_status = 'sent' WHERE id = ${id}`;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "kyc.link.create",
    metadata: { expires_at: expiresAt },
    req,
  });

  return NextResponse.json({ token });
}
