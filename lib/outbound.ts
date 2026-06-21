// lib/outbound.ts — Webhooks sortants Klaris → CRM (boucle de synchronisation)
//
// Pattern "outbox" : les points d'état (KYC reçu, verdict, déclaration, signature)
// appellent enqueueOutboundEvent() qui insère une ligne pending (non bloquant).
// Un cron (/api/cron/webhooks, ~5 min) dépile via dispatchPendingEvents() et POST
// vers le callback_url des intégrations du scope, payload signé HMAC.
//
// Garanties : at-least-once. Le CRM doit dédupliquer sur X-Klaris-Event-Id.

import { createHmac } from "crypto";
import { sql } from "@/lib/db";
import { EDITEUR } from "@/lib/legal";

export type OutboundEventType =
  | "dossier.kyc_received"
  | "dossier.scored"
  | "dossier.declaration_submitted"
  | "dossier.signed";

const MAX_ATTEMPTS = 6;

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.NODE_ENV === "production" ? EDITEUR.siteUrl : "http://localhost:3000");
}

interface EnqueueParams {
  dossierId: string;
  userId: string;
  orgId: string | null;
  eventType: OutboundEventType;
  /** Données additionnelles fusionnées dans le payload (ex: niveau, ermesRef). */
  extra?: Record<string, unknown>;
}

/**
 * Y a-t-il au moins une intégration active avec callback_url dans ce scope ?
 * Évite d'empiler des events qui n'iront nulle part.
 */
async function scopeHasCallback(userId: string, orgId: string | null): Promise<boolean> {
  const rows = orgId
    ? (await sql`
        SELECT 1 FROM crm_integrations
        WHERE org_id = ${orgId} AND status = 'active' AND callback_url IS NOT NULL
        LIMIT 1
      `) as unknown as Array<{ "?column?": number }>
    : (await sql`
        SELECT 1 FROM crm_integrations
        WHERE user_id = ${userId} AND org_id IS NULL AND status = 'active' AND callback_url IS NOT NULL
        LIMIT 1
      `) as unknown as Array<{ "?column?": number }>;
  return rows.length > 0;
}

interface DossierSnapshotRow {
  id: string;
  nom_prenom: string;
  type_client: string;
  partie: string | null;
  kyc_status: string | null;
  niveau: string | null;
  statut: string | null;
  external_ref: string | null;
  external_provider: string | null;
}

/** Construit le payload d'un événement dossier à partir de l'état courant en DB. */
async function buildDossierEventPayload(
  dossierId: string,
  eventType: OutboundEventType,
  extra?: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const rows = (await sql`
    SELECT id, nom_prenom, type_client, partie, kyc_status, niveau, statut,
           external_ref, external_provider
    FROM dossiers WHERE id = ${dossierId} LIMIT 1
  `) as unknown as DossierSnapshotRow[];
  if (rows.length === 0) return null;
  const d = rows[0];

  return {
    event: eventType,
    dossier: {
      id: d.id,
      nomPrenom: d.nom_prenom,
      typeClient: d.type_client,
      partie: d.partie,
      kycStatus: d.kyc_status,
      niveau: d.niveau ?? d.statut ?? null,
      externalRef: d.external_ref,
      externalProvider: d.external_provider,
      klarisUrl: `${baseUrl()}/dashboard/${d.id}`,
    },
    ...(extra ?? {}),
  };
}

export async function enqueueOutboundEvent(params: EnqueueParams): Promise<void> {
  const { dossierId, userId, orgId, eventType, extra } = params;
  try {
    if (!(await scopeHasCallback(userId, orgId))) return;

    const payload = await buildDossierEventPayload(dossierId, eventType, extra);
    if (!payload) return;

    await sql`
      INSERT INTO outbound_events (dossier_id, user_id, org_id, event_type, payload)
      VALUES (${dossierId}, ${userId}, ${orgId}, ${eventType}, ${JSON.stringify(payload)}::jsonb)
    `;
  } catch (e) {
    // Best-effort : ne jamais casser le flux métier appelant.
    console.error("[outbound] enqueue failed:", e, { dossierId, eventType });
  }
}

