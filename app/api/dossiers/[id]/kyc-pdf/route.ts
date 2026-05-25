// app/api/dossiers/[id]/kyc-pdf/route.ts — Fiche KYC exhaustive depuis kyc_responses

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { kycRowToKycForm, type KycResponseRowFull } from "@/lib/dossier";
import { initialKycForm } from "@/lib/kyc";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildKycHtml } from "@/app/pdf-render/kyc-template";
import { getScope, findScopedDossier } from "@/lib/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const ownership = await findScopedDossier<{ nom_prenom: string; partie: "vendeur" | "acquereur" | null }>(
    id,
    scope,
    "nom_prenom, partie",
  );
  if (!ownership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const partie: "vendeur" | "acquereur" = ownership.partie === "vendeur" ? "vendeur" : "acquereur";

  // Récupère la dernière réponse KYC complète du client
  const kycRows = (await sql`
    SELECT
      type_client, nom_prenom, date_naissance, lieu_naissance, nationalite,
      pays_nationalite, adresse, profession, secteur_activite,
      email_contact, telephone,
      ppe, ppe_precisions, ppe_proche_detecte, ppe_proche_precisions,
      piece_identite_type, piece_identite_numero, piece_identite_expiration,
      piece_identite_autorite,
      forme_juridique, siren, date_constitution, activite_principale, nom_gerant,
      beneficiaires_effectifs_json,
      pays_residence_fiscale,
      origine_fonds, origine_fonds_precisions,
      origine_fonds_vente_adresse, origine_fonds_donateur, origine_fonds_lien_defunt,
      mode_financement, mode_paiement, montant_operation,
      type_bien, lieu_bien,
      url_piece_identite, url_justif_domicile, url_avis_imposition,
      url_justif_revenus, url_justif_origine_fonds,
      url_kbis, url_statuts, url_cni_gerant, url_bilans, url_rbe,
      consentement_rgpd, consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as KycResponseRowFull[];

  try {
    const generatedAt = new Date().toISOString();

    let form;
    let signedAt: string;

    if (kycRows.length === 0) {
      // Aucune réponse KYC encore reçue → PDF avec dossier vide + nom agent
      form = { ...initialKycForm, nomPrenom: ownership.nom_prenom };
      signedAt = generatedAt;
    } else {
      const kyc = kycRows[0];
      form = kycRowToKycForm(kyc);
      signedAt = kyc.consentement_rgpd_at ?? kyc.submitted_at ?? generatedAt;
    }

    const hash = createHash("sha256")
      .update(JSON.stringify({
        id, signedAt, nom: form.nomPrenom, type: form.typeClient,
        naissance: form.dateNaissance, adresse: form.adresse,
        piece: form.pieceIdentiteNumero,
      }))
      .digest("hex");

    const html = buildKycHtml({ form, dossierId: id, hash, generatedAt, signedAt, partie });
    const buffer = await renderHtmlPdf(html);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fiche-kyc-klaris-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("KYC PDF render error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération PDF" },
      { status: 500 }
    );
  }
}
