// app/api/integrations/route.ts — Gestion des clés API CRM
//
// GET   → liste des intégrations du scope
// POST  → création d'une nouvelle clé (renvoie la clé EN CLAIR une seule fois)

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope } from "@/lib/scope";
import { generateApiKey, generateCallbackSecret, isValidCallbackUrl } from "@/lib/crm";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const VALID_PROVIDERS = ["generic", "hektor", "apimo", "adapt", "netty", "zapier", "make", "custom"];

interface IntegrationListRow {
  id: string;
  provider: string;
  label: string;
  api_key_prefix: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  use_count: number;
  created_at: string;
}

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = scope.isOrgContext
    ? (await sql`
        SELECT id, provider, label, api_key_prefix, status, last_used_at, use_count, created_at
        FROM crm_integrations
        WHERE org_id = ${scope.orgId}
        ORDER BY created_at DESC
      `) as unknown as IntegrationListRow[]
    : (await sql`
        SELECT id, provider, label, api_key_prefix, status, last_used_at, use_count, created_at
        FROM crm_integrations
        WHERE user_id = ${scope.userId} AND org_id IS NULL
        ORDER BY created_at DESC
      `) as unknown as IntegrationListRow[];

  return NextResponse.json({ integrations: rows });
}

interface CreateBody {
  provider?: string;
  label?: string;
  /** URL de callback optionnelle pour recevoir les webhooks sortants Klaris→CRM. */
  callbackUrl?: string;
}

export async function POST(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const provider = (body.provider ?? "generic").toLowerCase();
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Provider invalide. Valeurs : ${VALID_PROVIDERS.join(", ")}` },
      { status: 400 },
    );
  }

  const label = (body.label ?? "").trim();
  if (!label || label.length > 80) {
    return NextResponse.json({ error: "Label requis (max 80 caractères)" }, { status: 400 });
  }

  // Callback URL optionnelle (webhooks sortants). Si fournie → secret HMAC généré.
  const callbackUrl = (body.callbackUrl ?? "").trim() || null;
  if (callbackUrl && !isValidCallbackUrl(callbackUrl)) {
    return NextResponse.json(
      { error: "URL de callback invalide (https requis, sauf localhost)" },
      { status: 400 },
    );
  }
  const callbackSecret = callbackUrl ? generateCallbackSecret() : null;

  // Génère la clé. Le `full` est renvoyé UNE seule fois au client.
  const key = generateApiKey();

  const inserted = (await sql`
    INSERT INTO crm_integrations (
      user_id, org_id, provider, label, api_key_hash, api_key_prefix,
      callback_url, callback_secret
    ) VALUES (
      ${scope.userId}, ${scope.orgId},
      ${provider}, ${label},
      ${key.hash}, ${key.prefix},
      ${callbackUrl}, ${callbackSecret}
    )
    RETURNING id, created_at
  `) as unknown as Array<{ id: string; created_at: string }>;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: null,
    action: "integration.create",
    metadata: {
      integration_id: inserted[0].id,
      provider,
      label,
      key_prefix: key.prefix,
    },
    req,
  });

  return NextResponse.json(
    {
      id: inserted[0].id,
      provider,
      label,
      apiKey: key.full,            // ⚠️ AFFICHÉ UNE SEULE FOIS
      keyPrefix: key.prefix,
      callbackUrl,
      callbackSecret,              // ⚠️ AFFICHÉ UNE SEULE FOIS (secret HMAC sortant)
      createdAt: inserted[0].created_at,
    },
    { status: 201 },
  );
}
