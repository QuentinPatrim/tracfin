// lib/attestation.ts — Snapshot opposable d'une attestation LCB-FT
//
// Quand on émet un PDF d'attestation, on FIGE le verdict (form + score) dans une
// table immuable. Le PDF est ensuite généré à partir de cette ligne. Si l'algo
// évolue plus tard (v3, ajustement de seuils…), l'attestation déjà émise reste
// reproductible à l'identique → preuve d'audit véritable.
//
// Politique de re-émission :
//   - Si une attestation existe déjà pour le couple (dossier_id, content_hash),
//     on la renvoie telle quelle. Cas typique : un agent re-télécharge le PDF.
//   - Si rien n'existe avec ce hash, on insère une nouvelle ligne. Cas typique :
//     le dossier a été modifié depuis la dernière émission, le hash change,
//     nouvelle attestation créée. Les anciennes restent en base.

import { sql } from "@/lib/db";
import type { DossierForm, ScoreResult } from "@/lib/tracfin";
import { computeContentHash } from "@/lib/pdf-helpers";

export interface AttestationSnapshot {
  id: string;
  dossier_id: string;
  user_id: string;
  algo_version: string;
  niveau: string;
  form_snapshot: DossierForm;
  score_snapshot: ScoreResult;
  content_hash: string;
  generated_at: string;
}

interface SnapshotRow {
  id: string;
  dossier_id: string;
  user_id: string;
  algo_version: string;
  niveau: string;
  form_snapshot: DossierForm | string;
  score_snapshot: ScoreResult | string;
  content_hash: string;
  generated_at: string;
}

function parseJsonField<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function rowToSnapshot(row: SnapshotRow): AttestationSnapshot {
  return {
    id: row.id,
    dossier_id: row.dossier_id,
    user_id: row.user_id,
    algo_version: row.algo_version,
    niveau: row.niveau,
    form_snapshot: parseJsonField(row.form_snapshot),
    score_snapshot: parseJsonField(row.score_snapshot),
    content_hash: row.content_hash,
    generated_at: row.generated_at,
  };
}

/**
 * Récupère ou crée le snapshot d'attestation pour l'état actuel d'un dossier.
 *
 * Le `generatedAt` n'est PAS dans le hash de contenu : si on hashait la date
 * d'émission, deux émissions du même état produiraient des hashes différents
 * et on créerait un nouveau snapshot à chaque clic. On hashe uniquement le
 * couple {form, score, dossierId} → idempotence par état métier.
 */
export async function getOrCreateAttestation(params: {
  dossierId: string;
  userId: string;
  orgId?: string | null;
  form: DossierForm;
  score: ScoreResult;
}): Promise<AttestationSnapshot> {
  const { dossierId, userId, orgId, form, score } = params;

  // Hash stable pour le couple (état dossier, verdict). Date neutre pour ne pas
  // polluer l'idempotence — la date réelle d'émission est `generated_at` sur la
  // ligne stockée.
  const contentHash = computeContentHash(form, score, dossierId, "snapshot");

  const existing = (await sql`
    SELECT * FROM attestations
    WHERE dossier_id = ${dossierId} AND content_hash = ${contentHash}
    LIMIT 1
  `) as unknown as SnapshotRow[];

  if (existing.length > 0) {
    return rowToSnapshot(existing[0]);
  }

  const inserted = (await sql`
    INSERT INTO attestations (
      dossier_id, user_id, org_id, algo_version, niveau,
      form_snapshot, score_snapshot, content_hash
    ) VALUES (
      ${dossierId}, ${userId}, ${orgId ?? null}, ${score.algoVersion}, ${score.niveau},
      ${JSON.stringify(form)}::jsonb,
      ${JSON.stringify(score)}::jsonb,
      ${contentHash}
    )
    RETURNING *
  `) as unknown as SnapshotRow[];

  return rowToSnapshot(inserted[0]);
}
