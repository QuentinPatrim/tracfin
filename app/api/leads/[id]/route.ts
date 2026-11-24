// app/api/leads/[id]/route.ts — Marquer une demande comme traitée (admin)

import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { isAdminEmail } from "@/lib/leads";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isAdminEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const { handled } = (await req.json().catch(() => ({}))) as { handled?: boolean };
  await sql`UPDATE leads SET handled_at = ${handled ? new Date().toISOString() : null} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
