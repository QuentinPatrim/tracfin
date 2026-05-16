// app/api/dossiers/[id]/zip/route.ts — Export ZIP complet d'un dossier
// Contenu : attestation PDF + fiche KYC PDF + toutes les pièces justificatives Scaleway/Cloudinary

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import JSZip from "jszip";

import { sql } from "@/lib/db";
import { computeScore } from "@/lib/tracfin";
import { rowToForm, kycRowToForm } from "@/lib/dossier";
import { computeContentHash } from "@/lib/pdf-helpers";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildAttestationHtml } from "@/app/pdf-render/attestation-template";
import { buildKycHtml } from "@/app/pdf-render/kyc-template";
import { listDossierFiles, type KycFilesRow } from "@/lib/dossier-files";
import { getFileBuffer } from "@/lib/storage";
import type { Dossier } from "@/types/dossier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/** Slug d'un nom de client : "Delsol Quentin" → "delsol-quentin" */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")    // retire les diacritiques (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "client";
}

interface KycRow extends KycFilesRow {
  type_client: string | null;
  nom_prenom: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  pays_nationalite: string | null;
  adresse: string | null;
  profession: string | null;
  secteur_activite: string | null;
  ppe: boolean | null;
  ppe_proche_detecte: boolean | null;
  pays_residence_fiscale: string | null;
  origine_fonds: string | null;
  origine_fonds_precisions: string | null;
  mode_financement: string | null;
  mode_paiement: string | null;
  montant_operation: string | null;
  type_bien: string | null;
  lieu_bien: string | null;
  consentement_rgpd_at: string | null;
  submitted_at: string | null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  // Vérifie ownership
  const dossierRows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Dossier[];
  if (dossierRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const dossier = dossierRows[0];

  // Dernière réponse KYC (données + pièces + horodatage signature)
  const kycRows = (await sql`
    SELECT type_client, nom_prenom, date_naissance, lieu_naissance, nationalite,
           pays_nationalite, adresse, profession, secteur_activite,
           ppe, ppe_proche_detecte, pays_residence_fiscale,
           origine_fonds, origine_fonds_precisions, mode_financement, mode_paiement,
           montant_operation, type_bien, lieu_bien,
           url_piece_identite, url_justif_domicile, url_avis_imposition,
           url_justif_revenus, url_justif_origine_fonds,
           url_kbis, url_statuts, url_cni_gerant, url_bilans, url_rbe,
           consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as KycRow[];

  if (kycRows.length === 0) {
    return NextResponse.json({ error: "Aucune réponse KYC pour ce dossier" }, { status: 400 });
  }

  try {
    const generatedAt = new Date().toISOString();
    const kyc = kycRows[0];

    // ─── 1) Attestation PDF (depuis dossiers) ────────────────────────────
    const formForAtt = rowToForm(dossier);
    const score = computeScore(formForAtt);
    const attHash = computeContentHash(formForAtt, score, id, generatedAt);
    const attHtml = buildAttestationHtml({ form: formForAtt, score, dossierId: id, hash: attHash, generatedAt });

    // ─── 2) Fiche KYC PDF (depuis kyc_responses, source de vérité client) ────
    const formForKyc = kycRowToForm(kyc);
    const signedAt = kyc.consentement_rgpd_at ?? kyc.submitted_at ?? generatedAt;
    const kycHash = createHash("sha256")
      .update(JSON.stringify({
        id, signedAt, nom: formForKyc.nomPrenom, type: formForKyc.typeClient,
        naissance: formForKyc.dateNaissance, adresse: formForKyc.adresse,
      }))
      .digest("hex");
    const kycHtml = buildKycHtml({ form: formForKyc, dossierId: id, hash: kycHash, generatedAt, signedAt });

    // Génération séquentielle (parallèle = trop de RAM Vercel serverless)
    const attBuffer = await renderHtmlPdf(attHtml);
    const kycPdfBuffer = await renderHtmlPdf(kycHtml);

    // ─── 3) Construire le ZIP avec JSZip ──────────────────────────────────
    // Slug du nom client utilisé dans tous les noms de fichiers
    const slug = slugify(dossier.nom_prenom || "client");
    const shortId = id.slice(0, 8);

    const zip = new JSZip();
    zip.file(`attestation-${slug}-${shortId}.pdf`, attBuffer);
    zip.file(`fiche-kyc-${slug}-${shortId}.pdf`, kycPdfBuffer);

    // ─── 4) Pièces justificatives ────────────────────────────────────────
    const files = listDossierFiles(kyc);
    const piecesFolder = zip.folder("pieces");

    for (const f of files) {
      try {
        let buf: Buffer;
        if (f.storageKey) {
          // Pièce Scaleway → SDK v3 transformToByteArray (runtime-safe)
          const { buffer } = await getFileBuffer(f.storageKey);
          buf = buffer;
        } else {
          // Pièce legacy Cloudinary → fetch HTTP
          const res = await fetch(f.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          buf = Buffer.from(await res.arrayBuffer());
        }
        if (buf.length === 0) throw new Error("fichier vide");
        // Préfixe le nom de fichier par le slug du client
        const ext = f.filename.split(".").pop() ?? "bin";
        const baseName = f.filename.replace(/\.[^.]+$/, "");
        piecesFolder?.file(`${slug}-${baseName}.${ext}`, buf);
      } catch (e) {
        const reason = e instanceof Error ? e.message : "unknown";
        console.error(`ZIP: failed to fetch piece ${f.key} (${f.storageKey ?? f.url}):`, reason);
        piecesFolder?.file(
          `MANQUANT-${slug}-${f.filename}.txt`,
          `Fichier indisponible (${f.label})\nSource: ${f.storageKey ?? f.url}\nErreur: ${reason}`
        );
      }
    }

    // ─── 5) Génération + réponse ─────────────────────────────────────────
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Note : la trace SHA-256 reste visible dans les pieds de page des PDFs.
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="klaris-${slug}-${shortId}.zip"`,
        "Cache-Control": "no-store",
        "X-Klaris-Attestation-SHA256": attHash,
        "X-Klaris-Kyc-SHA256": kycHash,
      },
    });
  } catch (e) {
    console.error("ZIP build error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur d'export ZIP" },
      { status: 500 }
    );
  }
}
