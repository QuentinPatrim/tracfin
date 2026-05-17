// components/dashboard/DashboardFooter.tsx — Footer variante light pour le dashboard
// Pendant cohérent du LegalFooter de la landing, adapté au fond clair.

import Link from "next/link";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function DashboardFooter() {
  return (
    <footer
      className="relative mt-auto pt-10 pb-8 px-8"
      style={{
        borderTop: "1px solid rgba(124,58,237,0.08)",
        background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.50))",
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <KlarisLogo size={28} />
            <span className="font-bold tracking-tight text-[13.5px]" style={{ color: "#0F172A" }}>
              Klaris
            </span>
          </div>
          <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: "#64748b" }}>
            Conformité LCB-FT pour les professionnels assujettis. Hébergement souverain UE.
          </p>
          <div
            className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-md"
            style={{
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.18)",
              color: "#6d28d9",
            }}
          >
            <span>🇪🇺</span> Données UE · chiffrées AES-256
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px]">
          <FooterLink href="/confiance">Confiance & souveraineté</FooterLink>
          <FooterLink href="/legal/mentions-legales">Mentions légales</FooterLink>
          <FooterLink href="/legal/confidentialite">Confidentialité</FooterLink>
          <FooterLink href="/legal/cgv">CGV</FooterLink>
          <FooterLink href="/legal/cgu">CGU</FooterLink>
          <FooterLink href="/legal/cookies">Cookies</FooterLink>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto mt-6 pt-5 text-[11px] uppercase tracking-widest text-center"
        style={{ borderTop: "1px solid rgba(124,58,237,0.05)", color: "#94a3b8" }}
      >
        © {new Date().getFullYear()} Klaris — Tous droits réservés
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="dashboard-footer-link">
      {children}
    </Link>
  );
}
