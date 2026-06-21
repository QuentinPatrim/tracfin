// app/error.tsx — Frontière d'erreur (route segment) thémée clair/sombre

"use client";

import { useEffect } from "react";
import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Trace côté client (visible en console / outils de monitoring).
    console.error(error);
  }, [error]);

  return (
    <div className="klaris-public min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <KlarisLogo size={44} />
        </div>
        <div
          className="inline-block px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest mb-5"
          style={{ background: "var(--lp-danger-bg)", border: "1px solid var(--lp-danger-border)", color: "var(--lp-danger)" }}
        >
          Une erreur est survenue
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-3" style={{ color: "var(--lp-text)" }}>
          Oups, quelque chose a planté
        </h1>
        <p className="text-[14px] leading-relaxed mb-7" style={{ color: "var(--lp-text-3)" }}>
          Une erreur inattendue s'est produite. Vous pouvez réessayer ; si le problème persiste,
          revenez à l'accueil.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-6 py-3.5 text-[14.5px] text-white transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--lp-cta-grad)", boxShadow: "var(--lp-cta-shadow)" }}
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-6 py-3.5 text-[14.5px] transition-transform hover:-translate-y-0.5 text-[color:var(--lp-text-2)]"
            style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
