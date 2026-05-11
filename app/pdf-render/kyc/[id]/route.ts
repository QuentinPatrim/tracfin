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

  const form = rowToForm(rows[0]);
  const generatedAt = url.searchParams.get("at") || new Date().toISOString();
  const hash = createHash("sha256")
    .update(JSON.stringify({ id, generatedAt, nom: form.nomPrenom, type: form.typeClient, naissance: form.dateNaissance, adresse: form.adresse }))
    .digest("hex");

  const html = buildKycHtml({ form, dossierId: id, hash, generatedAt });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
