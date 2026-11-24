// lib/doc-view.ts — Afficher un document Klaris dans l'app, sans le télécharger
//
// Les PDF Klaris (attestation, fiche client, déclaration, cartographie) sont rendus
// depuis du HTML. Avec ?view=html, la route renvoie ce même HTML (même instantané,
// même empreinte) pour la visionneuse de l'app : net, toutes les pages, instantané,
// et sans ouvrir de page noire sur téléphone. Le PDF reste le fichier à télécharger.

import { NextResponse } from "next/server";

export function wantsHtmlView(req: Request): boolean {
  try {
    return new URL(req.url).searchParams.get("view") === "html";
  } catch {
    return false;
  }
}

/** Le HTML du document, avec un habillage d'écran : pages A4 posées sur un fond gris. */
export function htmlViewResponse(html: string): NextResponse {
  const screen = `<style>
@media screen {
  html, body { background: #E8EBF4 !important; }
  body { padding: 18px 0 28px; }
  .page { margin: 0 auto 18px !important; box-shadow: 0 1px 2px rgba(11,20,53,.08), 0 18px 40px -24px rgba(11,20,53,.45); border-radius: 6px; }
}
</style>`;
  const out = html.includes("</head>") ? html.replace("</head>", `${screen}</head>`) : screen + html;
  return new NextResponse(out, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
