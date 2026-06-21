// app/api/dossiers/[id]/validation/[vid]/route.ts — Décision du correspondant (4-yeux)

import { NextResponse } from "next/server";
import { getScope, findScopedDossier } from "@/lib/scope";
import { canValidate, decideValidation, ValidationError } from "@/lib/correspondant";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vid } = await params;

  // Ownership du dossier (scope-aware)
  const dossier = await findScopedDossier<{ id: string }>(id, scope, "id");
  if (!dossier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Habilitation : correspondant désigné ou admin de l'org
  const allowed = await canValidate(scope.userId, scope.orgId, scope.orgRole);
  if (!allowed) {
    return NextResponse.json(
      { error: "Vous n'êtes pas habilité à valider ce dossier (correspondant LCB-FT ou admin requis)." },
      { status: 403 },
    );
  }

  let body: { decision?: "approved" | "rejected"; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ error: "decision doit être 'approved' ou 'rejected'" }, { status: 400 });
  }

  try {
    const updated = await decideValidation({
      validationId: vid,
      dossierId: id,
      deciderId: scope.userId,
      decision: body.decision,
      comment: body.comment ?? "",
    });

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: body.decision === "approved" ? "validation.approve" : "validation.reject",
      metadata: { validation_id: vid, requested_by: updated.requested_by },
      req,
    });

    return NextResponse.json({ ok: true, validation: updated });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    }
    console.error("decideValidation error:", e);
    return NextResponse.json({ error: "Erreur de validation" }, { status: 500 });
  }
}
