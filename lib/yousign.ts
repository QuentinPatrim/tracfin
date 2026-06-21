// lib/yousign.ts — Client Yousign API v3 (signature électronique eIDAS)
//
// Yousign est un prestataire de service de confiance qualifié eIDAS (UE 910/2014),
// français. On l'utilise pour faire signer électroniquement les attestations LCB-FT
// par le responsable désigné → force probante opposable (vs simple hash interne).
//
// Flux v3 :
//   1. POST /signature_requests            → crée la demande (draft)
//   2. POST /.../documents (multipart)     → joint le PDF de l'attestation
//   3. POST /.../signers                   → ajoute le signataire + champ signature
//   4. POST /.../activate                  → active (le signataire peut signer)
//   5. GET  /.../signers                   → récupère le signature_link (delivery_mode=none)
//   6. webhook signature_request.done      → GET /.../documents/{id}/download (PDF signé)
//
// Auth : Authorization: Bearer <YOUSIGN_API_KEY>
// Environnements : sandbox (api-sandbox.yousign.app) vs prod (api.yousign.app).
//   → contrôlé par YOUSIGN_API_BASE (défaut sandbox pour éviter les frais en dev).

import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_BASE = "https://api-sandbox.yousign.app/v3";

function apiBase(): string {
  return process.env.YOUSIGN_API_BASE || DEFAULT_BASE;
}

export class YousignError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "YousignError";
  }
}

function requireKey(): string {
  const key = process.env.YOUSIGN_API_KEY;
  if (!key) {
    throw new YousignError(
      "Signature électronique non configurée (YOUSIGN_API_KEY manquant).",
      503,
    );
  }
  return key;
}

async function ysFetch<T>(
  path: string,
  init: RequestInit & { rawBody?: BodyInit } = {},
): Promise<T> {
  const key = requireKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  // Pas de Content-Type forcé pour le multipart (fetch pose le boundary lui-même).
  if (init.body && typeof init.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new YousignError(`Yousign HTTP ${res.status} sur ${path}: ${detail.slice(0, 300)}`, res.status);
  }
  // Certains endpoints (activate) renvoient du JSON ; download renvoie du binaire.
  return (await res.json()) as T;
}

// ─── Types (sous-ensemble utile de l'API v3) ─────────────────────────────
export interface SignatureRequest {
  id: string;
  status: string;            // draft | ongoing | done | expired | declined …
}

export interface YousignDocument {
  id: string;
  nature?: string;
}

export interface YousignSigner {
  id: string;
  status?: string;
  signature_link?: string;   // présent après activation si delivery_mode=none
}

export interface SignerInput {
  firstName: string;
  lastName: string;
  email: string;
  /** Optionnel — requis seulement si authMode = otp_sms. Format E.164 (+33…). */
  phone?: string;
}

export interface SignatureFieldGeometry {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── 1. Créer la demande de signature ────────────────────────────────────
export async function createSignatureRequest(name: string): Promise<SignatureRequest> {
  return ysFetch<SignatureRequest>("/signature_requests", {
    method: "POST",
    body: JSON.stringify({
      name: name.slice(0, 255),
      delivery_mode: "none",     // pas d'email Yousign : on présente le lien dans Klaris
      timezone: "Europe/Paris",
    }),
  });
}

// ─── 2. Joindre le PDF ────────────────────────────────────────────────────
export async function uploadDocument(
  requestId: string,
  pdf: Buffer,
  filename: string,
): Promise<YousignDocument> {
  const key = requireKey();
  const form = new FormData();
  // Blob à partir du Buffer (Node 18+ : Blob & FormData globaux).
  form.append("file", new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), filename);
  form.append("nature", "signable_document");
  form.append("parse_anchors", "false");

  const res = await fetch(`${apiBase()}/signature_requests/${requestId}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new YousignError(`Yousign upload document HTTP ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  return (await res.json()) as YousignDocument;
}

// ─── 3. Ajouter le signataire + champ signature ──────────────────────────
export async function addSigner(
  requestId: string,
  documentId: string,
  signer: SignerInput,
  geometry: SignatureFieldGeometry,
): Promise<YousignSigner> {
  // Authentification du signataire : OTP par email (pas besoin de téléphone).
  // Pour une signature « avancée », passer à otp_sms + phone (à exposer plus tard).
  const authMode = signer.phone ? "otp_sms" : "otp_email";

  return ysFetch<YousignSigner>(`/signature_requests/${requestId}/signers`, {
    method: "POST",
    body: JSON.stringify({
      info: {
        first_name: signer.firstName || "—",
        last_name: signer.lastName || "—",
        email: signer.email,
        locale: "fr",
        ...(signer.phone ? { phone_number: signer.phone } : {}),
      },
      signature_level: "electronic_signature",
      signature_authentication_mode: authMode,
      fields: [
        {
          document_id: documentId,
          type: "signature",
          page: geometry.page,
          x: geometry.x,
          y: geometry.y,
          width: geometry.width,
          height: geometry.height,
        },
      ],
    }),
  });
}

// ─── 4. Activer la demande ────────────────────────────────────────────────
export async function activateSignatureRequest(requestId: string): Promise<SignatureRequest> {
  return ysFetch<SignatureRequest>(`/signature_requests/${requestId}/activate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// ─── 5. Récupérer le lien de signature (delivery_mode=none) ──────────────
export async function getSigners(requestId: string): Promise<YousignSigner[]> {
  const res = await ysFetch<{ data?: YousignSigner[] } | YousignSigner[]>(
    `/signature_requests/${requestId}/signers`,
  );
  // L'API renvoie soit { data: [...] }, soit directement un tableau selon la version.
  return Array.isArray(res) ? res : (res.data ?? []);
}

export async function getSignatureRequest(requestId: string): Promise<SignatureRequest> {
  return ysFetch<SignatureRequest>(`/signature_requests/${requestId}`);
}

// ─── 6. Télécharger le PDF signé ──────────────────────────────────────────
export async function downloadSignedDocument(
  requestId: string,
  documentId: string,
): Promise<Buffer> {
  const key = requireKey();
  const res = await fetch(
    `${apiBase()}/signature_requests/${requestId}/documents/${documentId}/download`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new YousignError(`Yousign download HTTP ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }
  const bytes = await res.arrayBuffer();
  return Buffer.from(bytes);
}

// ─── Vérification de la signature du webhook ─────────────────────────────
// Yousign signe ses webhooks avec un HMAC-SHA256 du body brut, header
// `X-Yousign-Signature-256: sha256=<hex>`. Si YOUSIGN_WEBHOOK_SECRET est défini
// on vérifie ; sinon on log un warning (mode dev permissif).
let warnedNoSecret = false;
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET;
  if (!secret) {
    if (!warnedNoSecret) {
      console.warn("[yousign] YOUSIGN_WEBHOOK_SECRET absent — webhook non vérifié (à configurer en prod).");
      warnedNoSecret = true;
    }
    return true; // fail-open en dev ; à durcir en prod via la variable
  }
  if (!signatureHeader) return false;

  const provided = signatureHeader.replace(/^sha256=/, "").trim();
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isConfigured(): boolean {
  return !!process.env.YOUSIGN_API_KEY;
}
