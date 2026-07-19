// app/api/entreprise/fiche-pdf/route.ts — Export PDF de la fiche entreprise
//
// Génère le document « Fiche entreprise & classification des risques » (L.561-4-1)
// à partir du profil de conformité du scope courant. Même pipeline Puppeteer que
// l'attestation et la déclaration de soupçon.

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getScope } from "@/lib/scope";
import { buildVigilance } from "@/lib/vigilance";
import { renderHtmlPdf } from "@/lib/pdf-renderer";
import { buildEntrepriseHtml, type EntrepriseProfileForPdf } from "@/app/pdf-render/entreprise-template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface ProfileRow {
  siren: string | null;
  raison_sociale: string;
  forme_juridique: string | null;
  naf_code: string | null;
  naf_libelle: string | null;
  date_creation: string | null;
  effectif: string | null;
  categorie: string | null;
  adresse: string | null;
  dirigeants: unknown;
  finances: unknown;
  activites: unknown;
  clienteles: unknown;
  notes: string | null;
}

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = scope.isOrgContext
    ? ((await sql`SELECT * FROM entreprise_profiles WHERE org_id = ${scope.orgId} LIMIT 1`) as unknown as ProfileRow[])
    : ((await sql`SELECT * FROM entreprise_profiles WHERE user_id = ${scope.userId} AND org_id IS NULL LIMIT 1`) as unknown as ProfileRow[]);
  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { error: "Aucun profil d'entreprise — configurez-le d'abord dans l'onglet Entreprise." },
      { status: 404 },
    );
  }

  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const profile: EntrepriseProfileForPdf = {
    siren: row.siren ?? "",
    raisonSociale: row.raison_sociale,
    formeJuridique: row.forme_juridique ?? "",
    nafCode: row.naf_code ?? "",
    nafLibelle: row.naf_libelle ?? "",
    dateCreation: row.date_creation ?? "",
    effectif: row.effectif ?? "",
    categorie: row.categorie ?? "",
    adresse: row.adresse ?? "",
    dirigeants: asArr(row.dirigeants),
    finances: asArr(row.finances),
    activites: asArr(row.activites),
    clienteles: asArr(row.clienteles),
    notes: row.notes ?? "",
  };

  let scopeLabel = "Espace personnel";
  if (scope.orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: scope.orgId });
      scopeLabel = `Organisation : ${org.name}`;
    } catch {
      scopeLabel = `Organisation ${scope.orgId.slice(-8)}`;
    }
  }

  const html = buildEntrepriseHtml({
    profile,
    vigilance: buildVigilance(profile.activites, profile.clienteles),
    generatedAt: new Date().toISOString(),
    scopeLabel,
  });

  try {
    const buffer = await renderHtmlPdf(html);
    const slug = profile.siren || profile.raisonSociale.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || "entreprise";
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fiche-conformite-${slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Entreprise fiche PDF render error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de génération PDF" },
      { status: 500 },
    );
  }
}
