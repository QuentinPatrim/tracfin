// app/api/dossiers/[id]/pdf/route.ts — Attestation LCB-FT générée via Puppeteer (HTML direct, sans HTTP)

import { NextResponse } from "next/server";
import { computeScore } from "@/lib/tracfin";
import { rowToForm } from "@/lib/dossier";
import { getOrCreateAttestation } from "@/lib/attestation";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildAttestationHtml } from "@/app/pdf-render/attestation-template";
import { logAudit } from "@/lib/audit";
import { getScope, findScopedDossier } from "@/lib/scope";
import type { Dossier } from "@/types/dossier";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const dossier = await findScopedDossier<Dossier>(id, scope);
  if (!dossier) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // ⚠️ Le score n'est PAS calculé à la volée pour le PDF : on persiste un
    // snapshot {form, score} dans la table `attestations` et on rend le PDF
    // à partir de cette ligne immuable. Re-télécharger le PDF rend la même
    // attestation (même hash) tant que le dossier n'a pas changé.
    const form = rowToForm(dossier);
    const score = computeScore(form);
    const snapshot = await getOrCreateAttestation({
      dossierId: id,
      userId: scope.userId,
      orgId: scope.orgId,
      form,
      score,
    });

    const html = buildAttestationHtml({
      form: snapshot.form_snapshot,
      score: snapshot.score_snapshot,
      dossierId: id,
      hash: snapshot.content_hash,
      generatedAt: snapshot.generated_at,
    });
    const buffer = await renderHtmlPdf(html);

    await logAudit({
      userId: scope.userId,
      orgId: scope.orgId,
      dossierId: id,
      action: "attestation.emit",
      metadata: {
        attestation_id: snapshot.id,
        algo_version: snapshot.algo_version,
        niveau: snapshot.niveau,
        content_hash: snapshot.content_hash,
      },
      req,
    });

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
