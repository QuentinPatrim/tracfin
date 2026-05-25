// app/api/cron/rescreening/route.ts — Cron quotidien de re-screening (L.561-6)
//
// Déclenché par Vercel Cron (cf. vercel.json). Vérifie l'authentification via
// `Authorization: Bearer <CRON_SECRET>` (Vercel injecte ce header automatiquement
// pour les routes de type "cron").
//
// Boucle séquentielle sur N dossiers max (50 par défaut). Pause de 100ms entre
// chaque appel pour préserver le quota OpenSanctions (5 req/min free tier =
// 12 req/min en moyenne avec un peu de marge).
//
// Pour les bases de plus de 50 dossiers actifs : étendre via la rotation
// naturelle (selectDossiersToRescreen trie par dernier run le plus ancien).
// Sur Vercel Pro, augmenter `maxDuration` ou splitter en chunks.

import { NextResponse } from "next/server";
import { selectDossiersToRescreen, rescreenDossier } from "@/lib/rescreening";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — limite Vercel Hobby. Pro = 60s/300s/900s selon config.

// Borne quotidienne — au-delà : risque de plafonner OpenSanctions free tier.
const MAX_DOSSIERS_PER_RUN = 50;
// Pause entre chaque appel API (ms). ~100ms = ~10 req/s, OpenSanctions free
// tier accepte 5/min mais en pratique tient bien plus.
const PAUSE_BETWEEN_CALLS_MS = 200;

function authorize(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // En l'absence de secret configuré, on REFUSE par défaut pour éviter qu'un
    // attaquant déclenche le cron en boucle (épuiserait le quota OpenSanctions).
    console.error("[cron/rescreening] CRON_SECRET non configuré — endpoint désactivé.");
    return false;
  }
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${expected}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? MAX_DOSSIERS_PER_RUN);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), MAX_DOSSIERS_PER_RUN)
    : MAX_DOSSIERS_PER_RUN;

  const startedAt = new Date().toISOString();
  const dossiers = await selectDossiersToRescreen(limit, 7);

  let alertsCount = 0;
  let errorsCount = 0;
  const alerts: Array<{ dossierId: string; nomPrenom: string; newMatchIds: string[]; topScore: number | null }> = [];

  for (const d of dossiers) {
    try {
      const r = await rescreenDossier(d);
      if (r.isAlert) {
        alertsCount++;
        alerts.push({
          dossierId: d.id,
          nomPrenom: d.nom_prenom,
          newMatchIds: r.newMatchIds,
          topScore: r.topScore,
        });
      }
    } catch (e) {
      errorsCount++;
      console.error(`[cron/rescreening] erreur sur dossier ${d.id} :`, e);
      // On continue : un dossier en échec ne doit pas bloquer le batch entier.
    }
    await sleep(PAUSE_BETWEEN_CALLS_MS);
  }

  const finishedAt = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt,
    runsScheduled: dossiers.length,
    runsCompleted: dossiers.length - errorsCount,
    errorsCount,
    alertsCount,
    alerts,
  });
}
