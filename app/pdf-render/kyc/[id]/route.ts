// app/pdf-render/kyc/[id]/route.ts — Route de rendu HTML legacy (PDF_RENDER_SECRET)
// Conservée pour rétro-compat ; le path principal est /api/dossiers/[id]/kyc-pdf.

import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { kycRowToKycForm, type KycResponseRowFull } from "@/lib/dossier";
import { initialKycForm } from "@/lib/kyc";
import { buildKycHtml } from "../../kyc-template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token || token !== process.env.PDF_RENDER_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Bad request", { status: 400 });
  }

  // Récupère la partie du dossier (vendeur / acquéreur)
  const dossierRows = (await sql`
    SELECT partie FROM dossiers WHERE id = ${id} LIMIT 1
  `) as unknown as Array<{ partie: "vendeur" | "acquereur" | null }>;
  const partie: "vendeur" | "acquereur" =
    dossierRows[0]?.partie === "vendeur" ? "vendeur" : "acquereur";

  // Récupère la dernière réponse KYC complète
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

  const generatedAt = url.searchParams.get("at") || new Date().toISOString();
  const form = kycRows.length > 0 ? kycRowToKycForm(kycRows[0]) : { ...initialKycForm };
  const signedAt = kycRows[0]?.consentement_rgpd_at ?? kycRows[0]?.submitted_at ?? generatedAt;

  const hash = createHash("sha256")
    .update(JSON.stringify({
      id, signedAt, nom: form.nomPrenom, type: form.typeClient,
      naissance: form.dateNaissance, adresse: form.adresse,
      piece: form.pieceIdentiteNumero,
    }))
    .digest("hex");

  const html = buildKycHtml({ form, dossierId: id, hash, generatedAt, signedAt, partie });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
