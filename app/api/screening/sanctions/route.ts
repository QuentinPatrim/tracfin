// app/api/screening/sanctions/route.ts — Screening sanctions sur un dossier
//
// POST { dossierId, name, birthDate?, nationality?, isOrganization? }
// → lance le screening via lib/screening, persiste dans screening_runs,
//   audit log, retourne les matches normalisés à l'UI.
//
// Sécurité :
//   - Auth Clerk obligatoire (scope perso ou org)
//   - Le dossier doit appartenir au scope (findScopedDossier)
//   - Rate limit serré : 5 appels / min / user (préserve quota OpenSanctions)

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getScope, findScopedDossier } from "@/lib/scope";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/ratelimit";
import { screenSanctions, suggestGatesFromMatches, type ScreeningInput } from "@/lib/screening";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  dossierId?: string;
  name?: string;
  birthDate?: string;
  nationality?: string;
  isOrganization?: boolean;
}

export async function POST(req: Request) {
  const scope = await getScope();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit : 5 / minute / user. Préserve les quotas OpenSanctions (free
  // tier = 5/min global, payant = bien plus). Un agent qui veut screener 50
  // clients d'affilée hit la limite côté Klaris avant côté provider.
  const rl = await enforceRateLimit({
    key: `screening:${scope.userId}`,
    limit: 5,
    windowSec: 60,
  });
  if (rl) return rl;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { dossierId, name, birthDate, nationality, isOrganization } = body;
  if (!dossierId || !/^[0-9a-f-]{36}$/i.test(dossierId)) {
    return NextResponse.json({ error: "dossierId invalide" }, { status: 400 });
  }
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nom requis (min 2 caractères)" }, { status: 400 });
  }

  // Ownership : le dossier doit appartenir au scope courant.
  const owns = await findScopedDossier<{ id: string }>(dossierId, scope, "id");
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ─── Appel OpenSanctions ──────────────────────────────────────────────
  const input: ScreeningInput = {
    name: name.trim(),
    birthDate: birthDate?.trim() || undefined,
    nationality: nationality?.trim() || undefined,
    isOrganization: !!isOrganization,
  };

  let result;
  try {
    result = await screenSanctions(input);
  } catch (e) {
    console.error("screening error:", e);
    return NextResponse.json(
      {
        error: "screening_failed",
        message:
          e instanceof Error && e.message.startsWith("OpenSanctions HTTP 4")
            ? "Le service de screening a refusé la requête. Vérifiez votre clé API ou patientez."
            : "Le service de screening est temporairement indisponible. Réessayez dans quelques secondes.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  // Suggestion des gates (D1 / D2) à partir des matches haute confiance
  const gateSuggestion = suggestGatesFromMatches(result.matches);

  // ─── Persistance ──────────────────────────────────────────────────────
  const inserted = (await sql`
    INSERT INTO screening_runs (
      dossier_id, user_id, org_id, provider, query, response,
      matches_count, top_score, gates_flagged
    ) VALUES (
      ${dossierId}, ${scope.userId}, ${scope.orgId},
      ${result.provider},
      ${JSON.stringify(result.rawQuery)}::jsonb,
      ${JSON.stringify(result.rawResponse)}::jsonb,
      ${result.matches.length},
      ${result.topScore},
      ${JSON.stringify({ d1: gateSuggestion.d1, d2: gateSuggestion.d2, reasoning: gateSuggestion.reasoning, suggested_at: new Date().toISOString() })}::jsonb
    )
    RETURNING id, ran_at
  `) as unknown as Array<{ id: string; ran_at: string }>;

  await logAudit({
    userId: scope.userId,
    orgId: scope.orgId,
    dossierId,
    action: "screening.run",
    metadata: {
      provider: result.provider,
      matches_count: result.matches.length,
      top_score: result.topScore,
      d1_suggested: gateSuggestion.d1,
      d2_suggested: gateSuggestion.d2,
    },
    req,
  });

  return NextResponse.json({
    runId: inserted[0].id,
    ranAt: inserted[0].ran_at,
    matches: result.matches,
    topScore: result.topScore,
    suggestedGates: gateSuggestion,
  });
}
