// app/pdf-render/kyc/demo/route.ts — Aperçu PUBLIC de la fiche KYC (données fictives)
//
// Rend le VRAI template de fiche KYC (buildKycHtml) avec le dossier démo
// « Camille Rousseau » → rendu identique au document réel. Aucune donnée réelle,
// aucun secret (≠ route [id] protégée). Le segment statique "demo" prime sur [id].

import { createHash } from "crypto";
import { buildKycHtml } from "../../kyc-template";
import { buildDemoKycForm } from "@/lib/demo-kyc";
import { DEMO_DOSSIER_ID, DEMO_GENERATED_AT, DEMO_SIGNED_AT } from "@/lib/demo-pdf";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  const form = buildDemoKycForm("acquereur");
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        id: DEMO_DOSSIER_ID,
        signedAt: DEMO_SIGNED_AT,
        nom: form.nomPrenom,
        type: form.typeClient,
        naissance: form.dateNaissance,
        adresse: form.adresse,
        piece: form.pieceIdentiteNumero,
      }),
    )
    .digest("hex");

  const html = buildKycHtml({
    form,
    dossierId: DEMO_DOSSIER_ID,
    hash,
    generatedAt: DEMO_GENERATED_AT,
    signedAt: DEMO_SIGNED_AT,
    partie: "acquereur",
  });
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
