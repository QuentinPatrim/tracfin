// app/api/dossiers/[id]/route.ts — GET (détail) + PATCH (update) + DELETE (archive)

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { computeScore, type DossierForm } from "@/lib/tracfin";
import { logAudit } from "@/lib/audit";
import { getScope, findScopedDossier } from "@/lib/scope";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await findScopedDossier(id, scope);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const form: DossierForm = await req.json();
  if (!form.nomPrenom?.trim()) {
    return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
  }

  // Un dossier archivé est en lecture seule (preuve à conserver, non modifiable).
  const guard = await findScopedDossier<{ archived_at: string | null }>(
    id,
    scope,
    "archived_at",
  );
  if (!guard) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (guard.archived_at) {
    return NextResponse.json({ error: "Dossier archivé, modification interdite" }, { status: 409 });
  }

  const score = computeScore(form);

  // Numeric column : Postgres veut un nombre ou NULL, pas une string vide
  const montant = form.montantTransaction.trim() === ""
    ? null
    : Number(form.montantTransaction.replace(/\s/g, ""));

  // WHERE scopé : on a déjà confirmé l'ownership via findScopedDossier, mais on
  // re-scope l'UPDATE pour défense en profondeur (qq ms supplémentaires, vaut le coup).
  const updateBase = `
    UPDATE dossiers SET
      type_client = $1, nom_prenom = $2, date_naissance = $3, lieu_naissance = $4,
      nationalite = $5, pays_nationalite = $6, adresse = $7, profession = $8,
      comportement = $9, secteur_activite = $10, date_detection = $11, lien_kyc = $12,
      piece_identite = $13, justif_domicile = $14, kbis = $15, statuts = $16, cni_gerant = $17,
      residence_fiscale = $18, lieu_bien = $19, origine_fonds = $20, justif_fonds = $21,
      montage_financier = $22, mode_paiement = $23, coherence_prix = $24, justif_prix = $25,
      type_bien = $26, montant_transaction = $27, rbe = $28, gel_avoirs = $29, gel_date = $30,
      sanctions_liste = $31, ppe = $32, ppe_proche_detecte = $33, ppe_entourage = $34::jsonb,
      nom_employe = $35, formation = $36, responsable_lcbft = $37,
      algo_version = 'v2', niveau = $38, algo_log = $39::jsonb, statut = $40, score_pct = $41,
      updated_at = NOW()
  `;
  const values: unknown[] = [
    form.typeClient, form.nomPrenom, form.dateNaissance || null, form.lieuNaissance || null,
    form.nationalite || null, form.paysNationalite || null, form.adresse || null, form.profession || null,
    form.comportement || null, form.secteurActivite || null, form.dateDetection, form.lienKyc || null,
    form.pieceIdentite, form.justifDomicile, form.kbis, form.statuts, form.cniGerant,
    form.residenceFiscale || null, form.lieuBien || null, form.origineFonds || null, form.justifFonds || null,
    form.montageFinancier || null, form.modePaiement || null, form.coherencePrix || null, form.justifPrix || null,
    form.typeBien || null, montant, form.rbe || null, form.gelAvoirs, form.gelDate || null,
    form.sanctionsListe, form.ppe, form.ppeProcheDetecte, JSON.stringify(form.ppeProches),
    form.nomEmploye || null, form.formation || null, form.responsableLCBFT || null,
    score.niveau, JSON.stringify({ triggers: score.triggers }), score.statutKey, score.pct,
  ];

  const finalQuery = scope.isOrgContext
    ? `${updateBase} WHERE id = $42 AND org_id = $43 RETURNING id`
    : `${updateBase} WHERE id = $42 AND user_id = $43 AND org_id IS NULL RETURNING id`;
  values.push(id, scope.isOrgContext ? scope.orgId : scope.userId);

  const rows = (await sql.query(finalQuery, values)) as unknown as Array<{ id: string }>;

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "dossier.update",
    metadata: { niveau: score.niveau, algo_version: score.algoVersion },
    req,
  });

  return NextResponse.json({ id: rows[0].id });
}

// DELETE = archive (soft-delete). Obligation de conservation 5 ans (CMF L.561-12-1) :
// on ne peut PAS supprimer physiquement un dossier dont le KYC a été reçu — les pièces
// et le verdict sont des preuves opposables à fournir en contrôle DGCCRF.
// Le nettoyage réel (created_at + 5 ans) est fait par un job séparé.
export async function DELETE(req: Request, { params }: RouteParams) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const dossier = await findScopedDossier<{ kyc_status: string | null; archived_at: string | null }>(
    id,
    scope,
    "kyc_status, archived_at",
  );
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) {
    return NextResponse.json({ ok: true, alreadyArchived: true });
  }

  if (scope.isOrgContext) {
    await sql`
      UPDATE dossiers SET archived_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND org_id = ${scope.orgId}
    `;
  } else {
    await sql`
      UPDATE dossiers SET archived_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND user_id = ${scope.userId} AND org_id IS NULL
    `;
  }

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId: id,
    action: "dossier.archive",
    metadata: { kyc_status: dossier.kyc_status },
    req,
  });

  return NextResponse.json({ ok: true });
}
