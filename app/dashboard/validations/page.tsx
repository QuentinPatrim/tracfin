// app/dashboard/validations/page.tsx — File de validation + gestion des correspondants

import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";
import ValidationsClient from "./ValidationsClient";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function ValidationsPage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  return (
    <div className="dashboard-root">
      <div className="app">
        <main className="main">
          <ValidationsClient isOrgContext={scope.isOrgContext} />
        </main>
      </div>
    </div>
  );
}
