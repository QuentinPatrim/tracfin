// app/dashboard/page.tsx — Dashboard server-side

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ShieldCheck, PlusCircle, Users } from "lucide-react";
import { sql } from "@/lib/db";
import type { StatutKey, Niveau } from "@/lib/tracfin";
import AmbientOrbs from "@/components/tracfin/AmbientOrbs";
import DashboardList from "./DashboardList";

interface DossierListItem {
  id: string;
  nom_prenom: string;
  type_client: "physique" | "morale";
  algo_version: "v1" | "v2";
  niveau: Niveau | null;
  statut: StatutKey | null;
  score_pct: number;
  date_detection: string;
  created_at: string;
  updated_at: string;
  kyc_status: string;
}

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const dossiers = (await sql`
    SELECT id, nom_prenom, type_client, algo_version, niveau, statut, score_pct,
           date_detection, created_at, updated_at, kyc_status
    FROM dossiers
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as DossierListItem[];

  return (
    <div className="min-h-screen text-white relative" style={{ background: "#07080F", fontFamily: "Inter, sans-serif" }}>
      <AmbientOrbs />

      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Tableau de Bord</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/tarifs" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition">
              Gérer mon abonnement
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Mes Dossiers KYC</h1>
            <p className="text-white/50 text-sm">
              {dossiers.length === 0
                ? "Aucun dossier pour le moment"
                : `${dossiers.length} dossier${dossiers.length > 1 ? "s" : ""} enregistré${dossiers.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <Link
            href="/dashboard/nouveau"
            className="px-6 py-3 rounded-full font-bold text-white text-sm flex items-center gap-2 transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dossier
          </Link>
        </div>

        {dossiers.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-16 text-center flex flex-col items-center">
            <Users className="w-16 h-16 text-white/15 mb-5" />
            <h2 className="text-xl font-semibold mb-2">Aucun dossier pour le moment</h2>
            <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">
              Créez votre premier dossier KYC et obtenez un score de risque Tracfin en quelques clics.
            </p>
            <Link
              href="/dashboard/nouveau"
              className="px-6 py-3 rounded-full font-bold text-white text-sm flex items-center gap-2 transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6,#06B6D4)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}
            >
              <PlusCircle className="w-4 h-4" />
              Créer un dossier
            </Link>
          </div>
        ) : (
          <DashboardList dossiers={dossiers} />
        )}
      </main>
    </div>
  );
}