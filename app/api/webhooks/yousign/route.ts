// app/api/webhooks/yousign/route.ts — Réception des événements de signature Yousign
//
// Yousign POST un événement quand la demande change d'état. On traite :
//   - signature_request.done      → télécharge le PDF signé, le stocke, statut=signed
//   - signature_request.declined  → statut=declined
//   - signature_request.expired   → statut=expired
//
// Sécurité : vérification HMAC du body (header X-Yousign-Signature-256) si
// YOUSIGN_WEBHOOK_SECRET est configuré.

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyWebhookSignature, downloadSignedDocument } from "@/lib/yousign";
import { uploadBuffer } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { enqueueOutboundEvent } from "@/lib/outbound";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SignatureRow {
  id: string;
  dossier_id: string;
  user_id: string;
  org_id: string | null;
  provider_document_id: string | null;
  status: string;
}

export async function POST(req: Request) {
  // ⚠️ Body brut requis pour vérifier la signature HMAC.
  const rawBody = await req.text();
  const sigHeader =
    req.headers.get("x-yousign-signature-256") ??
    req.headers.get("X-Yousign-Signature-256");

  if (!verifyWebhookSignature(rawBody, sigHeader)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: {
    event_name?: string;
    data?: { signature_request?: { id?: string; status?: string } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.event_name ?? "";
  const requestId = event.data?.signature_request?.id;
  if (!requestId) {
    // Événement non lié à une demande (ping, autre) → on accuse réception.
    return NextResponse.json({ received: true, ignored: "no_request_id" });
  }

  // Retrouve notre ligne signature par provider_request_id.
  const rows = (await sql`
    SELECT id, dossier_id, user_id, org_id, provider_document_id, status
    FROM signatures
    WHERE provider_request_id = ${requestId}
    LIMIT 1
  `) as unknown as SignatureRow[];

  if (rows.length === 0) {
    return NextResponse.json({ received: true, ignored: "unknown_request" });
  }
  const signature = rows[0];

  try {
    switch (eventName) {
      case "signature_request.done": {
        // Télécharge le PDF signé et le stocke dans Scaleway.
        if (!signature.provider_document_id) {
          throw new Error("provider_document_id manquant sur la ligne signature");
        }
        const signedPdf = await downloadSignedDocument(requestId, signature.provider_document_id);
        const uploaded = await uploadBuffer(
          signedPdf,
          signature.dossier_id,
          "pdf",
          "application/pdf",
          "attestation-signee",
        );

        await sql`
          UPDATE signatures
          SET status = 'signed', signed_storage_key = ${uploaded.key},
              signed_at = NOW(), updated_at = NOW()
          WHERE id = ${signature.id}
        `;

        await logAudit({
          userId: signature.user_id,
          orgId: signature.org_id,
          dossierId: signature.dossier_id,
          action: "signature.signed",
          metadata: {
            signature_id: signature.id,
            provider_request_id: requestId,
            signed_storage_key: uploaded.key,
            sha256: uploaded.sha256,
          },
        });

        // Webhook sortant → CRM : l'attestation a été signée eIDAS.
        await enqueueOutboundEvent({
          dossierId: signature.dossier_id,
          userId: signature.user_id,
          orgId: signature.org_id,
          eventType: "dossier.signed",
          extra: { signatureId: signature.id },
        });
        break;
      }

      case "signature_request.declined":
      case "signature_request.expired": {
        const newStatus = eventName.endsWith("declined") ? "declined" : "expired";
        await sql`
          UPDATE signatures
          SET status = ${newStatus}, updated_at = NOW()
          WHERE id = ${signature.id}
        `;
        await logAudit({
          userId: signature.user_id,
          orgId: signature.org_id,
          dossierId: signature.dossier_id,
          action: "signature.declined",
          metadata: { signature_id: signature.id, provider_request_id: requestId, reason: newStatus },
        });
        break;
      }

      default:
        // Autres événements (ongoing, reminder…) → simple ACK
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Yousign webhook handler error:", e);
    // On marque la signature en erreur mais on renvoie 200 pour éviter les retries
    // en boucle de Yousign sur une erreur applicative (download, storage…).
    await sql`
      UPDATE signatures SET error_message = ${e instanceof Error ? e.message : String(e)}, updated_at = NOW()
      WHERE id = ${signature.id}
    `.catch(() => {});
    return NextResponse.json({ received: true, handlerError: true });
  }
}
