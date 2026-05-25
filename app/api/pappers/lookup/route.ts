// app/api/pappers/lookup/route.ts — Lookup INPI/Pappers d'une entreprise par SIREN
//
// GET /api/pappers/lookup?siren=552120222[&kycToken=...]
//
// Deux voies d'autorisation :
//   - Agent connecté (Clerk) — usage typique : vérification dans le dashboard
//   - Client KYC public via token — pré-remplissage du formulaire personne morale
//
// Rate-limit serré (10/min/IP) pour préserver le quota Pappers (30/min en free
// tier, plus en payant) — partagé entre tous les utilisateurs Klaris.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { fetchCompanyBySiren, isValidSiren, PappersError } from "@/lib/pappers";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit, ipFromRequest } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const siren = (url.searchParams.get("siren") ?? "").replace(/\s/g, "");
  const kycToken = url.searchParams.get("kycToken") ?? "";

  // ─── Validation SIREN avant toute auth (économise un appel DB) ────────
  if (!isValidSiren(siren)) {
    return NextResponse.json({ error: "SIREN invalide (9 chiffres + clé Luhn)" }, { status: 400 });
  }

  // ─── Rate limit IP — globalement, peu importe la voie d'auth ──────────
  const rl = await enforceRateLimit({
    key: `pappers:${ipFromRequest(req)}`,
    limit: 10,
    windowSec: 60,
  });
  if (rl) return rl;

  // ─── Autorisation : Clerk OU token KYC ────────────────────────────────
  let auditUserId: string | null = null;
  let auditOrgId: string | null = null;
  let auditDossierId: string | null = null;
  let origin: "agent" | "client" = "agent";

  if (kycToken.length > 0) {
    origin = "client";
    const links = (await sql`
      SELECT dossier_id, org_id, status, expires_at
      FROM kyc_links WHERE token = ${kycToken} LIMIT 1
    `) as unknown as Array<{ dossier_id: string; org_id: string | null; status: string; expires_at: string }>;
    if (links.length === 0) {
      return NextResponse.json({ error: "Token invalide" }, { status: 403 });
    }
    const link = links[0];
    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expiré" }, { status: 410 });
    }
    if (link.status === "completed") {
      return NextResponse.json({ error: "KYC déjà soumis" }, { status: 409 });
    }
    auditDossierId = link.dossier_id;
    auditOrgId = link.org_id;
  } else {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    auditUserId = userId;
    auditOrgId = orgId ?? null;
  }

  // ─── Appel Pappers ────────────────────────────────────────────────────
  try {
    const { normalized, raw } = await fetchCompanyBySiren(siren);

    await logAudit({
      userId: auditUserId,
      orgId: auditOrgId,
      dossierId: auditDossierId,
      action: "pappers.lookup",
      metadata: {
        siren,
        origin,
        denomination: normalized.denomination,
        forme_juridique: normalized.formeJuridique,
        be_count: normalized.beneficiairesEffectifs.length,
      },
      req,
    });

    // On renvoie la version normalisée pour le formulaire + le payload brut
    // pour stockage en preuve d'audit (pappers_snapshot sur kyc_responses).
    return NextResponse.json({ company: normalized, snapshot: raw });
  } catch (e) {
    if (e instanceof PappersError) {
      return NextResponse.json(
        { error: e.message, code: e.status ?? 500 },
        { status: e.status && e.status >= 400 && e.status < 600 ? e.status : 502 },
      );
    }
    console.error("Pappers lookup error:", e);
    return NextResponse.json(
      { error: "Erreur Pappers, réessayez dans quelques secondes." },
      { status: 502 },
    );
  }
}
