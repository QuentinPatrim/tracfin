// app/dashboard/demandes/page.tsx — Demandes de contact / rendez-vous du site (admin)

import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { ensureLeadsTable, isAdminEmail, type LeadRow } from "@/lib/leads";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function DemandesPage() {
  const user = await currentUser();
  if (!isAdminEmail(user?.primaryEmailAddress?.emailAddress)) notFound();
  await ensureLeadsTable();
  const rows = (await sql`
    SELECT id, created_at, name, agency, email, phone, team_size, topic, slot, message, source, path, handled_at
    FROM leads ORDER BY created_at DESC LIMIT 500`) as LeadRow[];
  return <LeadsClient initial={rows} />;
}
