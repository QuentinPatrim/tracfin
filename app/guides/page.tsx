// app/guides/page.tsx — Hub du cluster de contenu « Guides » (SEO + maillage interne)

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

/* Les guides prennent la couleur de la barre du K de l'obligation qu'ils traitent
   (0 identifier · 1 évaluer · 2 conserver · 3 déclarer · 4 justifier). Un guide qui
   ne relève pas d'une seule obligation (ex. la formation) garde le dégradé. */
const K_BARS = ["#2F5BFF", "#5468FF", "#9A6BEB", "#EC6A93", "#FF6A4D"];
const K_TEXT = ["#1F45E0", "#3F50E6", "#7B4FD6", "#D2457A", "#E5502F"];

interface GuideMeta {
  href: string;
  /** Obligation traitée (index de la barre du K), si le guide en traite une seule. */
  ob?: 0 | 1 | 2 | 3 | 4;
  tag: string;
  title: string;
  excerpt: string;
}

const GUIDES: GuideMeta[] = [
  {
    href: "/guides/decret-tracfin-2026",
    tag: "Réglementation",
    title: "Décret n° 2026-310 du 24 avril 2026 : la formation LCB-FT, ce qui change pour les agences",
    excerpt:
      "Le décret précise l'obligation de formation LCB-FT de tous les professionnels assujettis, dont les agents immobiliers. Ce que dit le texte, ce qu'il faut conserver, qui sanctionne.",
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
            className="kl-guide group"
            style={(g.ob === undefined ? {} : { "--c": K_BARS[g.ob], "--ct": K_TEXT[g.ob] }) as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="kl-guide__bar" aria-hidden="true" />
              <span className="kl-guide__tag">{g.tag}</span>
            </div>
            <div className="kl-guide__t">{g.title}</div>
            <p className="kl-guide__p">{g.excerpt}</p>
            <div className="kl-guide__go">
              Lire le guide
              <ArrowRight width={14} height={14} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
