// app/api/entreprise/lookup/route.ts — Recherche d'entreprise au registre officiel
//
// Proxy authentifié vers recherche-entreprises.api.gouv.fr (données publiques
// INSEE/INPI). Utilisé par l'onboarding du profil de conformité.

import { NextResponse } from "next/server";
import { getScope } from "@/lib/scope";
import { searchEntreprises } from "@/lib/entreprise";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchEntreprises(q);
    return NextResponse.json({ results });
  } catch (e) {
    console.error("entreprise/lookup:", e);
    return NextResponse.json(
      { error: "Le registre des entreprises est momentanément indisponible. Réessayez ou saisissez manuellement." },
      { status: 502 },
    );
  }
}
