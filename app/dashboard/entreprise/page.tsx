// app/dashboard/entreprise/page.tsx — Profil de conformité de l'entreprise

import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";
import EntrepriseClient from "./EntrepriseClient";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function EntreprisePage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  return (
    <div className="dashboard-root">
      <div className="app">
        <main className="main">
          <EntrepriseClient />
        </main>
      </div>
    </div>
  );
}
