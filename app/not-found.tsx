// app/not-found.tsx — Page 404 thémée (clair/sombre)

import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function NotFound() {
  return (
    <div className="klaris-public min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <KlarisLogo size={44} />
        </div>
        <div
          className="inline-block px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-widest mb-5"
          style={{ background: "var(--lp-surface-2)", border: "1px solid var(--lp-border-2)", color: "var(--lp-text-3)" }}
        >
          Erreur 404
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-3" style={{ color: "var(--lp-text)" }}>
          Cette page n'existe pas
        </h1>
        <p className="text-[14px] leading-relaxed mb-7" style={{ color: "var(--lp-text-3)" }}>
          Le lien est peut-être erroné ou la page a été déplacée. Revenez à l'accueil pour reprendre votre navigation.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold px-6 py-3.5 text-[14.5px] text-white transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--lp-cta-grad)", boxShadow: "var(--lp-cta-shadow)" }}
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
