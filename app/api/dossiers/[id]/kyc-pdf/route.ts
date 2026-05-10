// app/api/dossiers/[id]/kyc-pdf/route.ts — Génération PDF KYC

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { rowToForm } from "@/lib/dossier";
import type { Dossier } from "@/types/dossier";
import { generateKycPdfBuffer } from "@/components/pdf/KycPDF";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const rows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Dossier[];
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = rowToForm(rows[0]);

  // Génère le PDF sans JSX pour éviter les erreurs Turbopack
  const buffer = await generateKycPdfBuffer(form, id);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fiche-kyc-halo-${id.slice(0, 8)}.pdf"`,
    },
  });
}
