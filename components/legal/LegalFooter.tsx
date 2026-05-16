// components/legal/LegalFooter.tsx — Footer global (réutilisé par pages légales, /confiance, etc.)

import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function LegalFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] mt-16 py-10">
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <KlarisLogo size={28} />
            <span className="font-bold tracking-tight text-[14px]">Klaris</span>
          </div>
          <p className="text-[12px] text-white/45 max-w-xs leading-relaxed">
            La plateforme française de conformité LCB-FT, conçue pour les professionnels assujettis. Hébergement souverain UE.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-[10.5px] uppercase tracking-widest text-white/60 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
            <span>🇪🇺</span> Données hébergées en Union Européenne
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12.5px]">
          <Link href="/" className="text-white/55 hover:text-white transition">Accueil</Link>
          <Link href="/tarifs" className="text-white/55 hover:text-white transition">Tarifs</Link>
          <Link href="/confiance" className="text-white/55 hover:text-white transition">Confiance & souveraineté</Link>
          <Link href="/legal/mentions-legales" className="text-white/55 hover:text-white transition">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="text-white/55 hover:text-white transition">Confidentialité</Link>
          <Link href="/legal/cgu" className="text-white/55 hover:text-white transition">CGU</Link>
          <Link href="/legal/cgv" className="text-white/55 hover:text-white transition">CGV</Link>
          <Link href="/legal/cookies" className="text-white/55 hover:text-white transition">Cookies</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 pt-6 border-t border-white/[0.04] text-[11px] text-white/30 uppercase tracking-widest text-center">
        © {new Date().getFullYear()} Klaris — Tous droits réservés
      </div>
    </footer>
  );
}
