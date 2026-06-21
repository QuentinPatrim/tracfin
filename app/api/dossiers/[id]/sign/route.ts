// app/api/dossiers/[id]/sign/route.ts — Signature électronique eIDAS d'une attestation
//
// POST → génère l'attestation (page signature incluse), l'envoie à Yousign,
//        crée la demande, ajoute le signataire (l'agent connecté), active, et
//        renvoie le lien de signature à présenter dans l'UI.
// GET  → statut de la dernière signature du dossier + lien du PDF signé.

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { computeScore } from "@/lib/tracfin";
import { rowToForm } from "@/lib/dossier";
import { getOrCreateAttestation } from "@/lib/attestation";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildAttestationHtml, SIGNATURE_FIELD_GEOMETRY } from "@/app/pdf-render/attestation-template";
import {
  createSignatureRequest, uploadDocument, addSigner,
  activateSignatureRequest, getSigners, isConfigured, YousignError,
} from "@/lib/yousign";
import { logAudit } from "@/lib/audit";
import type { Dossier } from "@/types/dossier";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SignatureRow {
  id: string;
  status: string;
  signer_name: string;
  signer_email: string;
  signing_url: string | null;
  signed_storage_key: string | null;
  attestation_hash: string | null;
  provider_request_id: string | null;
  initiated_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = (await sql`
    SELECT id, status, signer_name, signer_email, signing_url, signed_storage_key,
           attestation_hash, provider_request_id, initiated_at, signed_at, created_at
    FROM signatures
    WHERE dossier_id = ${id}
    ORDER BY created_at DESC
  `) as unknown as SignatureRow[];

  const latest = rows[0] ?? null;
  return NextResponse.json({
    configured: isConfigured(),
    latest: latest
      ? {
          ...latest,
          // Lien de téléchargement du PDF signé (route /api/files protégée par scope)
          signedDownloadUrl: latest.signed_storage_key ? `/api/files/${latest.signed_storage_key}` : null,
        }
      : null,
    history: rows,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: "signature_unavailable",
        message: "La signature électronique n'est pas configurée (clé Yousign manquante).",
      },
      { status: 503 },
    );
  }

  const { id } = await params;
  const dossier = await findScopedDossier<Dossier>(id, scope);
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dossier.archived_at) {
    return NextResponse.json({ error: "Dossier archivé" }, { status: 409 });
  }

  // ─── Signataire = agent connecté (le responsable LCB-FT atteste) ──────
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "Email du signataire introuvable" }, { status: 400 });
  }
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? (user?.fullName ?? "Responsable LCB-FT");
  const signerName = (user?.fullName ?? `${firstName} ${lastName}`).trim() || "Responsable LCB-FT";

  try {
    // ─── Snapshot + PDF (avec page signature) ──────────────────────────
    const form = rowToForm(dossier);
    const score = computeScore(form);
    const snapshot = await getOrCreateAttestation({
      dossierId: id,
      userId: scope.userId,
      orgId: scope.orgId,
      form,
      score,
    });
    const html = buildAttestationHtml({
      form: snapshot.form_snapshot,
      score: snapshot.score_snapshot,
      dossierId: id,
      hash: snapshot.content_hash,
      generatedAt: snapshot.generated_at,
      forSignature: true,
    });
    const pdf = await renderHtmlPdf(html);

    // ─── Yousign : demande → document → signataire → activation ─────────
    const requestName = `Attestation LCB-FT ${id.slice(0, 8).toUpperCase()} — ${dossier.nom_prenom}`;
    const request = await createSignatureRequest(requestName);
    const document = await uploadDocument(request.id, pdf, `attestation-${id.slice(0, 8)}.pdf`);
    await addSigner(
      request.id,
      document.id,
      { firstName, lastName, email },
      {
        page: SIGNATURE_FIELD_GEOMETRY.page,
        x: SIGNATURE_FIELD_GEOMETRY.x,
        y: SIGNATURE_FIELD_GEOMETRY.y,
        width: SIGNATURE_FIELD_GEOMETRY.width,
        height: SIGNATURE_FIELD_GEOMETRY.height,
      },
    );
    await activateSignatureRequest(request.id);

    // Récupère le lien de signature (delivery_mode=none → pas d'email Yousign)
    const signers = await getSigners(request.id);
    const signingUrl = signers[0]?.signature_link ?? null;

    // ─── Persistance ────────────────────────────────────────────────────
    const inserted = (await sql`
      INSERT INTO signatures (
        dossier_id, user_id, org_id, attestation_hash,
        provider, provider_request_id, provider_document_id,
        signer_name, signer_email, level, status, signing_url, initiated_at
      ) VALUES (
        ${id}, ${scope.userId}, ${scope.orgId}, ${snapshot.content_hash},
        'yousign', ${request.id}, ${document.id},
        ${signerName}, ${email}, 'electronic_signature', 'pending', ${signingUrl}, NOW()
      )
      RETURNING id
    `) as unknown as Array<{ id: string }>;

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "signature.initiate",
      metadata: {
        signature_id: inserted[0].id,
        provider: "yousign",
        provider_request_id: request.id,
        signer_email: email,
        attestation_hash: snapshot.content_hash,
      },
      req,
    });

    return NextResponse.json({
      ok: true,
      signatureId: inserted[0].id,
      signingUrl,
      status: "pending",
    }, { status: 201 });
  } catch (e) {
    if (e instanceof YousignError) {
      return NextResponse.json(
        { error: "yousign_error", message: e.message },
        { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    console.error("Signature initiate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de signature" },
      { status: 500 },
    );
  }
}
