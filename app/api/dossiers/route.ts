// app/api/dossiers/route.ts — GET liste + POST création légère
//
// Multi-tenant : la portée est résolue par lib/scope.ts. En contexte org, on
// liste tous les dossiers de l'org. En contexte perso, uniquement les dossiers
// individuels (org_id IS NULL) du user connecté.

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { getSubscriptionStatus } from "@/lib/subscription";
import { logAudit } from "@/lib/audit";
import { getScope } from "@/lib/scope";

// Pagination simple — évite le SELECT entier sur une base à plusieurs milliers de
// dossiers. Le dashboard affiche par 200 par défaut, c'est largement suffisant
// pour un agent immo et ça plafonne les coûts Neon en cas de runaway client.
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export async function GET(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const includeArchived = url.searchParams.get("archived") === "true";
  const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : DEFAULT_LIMIT;

  // En contexte org : tous les dossiers de l'org (peu importe qui les a créés).
  // En contexte perso : uniquement les dossiers persos du user (org_id IS NULL).
  const rows = scope.isOrgContext
    ? (includeArchived
        ? await sql`
            SELECT id, nom_prenom, type_client, partie, algo_version, niveau, statut, score_pct,
                   date_detection, created_at, updated_at, kyc_status, email_contact, archived_at
            FROM dossiers
            WHERE org_id = ${scope.orgId}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, nom_prenom, type_client, partie, algo_version, niveau, statut, score_pct,
                   date_detection, created_at, updated_at, kyc_status, email_contact, archived_at
            FROM dossiers
            WHERE org_id = ${scope.orgId} AND archived_at IS NULL
            ORDER BY created_at DESC
            LIMIT ${limit}
          `)
    : (includeArchived
        ? await sql`
            SELECT id, nom_prenom, type_client, partie, algo_version, niveau, statut, score_pct,
                   date_detection, created_at, updated_at, kyc_status, email_contact, archived_at
            FROM dossiers
            WHERE user_id = ${scope.userId} AND org_id IS NULL
            ORDER BY created_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, nom_prenom, type_client, partie, algo_version, niveau, statut, score_pct,
                   date_detection, created_at, updated_at, kyc_status, email_contact, archived_at
            FROM dossiers
            WHERE user_id = ${scope.userId} AND org_id IS NULL AND archived_at IS NULL
            ORDER BY created_at DESC
            LIMIT ${limit}
          `);
  return NextResponse.json(rows);
}

interface CreateBody {
  typeClient: "physique" | "morale";
  partie: "vendeur" | "acquereur";
  nomPrenom: string;
  emailContact: string;
}

export async function POST(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ─── Guard abonnement : pas de création si l'org / le user n'a pas d'abo actif ─
  const sub = await getSubscriptionStatus({ userId: scope.userId, orgId: scope.orgId });
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
      { status: 402 }, // Payment Required
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
  if (body.partie !== "vendeur" && body.partie !== "acquereur") {
    return NextResponse.json({ error: "Partie invalide (vendeur|acquereur)" }, { status: 400 });
  }

  // Création du dossier minimal en statut "en attente du KYC".
  // user_id = créateur réel (utile pour audit). org_id = scope.orgId si en org.
  const dossierRows = await sql`
    INSERT INTO dossiers (user_id, org_id, type_client, partie, nom_prenom, email_contact, kyc_status)
    VALUES (
      ${scope.userId}, ${scope.orgId},
      ${body.typeClient}, ${body.partie},
      ${body.nomPrenom}, ${body.emailContact}, 'sent'
    )
    RETURNING id
  `;
  const dossierId = dossierRows[0].id as string;

  // Génère immédiatement le token KYC, expires_at à 30 jours, scope hérité.
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO kyc_links (dossier_id, user_id, org_id, token, status, expires_at)
    VALUES (
      ${dossierId}, ${scope.userId}, ${scope.orgId},
      ${token}, 'pending', ${expiresAt}
    )
  `;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId,
    action: "dossier.create",
    metadata: { type_client: body.typeClient, partie: body.partie },
    req,
  });
  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId,
    action: "kyc.link.create",
    metadata: { expires_at: expiresAt },
    req,
  });

  return NextResponse.json({ id: dossierId, token }, { status: 201 });
}
