// app/api/entreprise/profile/route.ts — Profil de conformité d'entreprise (GET / PUT)
//
// Un profil par scope (perso ou org). GET renvoie { profile: null } si aucun.
// PUT upsert le profil (identité registre + déclaratif activités/clientèles).

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope, type Scope } from "@/lib/scope";

export const dynamic = "force-dynamic";

interface ProfileRow {
  id: string;
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
  updated_at: string;
}

async function findProfile(scope: Scope): Promise<ProfileRow | null> {
  const rows = scope.isOrgContext
    ? ((await sql`SELECT * FROM entreprise_profiles WHERE org_id = ${scope.orgId} LIMIT 1`) as unknown as ProfileRow[])
    : ((await sql`SELECT * FROM entreprise_profiles WHERE user_id = ${scope.userId} AND org_id IS NULL LIMIT 1`) as unknown as ProfileRow[]);
  return rows[0] ?? null;
}

function toApi(row: ProfileRow) {
  return {
    id: row.id,
    siren: row.siren ?? "",
    raisonSociale: row.raison_sociale,
    formeJuridique: row.forme_juridique ?? "",
    nafCode: row.naf_code ?? "",
    nafLibelle: row.naf_libelle ?? "",
    dateCreation: row.date_creation ?? "",
    effectif: row.effectif ?? "",
    categorie: row.categorie ?? "",
    adresse: row.adresse ?? "",
    dirigeants: Array.isArray(row.dirigeants) ? row.dirigeants : [],
    finances: Array.isArray(row.finances) ? row.finances : [],
    activites: Array.isArray(row.activites) ? row.activites : [],
    clienteles: Array.isArray(row.clienteles) ? row.clienteles : [],
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const row = await findProfile(scope);
    return NextResponse.json({ profile: row ? toApi(row) : null });
  } catch (e) {
    // Table absente (migration vague4 pas encore appliquée) → état explicite,
    // la page affiche un message d'installation au lieu d'un écran d'erreur.
    if (e instanceof Error && /does not exist/i.test(e.message)) {
      return NextResponse.json({ profile: null, needsMigration: true });
    }
    console.error("entreprise/profile GET:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const asStringArray = (v: unknown, max = 20): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : [];

const asStr = (v: unknown, max = 300): string =>
  typeof v === "string" ? v.slice(0, max) : "";

export async function PUT(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const raisonSociale = asStr(body.raisonSociale, 200).trim();
  if (!raisonSociale) {
    return NextResponse.json({ error: "La raison sociale est requise" }, { status: 400 });
  }

  const dirigeants = Array.isArray(body.dirigeants)
    ? (body.dirigeants as Array<Record<string, unknown>>)
        .map((d) => ({ nom: asStr(d?.nom, 120), qualite: asStr(d?.qualite, 120) }))
        .filter((d) => d.nom)
        .slice(0, 10)
    : [];
  const finances = Array.isArray(body.finances)
    ? (body.finances as Array<Record<string, unknown>>)
        .map((f) => ({
          annee: asStr(f?.annee, 4),
          ca: typeof f?.ca === "number" ? f.ca : null,
          resultatNet: typeof f?.resultatNet === "number" ? f.resultatNet : null,
        }))
        .filter((f) => f.annee)
        .slice(0, 5)
    : [];

  const fields = {
    siren: asStr(body.siren, 9),
    raison_sociale: raisonSociale,
    forme_juridique: asStr(body.formeJuridique, 120),
    naf_code: asStr(body.nafCode, 10),
    naf_libelle: asStr(body.nafLibelle, 200),
    date_creation: asStr(body.dateCreation, 10),
    effectif: asStr(body.effectif, 60),
    categorie: asStr(body.categorie, 20),
    adresse: asStr(body.adresse, 300),
    dirigeants: JSON.stringify(dirigeants),
    finances: JSON.stringify(finances),
    activites: JSON.stringify(asStringArray(body.activites)),
    clienteles: JSON.stringify(asStringArray(body.clienteles)),
    notes: asStr(body.notes, 2000),
  };

  try {
    const existing = await findProfile(scope);
    if (existing) {
      await sql`
        UPDATE entreprise_profiles SET
          siren = ${fields.siren}, raison_sociale = ${fields.raison_sociale},
          forme_juridique = ${fields.forme_juridique}, naf_code = ${fields.naf_code},
          naf_libelle = ${fields.naf_libelle}, date_creation = ${fields.date_creation},
          effectif = ${fields.effectif}, categorie = ${fields.categorie},
          adresse = ${fields.adresse},
          dirigeants = ${fields.dirigeants}::jsonb, finances = ${fields.finances}::jsonb,
          activites = ${fields.activites}::jsonb, clienteles = ${fields.clienteles}::jsonb,
          notes = ${fields.notes}, updated_at = now()
        WHERE id = ${existing.id}
      `;
    } else {
      await sql`
        INSERT INTO entreprise_profiles (
          user_id, org_id, siren, raison_sociale, forme_juridique, naf_code, naf_libelle,
          date_creation, effectif, categorie, adresse, dirigeants, finances, activites, clienteles, notes
        ) VALUES (
          ${scope.userId}, ${scope.orgId}, ${fields.siren}, ${fields.raison_sociale},
          ${fields.forme_juridique}, ${fields.naf_code}, ${fields.naf_libelle},
          ${fields.date_creation}, ${fields.effectif}, ${fields.categorie}, ${fields.adresse},
          ${fields.dirigeants}::jsonb, ${fields.finances}::jsonb,
          ${fields.activites}::jsonb, ${fields.clienteles}::jsonb, ${fields.notes}
        )
      `;
    }
    const saved = await findProfile(scope);
    return NextResponse.json({ profile: saved ? toApi(saved) : null });
  } catch (e) {
    if (e instanceof Error && /does not exist/i.test(e.message)) {
      return NextResponse.json(
        { error: "Table manquante — appliquez la migration vague4 (node --env-file=.env.local _migration/apply-vague1.mjs)" },
        { status: 503 },
      );
    }
    console.error("entreprise/profile PUT:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
