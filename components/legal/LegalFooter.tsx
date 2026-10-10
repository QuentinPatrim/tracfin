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
      <div className="kl-wrap grid gap-10 py-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] md:gap-16">
        <div>
          <div className="flex items-center gap-2.5">
            <KlarisLogo size={28} />
            <span className="kl-display text-[1.25rem]" style={{ lineHeight: 1, color: "var(--lp-text)" }}>
              Klaris
            </span>
          </div>
          <p className="mt-4 max-w-[22rem] text-[0.9rem] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>
            La plateforme française qui aide les agences immobilières à tenir leurs dossiers
            LCB-FT. Données hébergées en Union européenne.
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Pied de page">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[0.86rem] font-semibold" style={{ color: "var(--lp-text)" }}>
                {col.title}
              </div>
              <ul className="mt-3 grid gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[0.9rem] transition-colors text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)]"
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
        <div className="kl-wrap py-5 text-[0.82rem]" style={{ color: "var(--lp-text-4)" }}>
          © {new Date().getFullYear()} Klaris. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
