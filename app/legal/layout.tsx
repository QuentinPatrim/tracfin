// app/legal/layout.tsx — Layout commun des pages légales (sobre, lisible)
// Palette « Iris » via tokens --lp-* (clair/sombre).

import Link from "next/link";
import LegalFooter from "@/components/legal/LegalFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="klaris-public min-h-screen relative overflow-hidden">
      {/* Halos d'ambiance discrets */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: "-200px",
          left: "-100px",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, var(--lp-orb-1), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: "40%",
          right: "-150px",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, var(--lp-orb-2), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 border-b" style={{ borderColor: "var(--lp-border-1)" }}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <KlarisLogo size={32} />
            <span className="font-bold tracking-tight text-[15px]" style={{ color: "var(--lp-text)" }}>
              Klaris
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[12.5px]">
            <Link href="/confiance" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Confiance</Link>
            <Link href="/tarifs" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Tarifs</Link>
            <Link href="/" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Accueil</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Contenu */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        {children}
      </main>

      <LegalFooter />
    </div>
  );
}
