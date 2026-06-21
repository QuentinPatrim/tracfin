// app/kyc/[token]/page.tsx — Formulaire KYC public côté client

import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import KycPublicForm from "./Kycpublicform";
import { FEATURES } from "@/lib/features";

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
      <div className="kyc-app min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--lp-danger-bg)", border: "1px solid var(--lp-danger-border)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--lp-danger)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Lien expiré</h1>
          <p style={{ color: "var(--lp-text-4)" }}>Ce lien KYC n'est plus valide. Contactez votre conseiller pour en obtenir un nouveau.</p>
        </div>
      </div>
    );
  }

  // Déjà rempli
  if (link.status === "completed") {
    return (
      <div className="kyc-app min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--lp-success-bg)", border: "1px solid var(--lp-success-border)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--lp-success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Dossier déjà transmis</h1>
          <p style={{ color: "var(--lp-text-4)" }}>Vos informations ont bien été envoyées. Votre conseiller reviendra vers vous prochainement.</p>
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

  // Récupère la partie (vendeur/acquéreur) du dossier pour adapter le formulaire
  const dossierRows = (await sql`
    SELECT partie FROM dossiers WHERE id = ${link.dossier_id} LIMIT 1
  `) as unknown as Array<{ partie: "vendeur" | "acquereur" | null }>;
  const partie: "vendeur" | "acquereur" =
    dossierRows[0]?.partie === "vendeur" ? "vendeur" : "acquereur";

  return <KycPublicForm token={token} dossierId={link.dossier_id} partie={partie} pappersEnabled={FEATURES.pappers} />;
}