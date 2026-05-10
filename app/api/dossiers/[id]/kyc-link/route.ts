// app/api/dossiers/[id]/kyc-link/route.ts — Génère un lien KYC pour un dossier

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Vérifie que le dossier appartient à l'utilisateur
  const dossiers = await sql`
    SELECT id FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (dossiers.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Token aléatoire (24 caractères, sûr pour l'URL)
  const token = randomBytes(18).toString("base64url");

  await sql`
    INSERT INTO kyc_links (dossier_id, user_id, token, status)
    VALUES (${id}, ${userId}, ${token}, 'pending')
  `;
  await sql`UPDATE dossiers SET kyc_status = 'sent' WHERE id = ${id}`;

  return NextResponse.json({ token });
}