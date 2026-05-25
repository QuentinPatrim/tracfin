// app/api/dossiers/[id]/zip/route.ts — Export ZIP complet d'un dossier
// Contenu : attestation PDF + fiche KYC PDF + toutes les pièces justificatives Scaleway/Cloudinary

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import JSZip from "jszip";

import { sql } from "@/lib/db";
import { computeScore } from "@/lib/tracfin";
import { rowToForm, kycRowToKycForm, type KycResponseRowFull } from "@/lib/dossier";
import { getOrCreateAttestation } from "@/lib/attestation";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { logAudit } from "@/lib/audit";
import { getScope, findScopedDossier } from "@/lib/scope";
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

// Row du ZIP : tous les champs KYC complets + pièces (URLs)
type KycRow = KycResponseRowFull & KycFilesRow;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const dossier = await findScopedDossier<Dossier>(id, scope);
  if (!dossier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Dernière réponse KYC (données complètes + pièces + horodatage signature)
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
  `) as unknown as KycRow[];

  if (kycRows.length === 0) {
    return NextResponse.json({ error: "Aucune réponse KYC pour ce dossier" }, { status: 400 });
  }

  try {
    const generatedAt = new Date().toISOString();
    const kyc = kycRows[0];

    // ─── 1) Attestation PDF (snapshot opposable depuis lib/attestation) ──
    const formForAtt = rowToForm(dossier);
    const score = computeScore(formForAtt);
    const snapshot = await getOrCreateAttestation({
      dossierId: id,
      userId: scope.userId,
      orgId: scope.orgId,
      form: formForAtt,
      score,
    });
    const attHtml = buildAttestationHtml({
      form: snapshot.form_snapshot,
      score: snapshot.score_snapshot,
      dossierId: id,
      hash: snapshot.content_hash,
      generatedAt: snapshot.generated_at,
    });

    // ─── 2) Fiche KYC PDF (depuis kyc_responses, source de vérité client) ────
    const formForKyc = kycRowToKycForm(kyc);
    const signedAt = kyc.consentement_rgpd_at ?? kyc.submitted_at ?? generatedAt;
    const kycHash = createHash("sha256")
      .update(JSON.stringify({
        id, signedAt, nom: formForKyc.nomPrenom, type: formForKyc.typeClient,
        naissance: formForKyc.dateNaissance, adresse: formForKyc.adresse,
        piece: formForKyc.pieceIdentiteNumero,
      }))
      .digest("hex");
    const partie: "vendeur" | "acquereur" = dossier.partie === "vendeur" ? "vendeur" : "acquereur";
    const kycHtml = buildKycHtml({ form: formForKyc, dossierId: id, hash: kycHash, generatedAt, signedAt, partie });

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

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "attestation.emit",
      metadata: {
        attestation_id: snapshot.id,
        export: "zip",
        algo_version: snapshot.algo_version,
        niveau: snapshot.niveau,
        content_hash: snapshot.content_hash,
      },
      req,
    });

    // Note : la trace SHA-256 reste visible dans les pieds de page des PDFs.
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="klaris-${slug}-${shortId}.zip"`,
        "Cache-Control": "no-store",
        "X-Klaris-Attestation-SHA256": snapshot.content_hash,
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
