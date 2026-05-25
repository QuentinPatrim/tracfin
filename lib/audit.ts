// lib/audit.ts — Trace opposable des actions (table audit_events)
//
// Toute mutation côté agent ou côté client public doit appeler logAudit() pour
// laisser une trace horodatée (qui, quoi, sur quel dossier, depuis quelle IP).
// C'est l'élément indispensable pour défendre une attestation lors d'un contrôle
// DGCCRF / ACPR / Ordre — la simple présence du dossier en base ne suffit pas,
// il faut pouvoir prouver QUI a fait QUOI et QUAND.

import { sql } from "@/lib/db";

export type AuditAction =
  | "dossier.create"
  | "dossier.update"
  | "dossier.archive"
  | "dossier.transition"          // niveau de vigilance changé manuellement
  | "kyc.link.create"
  | "kyc.link.open"
  | "kyc.submit"
  | "attestation.emit"
  | "file.upload"
  | "file.download"
  | "screening.run"               // appel API sanctions (OpenSanctions…)
  | "screening.gate.confirm"      // agent a confirmé / infirmé les gates suggérées
  | "screening.alert"             // nouvelle correspondance détectée en re-screening
  | "cartography.view"            // consultation cartographie L.561-4-1
  | "cartography.export"          // export PDF cartographie pour contrôle DGCCRF
  | "pappers.lookup";             // appel INPI/Pappers pour récupérer données PM

export interface LogAuditParams {
  /** ID Clerk de l'agent. NULL pour les actions client public (KYC, upload via token). */
  userId: string | null;
  /** ID Clerk de l'org si l'action a lieu en contexte agence. NULL en contexte perso. */
  orgId?: string | null;
  /** ID du dossier concerné. NULL pour les actions hors dossier. */
  dossierId: string | null;
  action: AuditAction;
  /** Métadonnées libres (jamais d'info personnelle directe, juste des refs). */
  metadata?: Record<string, unknown>;
  /** Requête HTTP, pour extraire IP + UA. Optionnelle (jobs cron etc.). */
  req?: Request | null;
}

/**
 * Écrit une ligne d'audit. Best-effort : on log l'erreur mais on ne casse
 * jamais la requête qui appelle, sinon une panne audit casserait tout le
 * produit.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  const { userId, orgId, dossierId, action, metadata, req } = params;

  let ip: string | null = null;
  let userAgent: string | null = null;

  if (req) {
    // Vercel / Cloudflare / nginx posent typiquement x-forwarded-for. On prend
    // le 1er, qui est l'IP du client (le reste = chaîne de proxies).
    const xff = req.headers.get("x-forwarded-for");
    ip = xff?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  }

  try {
    await sql`
      INSERT INTO audit_events (user_id, org_id, dossier_id, action, metadata, ip, user_agent)
      VALUES (
        ${userId},
        ${orgId ?? null},
        ${dossierId},
        ${action},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        ${ip},
        ${userAgent}
      )
    `;
  } catch (e) {
    console.error("audit log error:", e, { action, dossierId, userId, orgId });
  }
}
