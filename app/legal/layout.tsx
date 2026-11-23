// app/legal/layout.tsx — Layout commun des pages légales (sobre, lisible)
// Palette « Iris » via tokens --lp-* (clair/sombre).

import LegalFooter from "@/components/legal/LegalFooter";
import FloatingNav from "@/components/landing/FloatingNav";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="klaris-public min-h-screen relative">
      <FloatingNav />

      {/* Contenu */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-16 md:pt-40 md:pb-24">
        {children}
      </main>

      <LegalFooter />
    </div>
  );
}
