// app/legal/layout.tsx — Layout commun des pages légales (sobre, lisible)

import Link from "next/link";
import LegalFooter from "@/components/legal/LegalFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b1a] text-white relative overflow-hidden">
      {/* Halos d'ambiance discrets */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: "-200px",
          left: "-100px",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)",
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
          background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <KlarisLogo size={32} />
            <span className="font-bold tracking-tight text-[15px] group-hover:text-white/90 transition">
              Klaris
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[12.5px] text-white/60">
            <Link href="/confiance" className="hover:text-white transition">Confiance</Link>
            <Link href="/tarifs" className="hover:text-white transition">Tarifs</Link>
            <Link href="/" className="hover:text-white transition">Accueil</Link>
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
