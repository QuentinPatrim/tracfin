// app/dashboard/layout.tsx — Enveloppe commune des écrans connectés
//
// Le cadre (barre latérale, menu sur téléphone) est posé ici une seule fois pour tous
// les écrans de /dashboard. La classe k-app donne les titres de page en serif (voir
// app/globals.css et DESIGN.md).

import AppShell from "@/components/dashboard/AppShell";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="k-app">
      <AppShell>{children}</AppShell>
    </div>
  );
}
