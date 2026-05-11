// app/pdf-render/kyc/[id]/route.ts — Page de rendu HTML pour la fiche KYC
// Protégée par PDF_RENDER_SECRET (jamais exposé au client — utilisée seulement par Puppeteer côté serveur)

import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { rowToForm } from "@/lib/dossier";
import { buildKycHtml } from "../../kyc-template";
import type { Dossier } from "@/types/dossier";

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

  const rows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} LIMIT 1
  `) as unknown as Dossier[];
  if (rows.length === 0) return new Response("Not found", { status: 404 });

  // Date de signature électronique = quand le client a soumis le KYC (preuve légale)
  // Source : kyc_responses.consentement_rgpd_at (v2) ou submitted_at (v1, fallback)
  const sigRows = (await sql`
    SELECT consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as Array<{ consentement_rgpd_at: string | null; submitted_at: string | null }>;

  const form = rowToForm(rows[0]);
  const generatedAt = url.searchParams.get("at") || new Date().toISOString();
  const signedAt =
    sigRows[0]?.consentement_rgpd_at ||
    sigRows[0]?.submitted_at ||
    generatedAt;   // dernier recours si dossier sans soumission KYC

  const hash = createHash("sha256")
    .update(JSON.stringify({
      id, signedAt, nom: form.nomPrenom, type: form.typeClient,
      naissance: form.dateNaissance, adresse: form.adresse,
    }))
    .digest("hex");

  const html = buildKycHtml({ form, dossierId: id, hash, generatedAt, signedAt });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
