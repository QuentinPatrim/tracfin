// app/api/kyc/[token]/route.ts — POST réponses du KYC public v2

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  isLikelySiren,
  MENTION_CNIL_VERSION,
  type KycForm,
} from "@/lib/kyc";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let form: KycForm;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Vérifie le token
  const links = (await sql`
    SELECT id, dossier_id, status, expires_at FROM kyc_links WHERE token = ${token} LIMIT 1
  `) as unknown as Array<{ id: string; dossier_id: string; status: string; expires_at: string }>;

  if (links.length === 0) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  const link = links[0];

  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Lien expiré" }, { status: 410 });
  }
  if (link.status === "completed") {
    return NextResponse.json({ error: "Déjà rempli" }, { status: 409 });
  }

  // ─── Validation serveur (défense en profondeur) ─────────────────────
  if (!form.consentementRgpd) {
    return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
  }
  if (!form.nomPrenom?.trim() || !form.emailContact?.trim()) {
    return NextResponse.json({ error: "Identité incomplète" }, { status: 400 });
  }
  if (!form.urlPieceIdentite || !form.urlJustifDomicile) {
    return NextResponse.json({ error: "Pièces obligatoires manquantes" }, { status: 400 });
  }
  if (!form.pieceIdentiteType || !form.pieceIdentiteNumero?.trim() || !form.pieceIdentiteExpiration) {
    return NextResponse.json({ error: "Détail pièce d'identité incomplet" }, { status: 400 });
  }
  if (form.ppe === null || form.ppeProcheDetecte === null) {
    return NextResponse.json({ error: "Déclaration PPE incomplète" }, { status: 400 });
  }
  if (!form.typeBien || !form.lieuBien?.trim() || !form.montantOperation?.trim()) {
    return NextResponse.json({ error: "Détail de l'opération incomplet" }, { status: 400 });
  }
  if (!form.modeFinancement || !form.modePaiement || !form.origineFonds) {
    return NextResponse.json({ error: "Données financières incomplètes" }, { status: 400 });
  }

  if (form.typeClient === "morale") {
    if (!form.urlKbis || !form.siren?.trim() || !isLikelySiren(form.siren)) {
      return NextResponse.json({ error: "SIREN ou Kbis invalide" }, { status: 400 });
    }
    if (!Array.isArray(form.beneficiairesEffectifsJson) || form.beneficiairesEffectifsJson.length === 0) {
      return NextResponse.json({ error: "Au moins un bénéficiaire effectif est requis" }, { status: 400 });
    }
  }

  // ─── Persistance ────────────────────────────────────────────────────
  await sql`
    INSERT INTO kyc_responses (
      link_id, dossier_id, kyc_version,
      email_contact, telephone, type_client,
      nom_prenom, date_naissance, lieu_naissance, nationalite, pays_nationalite,
      adresse, profession, secteur_activite,
      ppe, ppe_precisions, ppe_proche_detecte, ppe_proche_precisions,
      piece_identite_type, piece_identite_numero, piece_identite_expiration, piece_identite_autorite,
      forme_juridique, siren, date_constitution, activite_principale, nom_gerant,
      beneficiaires_effectifs, beneficiaires_effectifs_json,
      pays_residence_fiscale, origine_fonds, origine_fonds_precisions,
      origine_fonds_vente_adresse, origine_fonds_donateur, origine_fonds_lien_defunt,
      mode_financement, mode_paiement, montant_operation,
      type_bien, lieu_bien,
      url_piece_identite, url_justif_domicile, url_avis_imposition, url_justif_revenus, url_justif_origine_fonds,
      url_kbis, url_statuts, url_cni_gerant, url_bilans, url_rbe,
      consentement_rgpd, consentement_rgpd_at, mention_cnil_version
    ) VALUES (
      ${link.id}, ${link.dossier_id}, 'v2',
      ${form.emailContact}, ${form.telephone || null}, ${form.typeClient},
      ${form.nomPrenom}, ${form.dateNaissance || null}, ${form.lieuNaissance || null},
      ${form.nationalite || null}, ${form.paysNationalite || null},
      ${form.adresse || null}, ${form.profession || null}, ${form.secteurActivite || null},
      ${form.ppe}, ${form.ppePrecisions || null},
      ${form.ppeProcheDetecte}, ${form.ppeProchePrecisions || null},
      ${form.pieceIdentiteType}, ${form.pieceIdentiteNumero}, ${form.pieceIdentiteExpiration},
      ${form.pieceIdentiteAutorite || null},
      ${form.formeJuridique || null}, ${form.siren || null}, ${form.dateConstitution || null},
      ${form.activitePrincipale || null}, ${form.nomGerant || null},
      ${form.beneficiairesEffectifs || null},
      ${JSON.stringify(form.beneficiairesEffectifsJson)}::jsonb,
      ${form.paysResidenceFiscale || null}, ${form.origineFonds || null}, ${form.origineFondsPrecisions || null},
      ${form.origineFondsVenteAdresse || null}, ${form.origineFondsDonateur || null},
      ${form.origineFondsLienDefunt || null},
      ${form.modeFinancement || null}, ${form.modePaiement || null}, ${form.montantOperation || null},
      ${form.typeBien || null}, ${form.lieuBien || null},
      ${form.urlPieceIdentite}, ${form.urlJustifDomicile}, ${form.urlAvisImposition || null},
      ${form.urlJustifRevenus || null}, ${form.urlJustifOrigineFonds || null},
      ${form.urlKbis || null}, ${form.urlStatuts || null}, ${form.urlCniGerant || null},
      ${form.urlBilans || null}, ${form.urlRbe || null},
      ${form.consentementRgpd}, NOW(), ${MENTION_CNIL_VERSION}
    )
  `;

  // Marque le lien comme complété + dossier en "KYC reçu"
  await sql`UPDATE kyc_links SET status = 'completed', completed_at = NOW() WHERE id = ${link.id}`;
  await sql`UPDATE dossiers SET kyc_status = 'received' WHERE id = ${link.dossier_id}`;

  return NextResponse.json({ ok: true });
}
