// app/dashboard/[id]/wait/page.tsx — Vue "En attente du KYC"

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import WaitingView from "./WaitingView";
import type { Dossier } from "@/types/dossier";

export const dynamic = "force-dynamic";

export default async function WaitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return notFound();

  if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();

  const rows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Dossier[];
  if (rows.length === 0) return notFound();
  const dossier = rows[0];

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

  // Aucun lien actif → on en regénère un
  if (linkRows.length === 0) {
    const token = randomBytes(18).toString("base64url");
    await sql`
      INSERT INTO kyc_links (dossier_id, user_id, token, status)
      VALUES (${id}, ${userId}, ${token}, 'pending')
    `;
    await sql`UPDATE dossiers SET kyc_status = 'sent' WHERE id = ${id}`;
    linkRows = [
      {
        token,
        status: "pending",
        opened_at: null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
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