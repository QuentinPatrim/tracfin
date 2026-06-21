// app/dashboard/integrations/page.tsx — Gestion des clés API CRM

import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";
import IntegrationsClient from "./IntegrationsClient";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  return (
    <div className="dashboard-root">
      <div className="app">
        <main className="main">
          <IntegrationsClient />
        </main>
      </div>
    </div>
  );
}
