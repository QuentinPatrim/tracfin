// app/api/webhooks/crm/route.ts — Webhook entrant CRM (création auto de dossier)
//
// Authentification : `Authorization: Bearer klr_xxx`
// Le CRM POST quand un mandat est signé, Klaris :
//   1. Valide la clé API
//   2. Vérifie l'abonnement actif du scope
//   3. Crée le dossier + génère le token KYC
//   4. Renvoie { dossierId, kycLink } → le CRM peut afficher le lien à l'agent

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { validateApiKey, normalizeWebhookPayload, WebhookValidationError, type WebhookPayload } from "@/lib/crm";
import { getSubscriptionStatus } from "@/lib/subscription";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit, ipFromRequest } from "@/lib/ratelimit";
import { EDITEUR } from "@/lib/legal";

export const runtime = "nodejs";

function unauthorized(reason: string) {
  return NextResponse.json({ error: "Unauthorized", reason }, { status: 401 });
}

export async function POST(req: Request) {
  // ─── 1. Extraction de la clé ─────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(klr_[A-Za-z0-9]+)$/);
  if (!match) {
    return unauthorized("Authorization: Bearer klr_<clé> requis");
  }
  const apiKey = match[1];

  // ─── 2. Rate-limit par IP (avant validation pour éviter qu'un attaquant
  //       teste des clés en boucle) ─────────────────────────────────────
  const rl = await enforceRateLimit({
    key: `crm-webhook:${ipFromRequest(req)}`,
    limit: 60,
    windowSec: 60,
  });
  if (rl) return rl;

  // ─── 3. Validation de la clé ─────────────────────────────────────────
  const integration = await validateApiKey(apiKey);
  if (!integration) {
    return unauthorized("Clé invalide, révoquée ou inconnue");
  }

  // ─── 4. Parse + validation du payload ────────────────────────────────
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  let normalized;
  try {
    normalized = normalizeWebhookPayload(payload);
  } catch (e) {
    if (e instanceof WebhookValidationError) {
      return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    }
    throw e;
  }

  // ─── 5. Vérification de l'abonnement actif (scope de l'intégration) ─
  const sub = await getSubscriptionStatus({
    userId: integration.user_id,
    orgId: integration.org_id,
  });
  if (!sub.isActive) {
    return NextResponse.json(
      {
        error: "subscription_required",
        message: "L'abonnement Klaris du compte propriétaire de cette clé n'est pas actif.",
        state: sub.state,
      },
      { status: 402 },
    );
  }

  // ─── 6. Idempotence : si externalRef déjà connu, on retourne le dossier existant ─
  if (normalized.externalRef) {
    const existing = integration.org_id
      ? (await sql`
          SELECT id FROM dossiers
          WHERE org_id = ${integration.org_id}
            AND external_provider = ${integration.provider}
            AND external_ref = ${normalized.externalRef}
          LIMIT 1
        `) as unknown as Array<{ id: string }>
      : (await sql`
          SELECT id FROM dossiers
          WHERE user_id = ${integration.user_id} AND org_id IS NULL
            AND external_provider = ${integration.provider}
            AND external_ref = ${normalized.externalRef}
          LIMIT 1
        `) as unknown as Array<{ id: string }>;

    if (existing.length > 0) {
      // Retrouve le lien KYC actif (le plus récent non expiré)
      const links = (await sql`
        SELECT token FROM kyc_links
        WHERE dossier_id = ${existing[0].id} AND status != 'completed' AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `) as unknown as Array<{ token: string }>;

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        ?? (process.env.NODE_ENV === "production" ? EDITEUR.siteUrl : "http://localhost:3000");

      return NextResponse.json({
        ok: true,
        dossierId: existing[0].id,
        kycLink: links[0] ? `${baseUrl}/kyc/${links[0].token}` : null,
        idempotent: true,
        message: "Dossier déjà créé pour cet externalId — résultat existant renvoyé.",
      });
    }
  }

  // ─── 7. Création du dossier + token KYC ──────────────────────────────
  const dossierRows = (await sql`
    INSERT INTO dossiers (
      user_id, org_id, type_client, partie, nom_prenom, email_contact, kyc_status,
      external_ref, external_provider
    ) VALUES (
      ${integration.user_id}, ${integration.org_id},
      ${normalized.typeClient}, ${normalized.partie},
      ${normalized.nomPrenom}, ${normalized.emailContact}, 'sent',
      ${normalized.externalRef}, ${integration.provider}
    )
    RETURNING id
  `) as unknown as Array<{ id: string }>;
  const dossierId = dossierRows[0].id;

  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO kyc_links (dossier_id, user_id, org_id, token, status, expires_at)
    VALUES (${dossierId}, ${integration.user_id}, ${integration.org_id}, ${token}, 'pending', ${expiresAt})
  `;

  // ─── 8. Audit log ────────────────────────────────────────────────────
  await logAudit({
    userId: integration.user_id,
    orgId: integration.org_id,
    dossierId,
    action: "integration.webhook",
    metadata: {
      integration_id: integration.id,
      provider: integration.provider,
      external_ref: normalized.externalRef,
      label: integration.label,
    },
    req,
  });
  await logAudit({
    userId: integration.user_id,
    orgId: integration.org_id,
    dossierId,
    action: "dossier.create",
    metadata: {
      source: "crm_webhook",
      provider: integration.provider,
      external_ref: normalized.externalRef,
      type_client: normalized.typeClient,
      partie: normalized.partie,
    },
    req,
  });

  // ─── 9. Réponse exploitable par le CRM ───────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.NODE_ENV === "production" ? EDITEUR.siteUrl : "http://localhost:3000");

  return NextResponse.json(
    {
      ok: true,
      dossierId,
      kycLink: `${baseUrl}/kyc/${token}`,
      kycLinkExpiresAt: expiresAt,
      idempotent: false,
    },
    { status: 201 },
  );
}
