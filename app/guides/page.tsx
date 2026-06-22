// app/guides/page.tsx — Hub du cluster de contenu « Guides » (SEO + maillage interne)

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";
import { H1, Lede, Eyebrow } from "@/components/landing/primitives";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://klaris-app.fr";

export const metadata: Metadata = {
  title: "Guides LCB-FT pour l'immobilier | Klaris",
  description:
    "Ressources pratiques sur la conformité LCB-FT des agents immobiliers : obligations, déclaration de soupçon, contrôles DGCCRF, attestations. Par Klaris.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/guides`,
    title: "Guides LCB-FT pour l'immobilier",
    description: "Ressources pratiques sur la conformité LCB-FT des agents immobiliers.",
  },
};

interface GuideMeta {
  href: string;
  tag: string;
  title: string;
  excerpt: string;
}

const GUIDES: GuideMeta[] = [
  {
    href: "/guides/decret-tracfin-2026",
    tag: "Réglementation",
    title: "Décret TRACFIN du 24 avril 2026 : ce qui change pour les agences",
    excerpt:
      "Le décret renforce l'obligation de formation LCB-FT (transaction, gestion, syndic). Obligations concrètes, preuves à conserver, sanctions DGCCRF.",
  },
];

export default function GuidesHub() {
  return (
    <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-20">
      <Eyebrow>Ressources</Eyebrow>
      <H1 className="mt-5 !text-[32px] sm:!text-[44px] md:!text-[52px]">Guides LCB-FT pour l'immobilier</H1>
      <div className="mt-4 max-w-2xl">
        <Lede>
          Des repères clairs et à jour sur vos obligations de conformité : réglementation, contrôles
          DGCCRF, déclaration de soupçon, attestations. Écrit par l'équipe Klaris.
        </Lede>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group rounded-2xl p-5 sm:p-6 border transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--lp-card-bg)", borderColor: "var(--lp-card-border)", boxShadow: "var(--lp-card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                style={{ background: "var(--lp-icon-bg)", border: "1px solid var(--lp-icon-border)", color: "var(--lp-icon-color)" }}
              >
                <ScrollText width={15} height={15} />
              </span>
              <span
                className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded"
                style={{ background: "var(--lp-surface-2)", border: "1px solid var(--lp-border-2)", color: "var(--lp-text-3)" }}
              >
                {g.tag}
              </span>
            </div>
            <div className="text-[16px] sm:text-[17px] font-semibold leading-snug" style={{ color: "var(--lp-text)" }}>
              {g.title}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{g.excerpt}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--lp-accent-text)" }}>
              Lire le guide
              <ArrowRight width={14} height={14} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