// ─── Dispatcher (appelé par le cron) ─────────────────────────────────────
interface PendingEvent {
  id: string;
  dossier_id: string;
  user_id: string;
  org_id: string | null;
  event_type: string;
  payload: unknown;
  attempts: number;
}

interface CallbackTarget {
  id: string;
  callback_url: string;
  callback_secret: string | null;
}

async function targetsForScope(userId: string, orgId: string | null): Promise<CallbackTarget[]> {
  const rows = orgId
    ? (await sql`
        SELECT id, callback_url, callback_secret FROM crm_integrations
        WHERE org_id = ${orgId} AND status = 'active' AND callback_url IS NOT NULL
      `) as unknown as CallbackTarget[]
    : (await sql`
        SELECT id, callback_url, callback_secret FROM crm_integrations
        WHERE user_id = ${userId} AND org_id IS NULL AND status = 'active' AND callback_url IS NOT NULL
      `) as unknown as CallbackTarget[];
  return rows;
}

export interface DispatchSummary {
  picked: number;
  delivered: number;
  failed: number;
  skipped: number;
}

/**
 * Dépile les événements pending/failed (attempts < cap) et les livre.
 * Backoff simple : un event n'est ré-essayé que si son dernier essai date de
 * plus de (attempts × 2) minutes — le cron tournant toutes les 5 min suffit.
 */
export async function dispatchPendingEvents(limit = 50): Promise<DispatchSummary> {
  const events = (await sql`
    SELECT id, dossier_id, user_id, org_id, event_type, payload, attempts
    FROM outbound_events
    WHERE status IN ('pending', 'failed')
      AND attempts < ${MAX_ATTEMPTS}
      AND (last_attempt_at IS NULL OR last_attempt_at < NOW() - (attempts * INTERVAL '2 minutes'))
    ORDER BY created_at ASC
    LIMIT ${limit}
  `) as unknown as PendingEvent[];

  const summary: DispatchSummary = { picked: events.length, delivered: 0, failed: 0, skipped: 0 };

  for (const ev of events) {
    const targets = await targetsForScope(ev.user_id, ev.org_id);

    if (targets.length === 0) {
      // Plus aucune cible (callback retiré) → on classe skipped (pas de retry).
      await sql`UPDATE outbound_events SET status = 'skipped', last_attempt_at = NOW() WHERE id = ${ev.id}`;
      summary.skipped++;
      continue;
    }

    const body = JSON.stringify(ev.payload);
    let allOk = true;
    let lastError = "";

    for (const t of targets) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Klaris-Event-Id": ev.id,
          "X-Klaris-Event-Type": ev.event_type,
        };
        if (t.callback_secret) {
          const sig = createHmac("sha256", t.callback_secret).update(body, "utf8").digest("hex");
          headers["X-Klaris-Signature-256"] = `sha256=${sig}`;
        }

        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 10_000);
        const res = await fetch(t.callback_url, {
          method: "POST",
          headers,
          body,
          signal: ctrl.signal,
        }).finally(() => clearTimeout(timeout));

        if (!res.ok) {
          allOk = false;
          lastError = `HTTP ${res.status} sur ${t.callback_url}`;
        }
      } catch (e) {
        allOk = false;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (allOk) {
      await sql`
        UPDATE outbound_events
        SET status = 'delivered', attempts = attempts + 1, last_attempt_at = NOW(), delivered_at = NOW()
        WHERE id = ${ev.id}
      `;
      summary.delivered++;
    } else {
      // Statut 'failed' : le cron le ré-essaiera tant que attempts < MAX_ATTEMPTS
      // (cf. la clause WHERE du SELECT). Au-delà, il reste 'failed' sans nouvel essai.
      await sql`
        UPDATE outbound_events
        SET status = 'failed',
            attempts = attempts + 1, last_attempt_at = NOW(), last_error = ${lastError}
        WHERE id = ${ev.id}
      `;
      summary.failed++;
    }
  }

  return summary;
}
