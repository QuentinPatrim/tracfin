// app/api/dossiers/[id]/route.ts — GET (détail) + PATCH (update) + DELETE

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { computeScore, type DossierForm } from "@/lib/tracfin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const form: DossierForm = await req.json();
  if (!form.nomPrenom?.trim()) {
    return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
  }

  const score = computeScore(form);

  // Numeric column : Postgres veut un nombre ou NULL, pas une string vide
  const montant = form.montantTransaction.trim() === ""
    ? null
    : Number(form.montantTransaction.replace(/\s/g, ""));

  const rows = await sql`
    UPDATE dossiers SET
      type_client = ${form.typeClient},
      nom_prenom = ${form.nomPrenom},
      date_naissance = ${form.dateNaissance || null},
      lieu_naissance = ${form.lieuNaissance || null},
      nationalite = ${form.nationalite || null},
      pays_nationalite = ${form.paysNationalite || null},
      adresse = ${form.adresse || null},
      profession = ${form.profession || null},
      comportement = ${form.comportement || null},
      secteur_activite = ${form.secteurActivite || null},
      date_detection = ${form.dateDetection},
      lien_kyc = ${form.lienKyc || null},
      piece_identite = ${form.pieceIdentite},
      justif_domicile = ${form.justifDomicile},
      kbis = ${form.kbis},
      statuts = ${form.statuts},
      cni_gerant = ${form.cniGerant},
      residence_fiscale = ${form.residenceFiscale || null},
      lieu_bien = ${form.lieuBien || null},
      origine_fonds = ${form.origineFonds || null},
      justif_fonds = ${form.justifFonds || null},
      montage_financier = ${form.montageFinancier || null},
      mode_paiement = ${form.modePaiement || null},
      coherence_prix = ${form.coherencePrix || null},
      justif_prix = ${form.justifPrix || null},
      type_bien = ${form.typeBien || null},
      montant_transaction = ${montant},
      rbe = ${form.rbe || null},
      gel_avoirs = ${form.gelAvoirs},
      gel_date = ${form.gelDate || null},
      sanctions_liste = ${form.sanctionsListe},
      ppe = ${form.ppe},
      ppe_proche_detecte = ${form.ppeProcheDetecte},
      ppe_entourage = ${JSON.stringify(form.ppeProches)}::jsonb,
      nom_employe = ${form.nomEmploye || null},
      formation = ${form.formation || null},
      responsable_lcbft = ${form.responsableLCBFT || null},
      algo_version = 'v2',
      niveau = ${score.niveau},
      algo_log = ${JSON.stringify({ triggers: score.triggers })}::jsonb,
      statut = ${score.statutKey},
      score_pct = ${score.pct},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: rows[0].id });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = await sql`
    DELETE FROM dossiers WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}