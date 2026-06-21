// app/pdf-render/attestation/demo/route.ts — Aperçu PUBLIC de l'attestation (données fictives)
//
// Rend le VRAI template d'attestation (buildAttestationHtml) avec le dossier démo
// « Camille Rousseau » → rendu identique au document réel, pour l'aperçu marketing
// sur la landing. Aucune donnée réelle, aucun secret requis (≠ route [id] protégée).
// Le segment statique "demo" prime sur le segment dynamique [id].

import { buildAttestationHtml } from "../../attestation-template";
import { buildDemoAttestation, DEMO_DOSSIER_ID, DEMO_GENERATED_AT } from "@/lib/demo-pdf";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  const { form, score, hash } = buildDemoAttestation();
  const html = buildAttestationHtml({
    form,
    score,
    dossierId: DEMO_DOSSIER_ID,
    hash,
    generatedAt: DEMO_GENERATED_AT,
  });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
