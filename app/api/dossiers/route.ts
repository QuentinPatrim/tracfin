// app/api/dossiers/route.ts — GET liste + POST création légère

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, nom_prenom, type_client, algo_version, niveau, statut, score_pct,
           date_detection, created_at, updated_at, kyc_status, email_contact
    FROM dossiers
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

interface CreateBody {
  typeClient: "physique" | "morale";
  nomPrenom: string;
  emailContact: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ─── Guard abonnement : pas de création de nouveau dossier si essai expiré ou abo inactif ─
  const sub = await getSubscriptionStatus(userId);
  if (!sub.isActive) {
    return NextResponse.json(
      {
        error: "subscription_required",
        message:
          sub.state === "expired"
            ? "Votre essai gratuit est terminé. Souscrivez à un abonnement pour créer de nouveaux dossiers."
            : "Un abonnement actif est requis pour créer un nouveau dossier.",
        state: sub.state,
        redirect: "/tarifs",
      },
      { status: 402 } // Payment Required
    );
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  if (!body.nomPrenom?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  if (!body.emailContact?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailContact)) {
    return NextResponse.json({ error: "Email valide requis" }, { status: 400 });
  }
  if (body.typeClient !== "physique" && body.typeClient !== "morale") {
    return NextResponse.json({ error: "Type client invalide" }, { status: 400 });
  }

  // Création du dossier minimal en statut "en attente du KYC"
  const dossierRows = await sql`
    INSERT INTO dossiers (user_id, type_client, nom_prenom, email_contact, kyc_status)
    VALUES (${userId}, ${body.typeClient}, ${body.nomPrenom}, ${body.emailContact}, 'sent')
    RETURNING id
  `;
  const dossierId = dossierRows[0].id as string;

  // Génère immédiatement le token KYC
  const token = randomBytes(18).toString("base64url");
  await sql`
    INSERT INTO kyc_links (dossier_id, user_id, token, status)
    VALUES (${dossierId}, ${userId}, ${token}, 'pending')
  `;

  return NextResponse.json({ id: dossierId, token }, { status: 201 });
}