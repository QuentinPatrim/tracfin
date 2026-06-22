// app/guides/layout.tsx — Coquille visuelle des Guides (même ADN que la landing :
// wrapper thémé clair/sombre, halos, nav flottante, footer).

import FloatingNav from "@/components/landing/FloatingNav";
import LegalFooter from "@/components/legal/LegalFooter";

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="klaris-public min-h-screen relative overflow-x-hidden">
      <div
        className="fixed pointer-events-none rounded-full"
        style={{ width: 700, height: 700, top: -250, left: -180, zIndex: 0, filter: "blur(110px)", background: "radial-gradient(circle, var(--lp-orb-1) 0%, transparent 70%)" }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{ width: 600, height: 600, bottom: -200, right: -150, zIndex: 0, filter: "blur(110px)", background: "radial-gradient(circle, var(--lp-orb-2) 0%, transparent 70%)" }}
      />
      <FloatingNav />
      <main className="relative z-10 pt-28 sm:pt-32 md:pt-36">{children}</main>
      <LegalFooter />
    </div>
  );
}
