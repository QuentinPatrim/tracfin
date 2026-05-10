// app/api/upload/route.ts — POST upload d'une pièce justificative vers Scaleway
// Auth : soit Clerk (agent), soit token KYC (client public)

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  const dossierId = formData.get("dossierId");
  const kycToken = formData.get("kycToken");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (typeof dossierId !== "string" || !/^[0-9a-f-]{36}$/i.test(dossierId)) {
    return NextResponse.json({ error: "dossierId invalide" }, { status: 400 });
  }

  // ─── Autorisation ─────────────────────────────────────────────────────────
  if (typeof kycToken === "string" && kycToken.length > 0) {
    // Voie publique : token KYC valide pour ce dossier
    const links = (await sql`
      SELECT dossier_id, status, expires_at FROM kyc_links
      WHERE token = ${kycToken} LIMIT 1
    `) as unknown as Array<{ dossier_id: string; status: string; expires_at: string }>;

    if (links.length === 0) {
      return NextResponse.json({ error: "Token invalide" }, { status: 403 });
    }
    const link = links[0];
    if (link.dossier_id !== dossierId) {
      return NextResponse.json({ error: "Token / dossier incohérents" }, { status: 403 });
    }
    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expiré" }, { status: 410 });
    }
    if (link.status === "completed") {
      return NextResponse.json({ error: "KYC déjà soumis" }, { status: 409 });
    }
  } else {
    // Voie agent : Clerk + ownership du dossier
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const owns = (await sql`
      SELECT 1 FROM dossiers WHERE id = ${dossierId} AND user_id = ${userId} LIMIT 1
    `) as unknown as Array<{ "?column?": number }>;
    if (owns.length === 0) {
      return NextResponse.json({ error: "Dossier inconnu" }, { status: 403 });
    }
  }

  // ─── Upload ───────────────────────────────────────────────────────────────
  try {
    const result = await uploadFile(file, dossierId);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Upload S3 erreur:", e);
    return NextResponse.json({ error: "Erreur de stockage" }, { status: 500 });
  }
}
