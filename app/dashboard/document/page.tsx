// app/dashboard/document/page.tsx — Visionneuse de documents dans l'app
//
// On regarde d'abord, on télécharge si on veut. Documents Klaris (attestation,
// fiche client, déclaration, cartographie) : affichés depuis leur HTML (?view=html),
// identiques au PDF. Pièces du client : image affichée telle quelle, PDF dessiné
// page par page (pdf.js) — sur téléphone, un PDF ne s'affiche pas dans une page web.

import { notFound } from "next/navigation";
import DocViewer, { type DocSpec } from "@/components/dashboard/docs/DocViewer";
import "@/components/dashboard/docs/docs.css";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function specFrom(sp: SP): DocSpec | null {
  const d = one(sp.d);
  const id = one(sp.id);
  const short = id.slice(0, 8);
  switch (d) {
    case "attestation":
      if (!UUID.test(id)) return null;
      return { kind: "html", title: "Attestation de diligences", sub: "PDF horodaté, avec son empreinte", view: `/api/dossiers/${id}/pdf?view=html`, file: `/api/dossiers/${id}/pdf`, filename: `attestation-klaris-${short}.pdf`, back: `/dashboard/${id}` };
    case "fiche":
      if (!UUID.test(id)) return null;
      return { kind: "html", title: "Fiche client", sub: "Ce que le client a déclaré et signé", view: `/api/dossiers/${id}/kyc-pdf?view=html`, file: `/api/dossiers/${id}/kyc-pdf`, filename: `fiche-client-klaris-${short}.pdf`, back: `/dashboard/${id}` };
    case "declaration": {
      const did = one(sp.did);
      if (!UUID.test(id) || !UUID.test(did)) return null;
      return { kind: "html", title: "Brouillon de déclaration de soupçon", sub: "À reporter sur ERMES", view: `/api/dossiers/${id}/declaration/${did}/pdf?view=html`, file: `/api/dossiers/${id}/declaration/${did}/pdf`, filename: `declaration-soupcon-${short}.pdf`, back: `/dashboard/${id}#declaration` };
    }
    case "cartographie": {
      const m = Math.min(Math.max(Number(one(sp.months)) || 12, 1), 60);
      return { kind: "html", title: "Cartographie des risques", sub: `Sur ${m} mois`, view: `/api/cartography/pdf?months=${m}&view=html`, file: `/api/cartography/pdf?months=${m}`, filename: `cartographie-risques-klaris.pdf`, back: "/dashboard/cartographie" };
    }
    case "piece": {
      const src = one(sp.src);
      const name = one(sp.name).slice(0, 120) || "Pièce justificative";
      const ext = one(sp.ext).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
      // Seulement nos propres fichiers (ou l'ancien stockage Cloudinary).
      if (!(src.startsWith("/api/files/") || src.startsWith("https://res.cloudinary.com/"))) return null;
      const isImg = ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext);
      return { kind: isImg ? "image" : ext === "pdf" ? "pdf" : "other", title: name, sub: "Pièce transmise par le client", view: src, file: src, filename: `${name}.${ext || "bin"}`, back: UUID.test(id) ? `/dashboard/${id}#pieces` : "/dashboard" };
    }
  }
  return null;
}

export default async function DocumentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const spec = specFrom(await searchParams);
  if (!spec) notFound();
  return <DocViewer spec={spec} />;
}
