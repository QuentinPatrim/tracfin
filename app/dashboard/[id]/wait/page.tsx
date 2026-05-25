// app/dashboard/[id]/wait/page.tsx — Vue "En attente du KYC"

import { notFound, redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import WaitingView from "./WaitingView";
import { getScope, findScopedDossier } from "@/lib/scope";
import type { Dossier } from "@/types/dossier";

export const dynamic = "force-dynamic";

export default async function WaitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scope = await getScope();
  if (!scope) return notFound();

  if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();

  const dossier = await findScopedDossier<Dossier>(id, scope);
  if (!dossier) return notFound();

  // Si déjà reçu, on bascule sur l'édition
  if (dossier.kyc_status === "received") {
    redirect(`/dashboard/${id}`);
  }

  // Récupère le token KYC actif (le plus récent non expiré, non complété)
  let linkRows = (await sql`
    SELECT token, status, opened_at, expires_at
    FROM kyc_links
    WHERE dossier_id = ${id} AND status != 'completed' AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `) as unknown as Array<{ token: string; status: string; opened_at: string | null; expires_at: string }>;

  // Aucun lien actif → on en regénère un, avec expires_at + scope explicites.
  if (linkRows.length === 0) {
    const token = randomBytes(18).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO kyc_links (dossier_id, user_id, org_id, token, status, expires_at)
      VALUES (${id}, ${scope.userId}, ${scope.orgId}, ${token}, 'pending', ${expiresAt})
    `;
    await sql`UPDATE dossiers SET kyc_status = 'sent' WHERE id = ${id}`;
    linkRows = [{ token, status: "pending", opened_at: null, expires_at: expiresAt }];
  }

  return (
    <WaitingView
      dossierId={id}
      nomPrenom={dossier.nom_prenom}
      emailContact={(dossier as Dossier & { email_contact?: string }).email_contact ?? null}
      token={linkRows[0].token}
      linkStatus={linkRows[0].status}
      openedAt={linkRows[0].opened_at}
      expiresAt={linkRows[0].expires_at}
    />
  );
}