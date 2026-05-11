// app/api/dossiers/[id]/kyc-pdf/route.ts — Fiche KYC générée via Puppeteer (HTML direct, sans HTTP)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { sql } from "@/lib/db";
import { rowToForm } from "@/lib/dossier";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildKycHtml } from "@/app/pdf-render/kyc-template";
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

  // Date de signature = soumission KYC du client (preuve légale, pas date de génération)
  const sigRows = (await sql`
    SELECT consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as Array<{ consentement_rgpd_at: string | null; submitted_at: string | null }>;

  try {
    const form = rowToForm(rows[0]);
    const generatedAt = new Date().toISOString();
    const signedAt =
      sigRows[0]?.consentement_rgpd_at ||
      sigRows[0]?.submitted_at ||
      generatedAt;

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
