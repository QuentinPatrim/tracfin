// lib/scope.ts — Résolution du contexte d'accès (personnel vs organisation)
//
// Modèle multi-tenant :
//   - L'agent connecté avec orgId NULL → contexte personnel.
//     Toutes les ressources visibles ont (user_id = userId AND org_id IS NULL).
//   - L'agent avec orgId actif (a switché vers une Org via Clerk) → contexte agence.
//     Toutes les ressources visibles ont (org_id = orgId). user_id = créateur.
//
// La frontière entre les deux contextes est étanche : un dossier de l'org Acme
// n'apparaît jamais quand l'agent est en contexte personnel, et vice versa.
// Pour basculer, l'agent utilise le <OrganizationSwitcher /> Clerk.

import { auth } from "@clerk/nextjs/server";

export interface Scope {
  /** ID Clerk de l'utilisateur connecté. Toujours présent si authentifié. */
  userId: string;
  /** ID Clerk de l'org active. NULL en contexte personnel. */
  orgId: string | null;
  /** Rôle Clerk dans l'org active (org:admin | org:member …) ou null. */
  orgRole: string | null;
  /** Raccourci : true ssi orgId est défini. */
  isOrgContext: boolean;
}

/**
 * Résout le scope depuis la session Clerk. Retourne null si non authentifié.
 * Les routes API doivent immédiatement répondre 401 dans ce cas.
 */
export async function getScope(): Promise<Scope | null> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return null;
  return {
    userId,
    orgId: orgId ?? null,
    orgRole: orgRole ?? null,
    isOrgContext: !!orgId,
  };
}

/**
 * Helper de construction de la valeur INSERT pour une ressource "scopée" :
 * dossier, attestation, audit_event, kyc_link, kyc_response.
 *
 * Renvoie l'org_id qui doit accompagner l'insertion. Le `user_id` (créateur)
 * reste systématiquement le userId du créateur réel — il sert au log.
 */
export function orgIdForInsert(scope: Scope): string | null {
  return scope.orgId;
}

/**
 * Vérifie qu'un row possédant {user_id, org_id} est visible par le scope donné.
 * Utilisé après un SELECT * pour rejeter en JS ce qui ne devrait pas remonter.
 * En pratique on filtre déjà côté SQL — ceci est une défense en profondeur.
 */
export function isVisibleInScope(
  row: { user_id: string; org_id: string | null },
  scope: Scope,
): boolean {
  if (scope.isOrgContext) {
    return row.org_id === scope.orgId;
  }
  return row.user_id === scope.userId && row.org_id === null;
}

/**
 * Récupère un dossier appartenant au scope courant.
 * Renvoie null si :
 *   - le dossier n'existe pas,
 *   - ou n'appartient pas au scope (mauvais user_id ou mauvais org_id).
 *
 * Utilisé par toutes les routes API qui opèrent sur un dossier précis.
 */
import { sql } from "@/lib/db";

export async function findScopedDossier<T = Record<string, unknown>>(
  dossierId: string,
  scope: Scope,
  columns: string = "*",
): Promise<T | null> {
  // Sécurité : on whitelist les colonnes les plus courantes pour éviter
  // toute injection via le paramètre `columns`. Le défaut "*" couvre la
  // majorité des appels (édition complète).
  if (!/^[\w\s,*.()]+$/.test(columns)) {
    throw new Error(`findScopedDossier: colonnes invalides "${columns}"`);
  }
  const query = scope.isOrgContext
    ? `SELECT ${columns} FROM dossiers WHERE id = $1 AND org_id = $2 LIMIT 1`
    : `SELECT ${columns} FROM dossiers WHERE id = $1 AND user_id = $2 AND org_id IS NULL LIMIT 1`;
  const params = scope.isOrgContext ? [dossierId, scope.orgId!] : [dossierId, scope.userId];
  const rows = (await sql.query(query, params)) as unknown as T[];
  return rows.length > 0 ? rows[0] : null;
}
