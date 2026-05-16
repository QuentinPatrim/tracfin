// app/dashboard/page.tsx — Dashboard Klaris (refonte selon design handoff)

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import type { Niveau } from "@/lib/tracfin";
import { V1_TO_NIVEAU } from "@/lib/tracfin";
import { getSubscriptionStatus } from "@/lib/subscription";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardClient, { type DossierItem } from "@/components/dashboard/DashboardClient";
import { listDossierFiles, type DossierFile, type KycFilesRow } from "@/lib/dossier-files";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  // Lazy-init essai 14j au 1er accès
  const sub = await getSubscriptionStatus(userId);

  // Dossiers
  const rows = (await sql`
    SELECT id, nom_prenom, type_client, algo_version, niveau, statut, score_pct,
           created_at, updated_at, kyc_status
    FROM dossiers
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as DossierItem[];

  // Pièces justificatives (dernière kyc_response par dossier)
  const filesRows = (rows.length > 0 ? await sql`
    SELECT DISTINCT ON (kr.dossier_id)
      kr.dossier_id,
      kr.url_piece_identite, kr.url_justif_domicile, kr.url_avis_imposition,
      kr.url_justif_revenus, kr.url_justif_origine_fonds,
      kr.url_kbis, kr.url_statuts, kr.url_cni_gerant, kr.url_bilans, kr.url_rbe
    FROM kyc_responses kr
    JOIN dossiers d ON d.id = kr.dossier_id
    WHERE d.user_id = ${userId}
    ORDER BY kr.dossier_id, kr.submitted_at DESC
  ` : []) as unknown as Array<KycFilesRow & { dossier_id: string }>;

  const filesByDossier: Record<string, DossierFile[]> = {};
  for (const fr of filesRows) {
    filesByDossier[fr.dossier_id] = listDossierFiles(fr);
  }

  // Compteurs (résolution rétro-compat v1/v2)
  const resolveN = (d: DossierItem): Niveau | null => {
    if (d.algo_version === "v2") return d.niveau;
    if (d.statut) return V1_TO_NIVEAU[d.statut];
    return null;
  };
  const counts = {
    total: rows.length,
    conformes: rows.filter((d) => resolveN(d) === "vigilance_standard").length,
    vigilance: rows.filter((d) => resolveN(d) === "vigilance_renforcee").length,
    critique: rows.filter((d) => {
      const n = resolveN(d);
      return n === "examen_renforce" || n === "interdiction";
    }).length,
  };

  return (
    <div className="dashboard-root">
      <div className="app">
        <Sidebar
          counts={counts}
          subscription={{
            isActive: sub.isActive,
            isTrialing: sub.isTrialing,
            state: sub.state,
            daysLeft: sub.daysLeft,
          }}
          currentScreen="dossiers"
        />

        <main className="main">
          <DashboardClient
            dossiers={rows}
            counts={counts}
            canCreate={sub.isActive}
            filesByDossier={filesByDossier}
          />
        </main>
      </div>
    </div>
  );
}
