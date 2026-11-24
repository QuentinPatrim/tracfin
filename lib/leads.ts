// lib/leads.ts — Demandes de contact / rendez-vous venues du site public
//
// La table est créée à la première utilisation (pas de migrations dans ce dépôt).
// Lecture réservée aux comptes listés dans ADMIN_EMAILS (variable d'environnement,
// séparée par des virgules), à défaut le compte du fondateur.

import { sql } from "@/lib/db";

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "quentindel2002@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

let ready: Promise<unknown> | null = null;
export function ensureLeadsTable() {
  if (!ready) {
    ready = sql`
      CREATE TABLE IF NOT EXISTS leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        name text NOT NULL,
        agency text NOT NULL,
        email text NOT NULL,
        phone text,
        team_size text,
        topic text,
        slot text,
        message text,
        source text,
        path text,
        consent_at timestamptz NOT NULL,
        handled_at timestamptz
      )`.catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export interface LeadRow {
  id: string;
  created_at: string;
  name: string;
  agency: string;
  email: string;
  phone: string | null;
  team_size: string | null;
  topic: string | null;
  slot: string | null;
  message: string | null;
  source: string | null;
  path: string | null;
  handled_at: string | null;
}

export { TOPICS, SLOTS, TEAM } from "@/lib/leads-labels";
