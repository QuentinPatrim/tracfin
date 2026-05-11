// app/api/dossiers/[id]/pdf/route.ts — Attestation LCB-FT générée via Puppeteer (HTML direct, sans HTTP)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { computeScore } from "@/lib/tracfin";
import { rowToForm } from "@/lib/dossier";
import { computeContentHash } from "@/lib/pdf-helpers";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildAttestationHtml } from "@/app/pdf-render/attestation-template";
import type { Dossier } from "@/types/dossier";

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

  const rows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Dossier[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const form = rowToForm(rows[0]);
    const score = computeScore(form);
    const generatedAt = new Date().toISOString();
    const hash = computeContentHash(form, score, id, generatedAt);

    const html = buildAttestationHtml({ form, score, dossierId: id, hash, generatedAt });
    const buffer = await renderHtmlPdf(html);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attestation-klaris-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("PDF render error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération PDF" },
      { status: 500 }
    );
  }
}
