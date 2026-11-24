// app/api/leads/route.ts — Enregistre une demande de contact / rendez-vous (public)

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureLeadsTable, SLOTS, TEAM, TOPICS } from "@/lib/leads";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const rl = await rateLimit(`leads:${ipFromRequest(req)}`, 5, 3600);
  if (!rl.ok) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  // Champ piège invisible : rempli = robot. On répond comme si tout allait bien.
  if (clip(b.website, 200)) return NextResponse.json({ ok: true });

  const name = clip(b.name, 120);
  const agency = clip(b.agency, 160);
  const email = clip(b.email, 200);
  const phone = clip(b.phone, 40);
  const topic = clip(b.topic, 20);
  const slot = clip(b.slot, 20);
  const team = clip(b.team, 10);
  const message = clip(b.message, 2000);
  const source = clip(b.source, 40);
  const path = clip(b.path, 200);

  if (!name || !agency || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Nom, agence et e-mail valide sont nécessaires." }, { status: 400 });
  }
  if (b.consent !== true) {
    return NextResponse.json({ error: "Merci d'accepter d'être recontacté." }, { status: 400 });
  }

  try {
    await ensureLeadsTable();
    await sql`
      INSERT INTO leads (name, agency, email, phone, team_size, topic, slot, message, source, path, consent_at)
      VALUES (${name}, ${agency}, ${email}, ${phone || null}, ${TEAM[team] ? team : null},
              ${TOPICS[topic] ? topic : "rappel"}, ${SLOTS[slot] ? slot : null}, ${message || null},
              ${source || null}, ${path || null}, now())`;
  } catch (e) {
    console.error("[leads] insert", e);
    return NextResponse.json({ error: "Enregistrement impossible. Réessayez dans un instant." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
