// app/dashboard/layout.tsx — Enveloppe commune des écrans connectés
//
// Ne porte aucune mise en page : la classe k-app sert seulement de repère pour
// l'habillage partagé (titres en Bricolage, voir app/globals.css et DESIGN.md).

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="k-app">{children}</div>;
}
