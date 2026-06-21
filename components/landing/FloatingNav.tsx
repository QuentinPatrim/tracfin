// components/landing/FloatingNav.tsx — Nav flottante (mobile-first, menu hamburger)
// Palette « Iris » via tokens --lp-* (clair/sombre) + bascule de thème.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Menu, X } from "lucide-react";
import { useClerk, useAuth, UserButton } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import DemoModal from "./DemoModal";

const NAV_LINKS = [
  { href: "/#understand", label: "Comprendre" },
  { href: "/#features", label: "Fonctionnalités" },
  { href: "/#how", label: "Comment ça marche" },
  { href: "/confiance", label: "Confiance" },
  { href: "/tarifs", label: "Tarifs" },
];

export default function FloatingNav() {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Évènement global "ouvrir la démo" (déclenchable depuis le hero/carrousel)
  useEffect(() => {
    const open = () => setDemoOpen(true);
    window.addEventListener("klaris:open-demo", open);
    return () => window.removeEventListener("klaris:open-demo", open);
  }, []);

  // Lock scroll quand menu mobile ouvert
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  return (
    <>
      <DemoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onCta={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })}
      />

      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-5xl">
        <div
          className="relative flex items-center justify-between px-2.5 sm:px-3 py-2 rounded-full transition-all duration-300"
          style={{
            background: scrolled ? "var(--lp-nav-bg-scrolled)" : "var(--lp-nav-bg)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid var(--lp-nav-border)",
            boxShadow: scrolled ? "var(--lp-nav-shadow-scrolled)" : "0 1px 0 var(--lp-border-1) inset",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pl-1.5 sm:pl-2 pr-2 group">
            <KlarisLogo size={24} />
            <span className="text-[14.5px] font-bold tracking-tight" style={{ color: "var(--lp-text)" }}>Klaris</span>
          </Link>

          {/* Liens desktop */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-full transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)] hover:bg-[var(--lp-surface-2)]"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions à droite —
              Le bouton "Connexion" est rendu INCONDITIONNELLEMENT (pas de gate
              sur isLoaded) : même si Clerk lag ou plante en silence (CSP, réseau,
              adblock…), l'utilisateur doit toujours avoir un chemin vers la page
              de connexion. Si déjà connecté, openSignIn redirige vers /dashboard. */}
          <div className="flex items-center gap-1.5 pr-1">
            <ThemeToggle />

            {(!isLoaded || !isSignedIn) && (
              <>
                <button
                  onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" })}
                  className="hidden sm:block text-[12.5px] font-medium px-3 py-1.5 rounded-full transition text-[color:var(--lp-text-3)] hover:text-[color:var(--lp-text)] hover:bg-[var(--lp-surface-2)]"
                >
                  Connexion
                </button>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-3.5 py-2 rounded-full transition-transform hover:scale-[1.02]"
                  style={pillStyle}
                >
                  <Play className="w-3 h-3" fill="currentColor" strokeWidth={0} />
                  <span className="hidden sm:inline">Voir la démo</span>
                  <span className="sm:hidden">Démo</span>
                </button>
              </>
            )}

            {isLoaded && isSignedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="text-[12.5px] font-semibold text-white px-3.5 py-2 rounded-full transition-transform hover:scale-[1.02]"
                  style={pillStyle}
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            )}

            {/* Bouton menu mobile */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden ml-0.5 grid place-items-center w-9 h-9 rounded-full transition text-[color:var(--lp-text-2)] hover:bg-[var(--lp-surface-3)]"
              style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}
              aria-label="Ouvrir le menu"
            >
              <Menu width={16} height={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile plein écran */}
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

const pillStyle: React.CSSProperties = {
  background: "var(--lp-cta-grad)",
  boxShadow: "var(--lp-cta-shadow)",
};

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
      onClick={onClose}
      className="fixed inset-0 z-[60] lg:hidden"
      style={{
        background: "var(--lp-bg)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="h-full flex flex-col">
        {/* Top bar du menu */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--lp-border-1)" }}>
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <KlarisLogo size={24} />
            <span className="text-[14.5px] font-bold tracking-tight" style={{ color: "var(--lp-text)" }}>Klaris</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="grid place-items-center w-9 h-9 rounded-full transition text-[color:var(--lp-text-2)]"
              style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}
              aria-label="Fermer"
            >
              <X width={16} height={16} />
            </button>
          </div>
        </div>

        {/* Liens */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block px-4 py-3.5 rounded-xl text-[15px] font-medium transition text-[color:var(--lp-text-2)] hover:bg-[var(--lp-surface-2)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTAs en bas */}
        <div className="p-4 border-t flex flex-col gap-2.5" style={{ borderColor: "var(--lp-border-1)" }}>
          {!isSignedIn ? (
            <>
              <button
                onClick={onOpenDemo}
                className="w-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-5 py-3.5 rounded-xl"
                style={pillStyle}
              >
                <Play className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
                Voir la démo
              </button>
              <button
                onClick={onSignUp}
                className="w-full text-[14px] font-medium px-5 py-3 rounded-xl text-[color:var(--lp-text-2)]"
                style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}
              >
                Essayer gratuitement
              </button>
              <button
                onClick={onSignIn}
                className="w-full text-[13px] font-medium px-5 py-2 rounded-xl text-[color:var(--lp-text-4)]"
              >
                Déjà un compte ? Se connecter
              </button>
            </>
          ) : (
            <Link
              href="/dashboard"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-5 py-3.5 rounded-xl"
              style={pillStyle}
            >
              Mon dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
