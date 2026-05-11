// app/pdf-render/attestation/[id]/route.ts — Page de rendu HTML pour l'attestation
// Protégée par PDF_RENDER_SECRET (jamais exposé au client — utilisée seulement par Puppeteer côté serveur)

import { sql } from "@/lib/db";
import { computeScore } from "@/lib/tracfin";
import { rowToForm } from "@/lib/dossier";
import { computeContentHash } from "@/lib/pdf-helpers";
import { buildAttestationHtml } from "../../attestation-template";
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
  const score = computeScore(form);
  const generatedAt = url.searchParams.get("at") || new Date().toISOString();
  const hash = computeContentHash(form, score, id, generatedAt);

  const html = buildAttestationHtml({ form, score, dossierId: id, hash, generatedAt });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
