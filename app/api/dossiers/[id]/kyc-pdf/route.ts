// app/api/dossiers/[id]/kyc-pdf/route.ts — Fiche KYC générée via Puppeteer

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { renderPagePdf, pdfRenderToken, internalBaseUrl } from "@/lib/pdf-renderer";

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

  const owns = (await sql`
    SELECT 1 FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Array<{ "?column?": number }>;
  if (owns.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const base = internalBaseUrl();
    const at = new Date().toISOString();
    const renderUrl = `${base}/pdf-render/kyc/${id}?token=${encodeURIComponent(pdfRenderToken())}&at=${encodeURIComponent(at)}`;

    const buffer = await renderPagePdf(renderUrl);

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
