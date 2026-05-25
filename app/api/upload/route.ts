// app/api/upload/route.ts — POST upload d'une pièce justificative vers Scaleway
// Auth : soit Clerk (agent), soit token KYC (client public)

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { uploadFile, UploadError } from "@/lib/storage";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit, ipFromRequest } from "@/lib/ratelimit";
import { getScope, findScopedDossier } from "@/lib/scope";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  // Rate limit par IP : 30 uploads / 10 min. Largement assez pour un KYC normal
  // (10 pièces max), bloque l'abus du endpoint public.
  const rl = await enforceRateLimit({
    key: `upload:${ipFromRequest(req)}`,
    limit: 30,
    windowSec: 600,
  });
  if (rl) return rl;

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
  let auditUserId: string | null = null;
  let auditOrgId: string | null = null;
  let uploadOrigin: "agent" | "client" = "agent";

  if (typeof kycToken === "string" && kycToken.length > 0) {
    // Voie publique : token KYC valide pour ce dossier (pas de scope agent
    // requis — le token porte l'autorisation). On lit le scope du dossier lié
    // pour tracer correctement dans audit_events.
    uploadOrigin = "client";
    const links = (await sql`
      SELECT dossier_id, org_id, status, expires_at FROM kyc_links
      WHERE token = ${kycToken} LIMIT 1
    `) as unknown as Array<{ dossier_id: string; org_id: string | null; status: string; expires_at: string }>;

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
    auditOrgId = link.org_id;
  } else {
    // Voie agent : Clerk + ownership scopé (user perso OU org)
    const scope = await getScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    auditUserId = scope.userId;
    auditOrgId = scope.orgId;
    const owns = await findScopedDossier<{ id: string }>(dossierId, scope, "id");
    if (!owns) {
      return NextResponse.json({ error: "Dossier inconnu" }, { status: 403 });
    }
  }

  // ─── Upload ───────────────────────────────────────────────────────────────
  try {
    const result = await uploadFile(file, dossierId);
    await logAudit({
      userId: auditUserId,
      orgId: auditOrgId,
      dossierId,
      action: "file.upload",
      metadata: {
        origin: uploadOrigin,
        size: result.size,
        sha256: result.sha256,
        content_type: result.contentType,
      },
      req,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Upload S3 erreur:", e);
    return NextResponse.json({ error: "Erreur de stockage" }, { status: 500 });
  }
}
