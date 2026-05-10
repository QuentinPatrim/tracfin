// app/api/files/[...key]/route.ts — GET stream d'une pièce justificative
// Auth : soit Clerk (agent qui possède le dossier), soit ?token=... (KYC public)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getFileStream } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  // Le 1er segment du key = dossierId (cf. lib/storage.ts uploadFile)
  const dossierId = keyParts[0];
  if (!/^[0-9a-f-]{36}$/i.test(dossierId)) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
  }

  // ─── Autorisation ─────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const kycToken = url.searchParams.get("token");

  if (kycToken) {
    const links = (await sql`
      SELECT dossier_id, expires_at FROM kyc_links
      WHERE token = ${kycToken} LIMIT 1
    `) as unknown as Array<{ dossier_id: string; expires_at: string }>;

    if (links.length === 0 || links[0].dossier_id !== dossierId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    if (new Date(links[0].expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expiré" }, { status: 410 });
    }
  } else {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const owns = (await sql`
      SELECT 1 FROM dossiers WHERE id = ${dossierId} AND user_id = ${userId} LIMIT 1
    `) as unknown as Array<{ "?column?": number }>;
    if (owns.length === 0) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  // ─── Stream depuis Scaleway ───────────────────────────────────────────────
  try {
    const { body, contentType, contentLength } = await getFileStream(key);
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };
    if (contentLength) headers["Content-Length"] = String(contentLength);

    return new Response(body, { headers });
  } catch (e) {
    console.error("S3 GET erreur:", e);
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
