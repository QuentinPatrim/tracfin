// components/landing/FloatingNav.tsx — Nav flottante (Klaris)

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useClerk, useAuth, UserButton } from "@clerk/nextjs";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function FloatingNav() {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div
        className="relative flex items-center justify-between px-3 py-2 rounded-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(7,8,15,0.75)" : "rgba(255,255,255,0.04)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: scrolled
            ? "0 0 0 1px rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 60px -10px rgba(139,92,246,0.25), 0 8px 24px -4px rgba(0,0,0,0.4)"
            : "0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 40px -10px rgba(139,92,246,0.15)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 pl-2 pr-2 group">
          <KlarisLogo size={26} />
          <span className="text-[15px] font-bold tracking-tight">Klaris</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/#features"
            className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/#how"
            className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition"
          >
            Comment ça marche
          </Link>
          <Link
            href="/tarifs"
            className="text-[13px] font-medium text-white/60 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition"
          >
            Tarifs
          </Link>
        </div>

        <div className="flex items-center gap-2 pr-1">
          {isLoaded && !isSignedIn && (
            <>
              <button
                onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" })}
                className="hidden sm:block text-[13px] font-medium text-white/70 hover:text-white px-4 py-2 rounded-full hover:bg-white/[0.06] transition"
              >
                Connexion
              </button>
              <GradientPillButton onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })}>
                Essayer gratuitement
              </GradientPillButton>
            </>
          )}

          {isLoaded && isSignedIn && (
            <>
              <Link
                href="/dashboard"
                className="text-[13px] font-bold text-white px-4 py-2 rounded-full transition-transform hover:scale-105"
                style={pillButtonStyle}
              >
                Mon dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const pillButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
  backgroundSize: "200% 200%",
  animation: "gradShift 6s ease infinite",
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.30) inset, 0 4px 20px rgba(168,85,247,0.45)",
};

function GradientPillButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[13px] font-bold text-white px-4 py-2 rounded-full transition-transform hover:scale-105"
      style={pillButtonStyle}
    >
      {children}
    </button>
  );
}