// app/dashboard/cartographie/page.tsx — Cartographie des risques L.561-4-1
//
// Page server-side qui calcule la cartographie via lib/cartography puis délègue
// l'affichage à CartographyClient (interactif : export PDF, période ajustable).

import { redirect } from "next/navigation";
import { getScope } from "@/lib/scope";
import { computeCartography } from "@/lib/cartography";
import CartographyClient from "./CartographyClient";
import "../dashboard.css";

export const dynamic = "force-dynamic";

export default async function CartographiePage() {
  const scope = await getScope();
  if (!scope) redirect("/");

  const carto = await computeCartography(scope, 12);

  return (
    <div className="dashboard-root">
      <div className="app">
        <main className="main">
          <CartographyClient carto={carto} />
        </main>
      </div>
    </div>
  );
}
