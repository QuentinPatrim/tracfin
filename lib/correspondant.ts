// lib/correspondant.ts — Correspondant LCB-FT (L.561-32) + validation 4-yeux
//
// L.561-32 : l'assujetti désigne un correspondant/déclarant responsable du
// dispositif LCB-FT. En structure pluri-personnelle, le principe des « quatre
// yeux » impose qu'un dossier à risque (examen renforcé / interdiction) soit
// validé par ce correspondant, distinct de l'agent instructeur.
//
// Toutes les fonctions sont scopées ORGANISATION (le workflow n'a de sens qu'à
// plusieurs ; un agent solo est son propre correspondant — pas de 4-yeux).

import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  role: string;             // org:admin | org:member …
  isAdmin: boolean;
  isCorrespondant: boolean;
}

export type ValidationStatus = "pending" | "approved" | "rejected";

export interface ValidationRow {
  id: string;
  dossier_id: string;
  org_id: string | null;
  requested_by: string;
  niveau_at_request: string | null;
  status: ValidationStatus;
  decided_by: string | null;
  decision_comment: string | null;
  requested_at: string;
  decided_at: string | null;
}

// ─── Membres de l'organisation (Clerk) + flag correspondant ──────────────
export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const client = await clerkClient();
  const res = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  const correspondantIds = await getCorrespondantIds(orgId);

  return res.data.map((m) => {
    const pud = m.publicUserData;
    const userId = pud?.userId ?? "";
    const name = [pud?.firstName, pud?.lastName].filter(Boolean).join(" ").trim()
      || pud?.identifier
      || userId;
    return {
      userId,
      name,
      email: pud?.identifier ?? "",
      role: m.role,
      isAdmin: /admin/i.test(m.role),
      isCorrespondant: correspondantIds.has(userId),
    };
  });
}

export async function getCorrespondantIds(orgId: string): Promise<Set<string>> {
  const rows = (await sql`
    SELECT user_id FROM org_correspondants WHERE org_id = ${orgId}
  `) as unknown as Array<{ user_id: string }>;
  return new Set(rows.map((r) => r.user_id));
}

/** Un user peut statuer sur une validation s'il est correspondant désigné OU admin de l'org. */
export async function canValidate(
  userId: string,
  orgId: string | null,
  orgRole: string | null,
): Promise<boolean> {
  if (!orgId) return false; // pas de 4-yeux en solo
  if (orgRole && /admin/i.test(orgRole)) return true;
  const ids = await getCorrespondantIds(orgId);
  return ids.has(userId);
}

// ─── Désignation (admin) ──────────────────────────────────────────────────
export async function designateCorrespondant(orgId: string, userId: string, by: string): Promise<void> {
  await sql`
    INSERT INTO org_correspondants (org_id, user_id, designated_by)
    VALUES (${orgId}, ${userId}, ${by})
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;
}

export async function removeCorrespondant(orgId: string, userId: string): Promise<void> {
  await sql`DELETE FROM org_correspondants WHERE org_id = ${orgId} AND user_id = ${userId}`;
}

// ─── Validation 4-yeux ─────────────────────────────────────────────────────
export async function latestValidation(dossierId: string): Promise<ValidationRow | null> {
  const rows = (await sql`
    SELECT * FROM dossier_validations
    WHERE dossier_id = ${dossierId}
    ORDER BY requested_at DESC
    LIMIT 1
  `) as unknown as ValidationRow[];
  return rows[0] ?? null;
}

export async function listValidations(dossierId: string): Promise<ValidationRow[]> {
  return (await sql`
    SELECT * FROM dossier_validations
    WHERE dossier_id = ${dossierId}
    ORDER BY requested_at DESC
  `) as unknown as ValidationRow[];
}

/**
 * Crée une demande de validation. Refuse s'il existe déjà une demande pending
 * (évite les doublons en file). Renvoie la row créée ou l'existante pending.
 */
export async function requestValidation(params: {
  dossierId: string;
  orgId: string;
  requestedBy: string;
  niveau: string | null;
}): Promise<{ row: ValidationRow; alreadyPending: boolean }> {
  const { dossierId, orgId, requestedBy, niveau } = params;

  const existing = (await sql`
    SELECT * FROM dossier_validations
    WHERE dossier_id = ${dossierId} AND status = 'pending'
    LIMIT 1
  `) as unknown as ValidationRow[];
  if (existing.length > 0) {
    return { row: existing[0], alreadyPending: true };
  }

  const inserted = (await sql`
    INSERT INTO dossier_validations (dossier_id, org_id, requested_by, niveau_at_request)
    VALUES (${dossierId}, ${orgId}, ${requestedBy}, ${niveau})
    RETURNING *
  `) as unknown as ValidationRow[];
  return { row: inserted[0], alreadyPending: false };
}

export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Statue sur une validation. Enforce le principe des 4 yeux :
 *   - le décideur doit pouvoir valider (correspondant ou admin),
 *   - le décideur DOIT être différent de l'agent qui a demandé.
 */
export async function decideValidation(params: {
  validationId: string;
  dossierId: string;
  deciderId: string;
  decision: "approved" | "rejected";
  comment: string;
}): Promise<ValidationRow> {
  const { validationId, dossierId, deciderId, decision, comment } = params;

  const rows = (await sql`
    SELECT * FROM dossier_validations
    WHERE id = ${validationId} AND dossier_id = ${dossierId}
    LIMIT 1
  `) as unknown as ValidationRow[];
  if (rows.length === 0) throw new ValidationError("Demande introuvable", "not_found");
  const v = rows[0];

  if (v.status !== "pending") {
    throw new ValidationError("Cette demande a déjà été traitée", "already_decided");
  }
  if (v.requested_by === deciderId) {
    throw new ValidationError(
      "Principe des quatre yeux : vous ne pouvez pas valider un dossier que vous avez vous-même soumis.",
      "four_eyes",
    );
  }

  const updated = (await sql`
    UPDATE dossier_validations
    SET status = ${decision}, decided_by = ${deciderId},
        decision_comment = ${comment || null}, decided_at = NOW()
    WHERE id = ${validationId}
    RETURNING *
  `) as unknown as ValidationRow[];
  return updated[0];
}

// ─── File d'attente du correspondant ──────────────────────────────────────
export interface PendingValidation extends ValidationRow {
  nom_prenom: string;
  type_client: string;
  niveau: string | null;
  statut: string | null;
}

export async function getPendingValidations(orgId: string): Promise<PendingValidation[]> {
  return (await sql`
    SELECT v.*, d.nom_prenom, d.type_client, d.niveau, d.statut
    FROM dossier_validations v
    JOIN dossiers d ON d.id = v.dossier_id
    WHERE v.org_id = ${orgId} AND v.status = 'pending' AND d.archived_at IS NULL
    ORDER BY v.requested_at ASC
  `) as unknown as PendingValidation[];
}

/** Statut de validation le plus récent par dossier (pour badges dashboard). */
export async function batchValidationStatus(dossierIds: string[]): Promise<Map<string, ValidationStatus>> {
  if (dossierIds.length === 0) return new Map();
  const rows = (await sql`
    SELECT DISTINCT ON (dossier_id) dossier_id, status
    FROM dossier_validations
    WHERE dossier_id = ANY(${dossierIds}::uuid[])
    ORDER BY dossier_id, requested_at DESC
  `) as unknown as Array<{ dossier_id: string; status: ValidationStatus }>;
  return new Map(rows.map((r) => [r.dossier_id, r.status]));
}
