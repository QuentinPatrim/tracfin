// components/landing/FloatingNav.tsx — Barre de navigation du site public
// Identité « Étiquette » : une pilule blanche flottante, dépolie, qui se densifie au
// défilement. Le logo anime ses barres à l'arrivée. Identité claire uniquement.

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Play, Menu, X } from "lucide-react";
import { useClerk, useAuth, UserButton } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";

// Démo guidée chargée à la demande (film 3D + sa feuille de style) : exclue du
// bundle initial de chaque page publique, tirée seulement à l'ouverture.
const DemoModal = dynamic(() => import("./DemoModal"), { ssr: false });

const NAV_LINKS = [
  { href: "/#how", label: "Fonctionnement" },
  { href: "/#vigilance", label: "Vigilance" },
  { href: "/guides", label: "Guides" },
  { href: "/confiance", label: "Confiance" },
  { href: "/tarifs", label: "Tarifs" },
];

export default function FloatingNav({ over = "paper" }: { over?: "paper" | "field" }) {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sur l'accueil, la barre repose sur le champ d'encre du haut de page : elle garde
  // son texte clair tant que cette section (marquée data-nav-field) passe dessous.
  const [overField, setOverField] = useState(over === "field");

  useEffect(() => {
    const field = over === "field" ? document.querySelector<HTMLElement>("[data-nav-field]") : null;
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      if (field) setOverField(field.getBoundingClientRect().bottom > 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [over]);

  // Évènement global « ouvrir la démo » (déclenchable depuis le hero / le CTA final)
  useEffect(() => {
    const open = () => setDemoOpen(true);
    window.addEventListener("klaris:open-demo", open);
    return () => window.removeEventListener("klaris:open-demo", open);
  }, []);

  // Verrouille le défilement quand le menu mobile est ouvert
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const signedIn = isLoaded && isSignedIn;
  const onField = over === "field" && overField;

  return (
    <>
      {demoOpen && (
        <DemoModal
          open={demoOpen}
          onClose={() => setDemoOpen(false)}
          onCta={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })}
        />
      )}

      <header className="kl-nav" data-solid={!scrolled ? "false" : onField ? "field" : "true"} data-over={over}>
        <div className="kl-wrap">
        <div className="kl-nav__bar flex items-center justify-between gap-3 h-[3.6rem]">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Klaris, accueil">
            <KlarisLogo size={30} animated />
            <span className="kl-wordmark">Klaris</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navigation principale">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="kl-nav__link">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Le bouton « Connexion » est rendu sans attendre Clerk (pas de gate sur
              isLoaded) : même si Clerk tarde ou échoue en silence (CSP, réseau,
              bloqueur…), l'utilisateur garde un chemin vers la connexion. */}
          <div className="flex items-center gap-1">

            {!signedIn && (
              <>
                <button
                  type="button"
                  onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" })}
                  className="kl-nav__link hidden sm:block"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })}
                  className="kl-btn kl-btn--sm kl-btn--primary ml-1.5"
                >
                  <span className="hidden sm:inline">Essayer gratuitement</span>
                  <span className="sm:hidden">Essai gratuit</span>
                </button>
              </>
            )}

            {signedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="kl-btn kl-btn--sm kl-btn--primary ml-1.5"
                >
                  Tableau de bord
                </Link>
                <UserButton />
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="kl-nav__icon lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu width={20} height={20} />
            </button>
          </div>
        </div>
        </div>
      </header>

      {mobileOpen && (
        <MobileMenu
          onClose={() => setMobileOpen(false)}
          isSignedIn={!!isSignedIn}
          onOpenDemo={() => { setMobileOpen(false); setDemoOpen(true); }}
          onSignIn={() => { setMobileOpen(false); openSignIn({ fallbackRedirectUrl: "/dashboard" }); }}
          onSignUp={() => { setMobileOpen(false); openSignUp({ fallbackRedirectUrl: "/dashboard" }); }}
        />
      )}
    </>
  );
}

function MobileMenu({
  onClose,
  isSignedIn,
  onOpenDemo,
  onSignIn,
  onSignUp,
}: {
  onClose: () => void;
  isSignedIn: boolean;
  onOpenDemo: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] lg:hidden flex flex-col"
      style={{ background: "var(--lp-bg)", color: "var(--lp-text)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="kl-wrap flex items-center justify-between h-16 shrink-0">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
          <KlarisLogo size={28} />
          <span className="kl-wordmark">Klaris</span>
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onClose} className="kl-nav__icon" aria-label="Fermer le menu">
            <X width={20} height={20} />
          </button>
        </div>
      </div>

      <nav className="kl-wrap flex-1 pt-6 flex flex-col" aria-label="Navigation principale">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="kl-display py-4 text-[2rem] border-b"
            style={{ borderColor: "var(--lp-border-2)" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="kl-wrap pb-6 pt-4 flex flex-col gap-3 shrink-0">
        {!isSignedIn ? (
          <>
            <button type="button" onClick={onSignUp} className="kl-btn kl-btn--primary w-full">
              Essayer 14 jours gratuits
            </button>
            <button type="button" onClick={onOpenDemo} className="kl-btn kl-btn--ghost w-full">
              <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
              Voir la démo guidée
            </button>
            <button type="button" onClick={onSignIn} className="py-2 text-[0.95rem]" style={{ color: "var(--lp-text-3)" }}>
              Déjà un compte ? <span className="kl-link">Se connecter</span>
            </button>
          </>
        ) : (
          <Link href="/dashboard" onClick={onClose} className="kl-btn kl-btn--primary w-full">
            Mon tableau de bord
          </Link>
        )}
      </div>
    </div>
  );
}
