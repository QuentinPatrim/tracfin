// app/api/dossiers/[id]/kyc-pdf/route.ts — Fiche KYC générée depuis kyc_responses (source de vérité client)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { kycRowToForm, type KycResponseRow } from "@/lib/dossier";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildKycHtml } from "@/app/pdf-render/kyc-template";
import { initialForm } from "@/lib/tracfin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  // Vérifie ownership du dossier
  const owns = (await sql`
    SELECT nom_prenom FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Array<{ nom_prenom: string }>;
  if (owns.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Récupère la dernière réponse KYC du client (source de vérité)
  const kycRows = (await sql`
    SELECT type_client, nom_prenom, date_naissance, lieu_naissance, nationalite,
           pays_nationalite, adresse, profession, secteur_activite,
           ppe, ppe_proche_detecte, pays_residence_fiscale,
           origine_fonds, origine_fonds_precisions, mode_financement, mode_paiement,
           montant_operation, type_bien, lieu_bien,
           url_piece_identite, url_justif_domicile, url_kbis, url_statuts, url_cni_gerant,
           consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as Array<KycResponseRow & {
    consentement_rgpd_at: string | null;
    submitted_at: string | null;
  }>;

  try {
    const generatedAt = new Date().toISOString();

    let form;
    let signedAt: string;

    if (kycRows.length === 0) {
      // Aucune réponse KYC encore reçue → PDF avec dossier vide + nom agent
      form = { ...initialForm, nomPrenom: owns[0].nom_prenom };
      signedAt = generatedAt;
    } else {
      const kyc = kycRows[0];
      form = kycRowToForm(kyc);
      // Signature légale = horodatage de la soumission client
      signedAt = kyc.consentement_rgpd_at ?? kyc.submitted_at ?? generatedAt;
    }

    const hash = createHash("sha256")
      .update(JSON.stringify({
        id, signedAt, nom: form.nomPrenom, type: form.typeClient,
        naissance: form.dateNaissance, adresse: form.adresse,
      }))
      .digest("hex");

    const html = buildKycHtml({ form, dossierId: id, hash, generatedAt, signedAt });
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
