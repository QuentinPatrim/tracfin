// lib/crm.ts — Intégrations CRM (clés API + validation webhook entrant)
//
// Modèle de clé : "klr_" + 32 caractères hex aléatoires (256 bits d'entropie).
// La clé COMPLÈTE n'est JAMAIS stockée. Seul son SHA-256 (lookup en O(1)).
// L'utilisateur la voit UNE seule fois à la création (cf. /api/integrations POST).

import { createHash, randomBytes } from "crypto";
import { sql } from "@/lib/db";

const KEY_PREFIX = "klr_";
/** Longueur de la partie aléatoire (en hex chars). 32 hex = 128 bits = largement assez. */
const KEY_RANDOM_LEN = 32;

export interface GeneratedKey {
  /** Clé complète à afficher à l'utilisateur UNE seule fois. */
  full: string;
  /** Hash SHA-256 (stocké en DB). */
  hash: string;
  /** Prefix lisible : "klr_a3f9e7b2" (stocké pour UI). */
  prefix: string;
}

export function generateApiKey(): GeneratedKey {
  const random = randomBytes(KEY_RANDOM_LEN / 2).toString("hex");
  const full = `${KEY_PREFIX}${random}`;
  const hash = createHash("sha256").update(full).digest("hex");
  const prefix = full.slice(0, 12);
  return { full, hash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Secret HMAC pour signer les webhooks SORTANTS (Klaris → CRM). 32 octets hex. */
export function generateCallbackSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

/** Validation basique d'une URL de callback (https requis hors localhost). */
export function isValidCallbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return true;
    // http autorisé uniquement en local (dev / tunnels)
    return u.protocol === "http:" && /^(localhost|127\.0\.0\.1)/.test(u.hostname);
  } catch {
    return false;
  }
}

export interface IntegrationRow {
  id: string;
  user_id: string;
  org_id: string | null;
  provider: string;
  label: string;
  api_key_prefix: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  use_count: number;
  created_at: string;
  revoked_at: string | null;
}

/**
 * Cherche une intégration ACTIVE par sa clé complète. Renvoie null si :
 *  - clé invalide (mauvais format)
 *  - clé inconnue
 *  - clé révoquée
 *
 * Met à jour last_used_at + use_count en passant (best effort, n'échoue pas le call).
 */
export async function validateApiKey(key: string): Promise<IntegrationRow | null> {
  if (!key || !key.startsWith(KEY_PREFIX) || key.length < KEY_PREFIX.length + 16) {
    return null;
  }
  const hash = hashApiKey(key);

  const rows = (await sql`
    SELECT id, user_id, org_id, provider, label, api_key_prefix, status,
           last_used_at, use_count, created_at, revoked_at
    FROM crm_integrations
    WHERE api_key_hash = ${hash} AND status = 'active'
    LIMIT 1
  `) as unknown as IntegrationRow[];

  if (rows.length === 0) return null;
  const integration = rows[0];

  // Update best-effort des stats d'usage
  try {
    await sql`
      UPDATE crm_integrations
      SET last_used_at = NOW(), use_count = use_count + 1
      WHERE id = ${integration.id}
    `;
  } catch (e) {
    console.error("[crm] update last_used_at failed:", e);
  }

  return integration;
}

// ─── Format du payload entrant ─────────────────────────────────────────
//
// Schéma minimal et permissif (les CRM ont des structures hétérogènes).
// Le CRM doit POST quelque chose qui ressemble à :
//
//   {
//     "client": {
//       "type": "physique" | "morale",     // requis
//       "nom": "Dupont Jean",               // requis
//       "email": "j.dupont@example.com",    // requis (lien KYC envoyé dessus)
//       "telephone": "+33612345678",        // optionnel
//       "siren": "552120222"                // optionnel (si morale)
//     },
//     "operation": {
//       "partie": "vendeur" | "acquereur",  // requis
//       "type": "vente" | "location" | "autre",  // info
//       "montant_eur": 350000               // optionnel
//     },
//     "externalId": "HEKTOR-12345",         // optionnel mais recommandé (rapprochement futur)
//     "provider": "hektor"                  // optionnel (override du provider de la clé)
//   }
//
// La normalisation tolère les champs manquants et applique des valeurs par défaut.

export interface WebhookPayload {
  client?: {
    type?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    siren?: string;
  };
  operation?: {
    partie?: string;
    type?: string;
    montant_eur?: number;
  };
  externalId?: string;
  provider?: string;
}

export interface NormalizedWebhook {
  typeClient: "physique" | "morale";
  partie: "vendeur" | "acquereur";
  nomPrenom: string;
  emailContact: string;
  externalRef: string | null;
}

export class WebhookValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "WebhookValidationError";
  }
}

export function normalizeWebhookPayload(payload: WebhookPayload): NormalizedWebhook {
  const client = payload.client ?? {};
  const operation = payload.operation ?? {};

  // typeClient : par défaut physique. Accepte "particulier" → physique, "société" → morale.
  let typeClient: "physique" | "morale" = "physique";
  const t = (client.type ?? "").toLowerCase();
  if (t === "morale" || t === "société" || t === "societe" || t === "company" || t === "pm") {
    typeClient = "morale";
  }

  // partie : si non spécifié, on suppose acquéreur (cas le plus fréquent en immo)
  let partie: "vendeur" | "acquereur" = "acquereur";
  const p = (operation.partie ?? "").toLowerCase();
  if (p === "vendeur" || p === "seller" || p === "vente") partie = "vendeur";

  const nomPrenom = (client.nom ?? "").trim();
  if (!nomPrenom) {
    throw new WebhookValidationError("client.nom", "Nom du client requis");
  }

  const emailContact = (client.email ?? "").trim();
  if (!emailContact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContact)) {
    throw new WebhookValidationError("client.email", "Email valide requis");
  }

  const externalRef = payload.externalId?.trim() || null;

  return { typeClient, partie, nomPrenom, emailContact, externalRef };
}
