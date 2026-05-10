// app/kyc/[token]/page.tsx — Formulaire KYC public côté client

import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import KycPublicForm from "./Kycpublicform";

export const dynamic = "force-dynamic";

interface LinkRow {
  id: string;
  dossier_id: string;
  status: string;
  expires_at: string;
}

export default async function KycPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const links = (await sql`
    SELECT id, dossier_id, status, expires_at
    FROM kyc_links
    WHERE token = ${token}
    LIMIT 1
  `) as unknown as LinkRow[];

  if (links.length === 0) return notFound();

  const link = links[0];

  // Lien expiré
  if (new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#07080F", color: "white", fontFamily: "Inter, sans-serif" }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(248,113,113)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Lien expiré</h1>
          <p className="text-white/50">Ce lien KYC n'est plus valide. Contactez votre conseiller pour en obtenir un nouveau.</p>
        </div>
      </div>
    );
  }

  // Déjà rempli
  if (link.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#07080F", color: "white", fontFamily: "Inter, sans-serif" }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(52,211,153)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Dossier déjà transmis</h1>
          <p className="text-white/50">Vos informations ont bien été envoyées. Votre conseiller reviendra vers vous prochainement.</p>
        </div>
      </div>
    );
  }

  // Marquer comme "ouvert" si c'est la première fois
  if (link.status === "pending") {
    await sql`
      UPDATE kyc_links SET status = 'opened', opened_at = NOW() WHERE id = ${link.id}
    `;
  }

  return <KycPublicForm token={token} dossierId={link.dossier_id} />;
}