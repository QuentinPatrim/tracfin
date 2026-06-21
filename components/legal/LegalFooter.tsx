// components/legal/LegalFooter.tsx — Footer global (réutilisé par pages légales, /confiance, etc.)
// Palette « Iris » via tokens --lp-* (clair/sombre).

import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function LegalFooter() {
  return (
    <footer className="relative z-10 border-t mt-16 py-10" style={{ borderColor: "var(--lp-border-1)" }}>
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <KlarisLogo size={28} />
            <span className="font-bold tracking-tight text-[14px]" style={{ color: "var(--lp-text)" }}>Klaris</span>
          </div>
          <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: "var(--lp-text-4)" }}>
            La plateforme française de conformité LCB-FT, conçue pour les professionnels assujettis. Hébergement souverain UE.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-2 text-[10.5px] uppercase tracking-widest px-2.5 py-1 rounded-md"
            style={{ color: "var(--lp-text-3)", background: "var(--lp-surface)", border: "1px solid var(--lp-border-1)" }}
          >
            <span>🇪🇺</span> Données hébergées en Union Européenne
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12.5px]">
          <Link href="/" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Accueil</Link>
          <Link href="/tarifs" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Tarifs</Link>
          <Link href="/confiance" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Confiance &amp; souveraineté</Link>
          <Link href="/securite" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Sécurité &amp; certifications</Link>
          <Link href="/legal/mentions-legales" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Confidentialité</Link>
          <Link href="/legal/cgu" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">CGU</Link>
          <Link href="/legal/cgv" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">CGV</Link>
          <Link href="/legal/cookies" className="transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]">Cookies</Link>
        </div>
      </div>

      <div
        className="max-w-4xl mx-auto px-6 mt-8 pt-6 border-t text-[11px] uppercase tracking-widest text-center"
        style={{ borderColor: "var(--lp-border-1)", color: "var(--lp-text-4)" }}
      >
        © {new Date().getFullYear()} Klaris — Tous droits réservés
      </div>
    </footer>
  );
}
