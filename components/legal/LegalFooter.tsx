// components/legal/LegalFooter.tsx — Pied de page du site public
// (accueil, tarifs, confiance, sécurité, guides, pages légales).
// Identité « Papier & encre » : tokens --lp-* (clair/sombre), sans capitales
// espacées ni pictogrammes décoratifs.

import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

const COLUMNS = [
  {
    title: "Klaris",
    links: [
      { href: "/", label: "Accueil" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { href: "/confiance", label: "Nos engagements" },
      { href: "/securite", label: "Sécurité" },
      { href: "/legal/confidentialite", label: "Confidentialité" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
  {
    title: "Juridique",
    links: [
      { href: "/legal/mentions-legales", label: "Mentions légales" },
      { href: "/legal/cgu", label: "CGU" },
      { href: "/legal/cgv", label: "CGV" },
    ],
  },
];

export default function LegalFooter() {
  return (
    <footer className="relative z-10 border-t" style={{ borderColor: "var(--lp-border-2)" }}>
      <div className="kl-wrap grid gap-12 pt-16 pb-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] md:gap-16">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Klaris, accueil">
            <KlarisLogo size={30} />
            <span className="kl-wordmark" style={{ color: "var(--lp-text)" }}>Klaris</span>
          </Link>
          <p
            className="kl-display mt-6 max-w-[20rem] text-[1.55rem] leading-[1.15]"
            style={{ color: "var(--lp-text)" }}
          >
            La tenue de vos dossiers LCB‑FT, <em>sans y passer vos soirées.</em>
          </p>
          <p className="mt-4 max-w-[22rem] text-[0.88rem] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>
            Une plateforme française pour les agences immobilières. Données hébergées en Union
            européenne.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Pied de page">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[0.8rem] font-medium" style={{ color: "var(--lp-text-4)" }}>
                {col.title}
              </div>
              <ul className="mt-4 grid gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[0.92rem] transition-colors text-[color:var(--lp-text-2)] hover:text-[color:var(--lp-text)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t" style={{ borderColor: "var(--lp-border-1)" }}>
        <div
          className="kl-wrap flex flex-wrap items-center justify-between gap-3 py-6 text-[0.82rem]"
          style={{ color: "var(--lp-text-4)" }}
        >
          <span>© {new Date().getFullYear()} Klaris. Tous droits réservés.</span>
          <span>Conçu à Toulouse, hébergé en Union européenne.</span>
        </div>
      </div>
    </footer>
  );
}
