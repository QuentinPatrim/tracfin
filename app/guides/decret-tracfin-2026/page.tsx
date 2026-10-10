// app/guides/decret-tracfin-2026/page.tsx — Article SEO (cluster « Guides »)
// Angle : décret n° 2026-310 du 24 avril 2026 (obligation de formation LCB-FT des
// professionnels assujettis, art. D.561-38-1-1 CMF). Chaque affirmation de l'article
// est tirée du texte publié au JORF n° 0098 du 25 avril 2026 (NOR ECOT2602447D) ou
// des articles L.561-2, L.561-34 et L.561-40 CMF. Contenu informatif.

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileSearch, Lock, ScrollText, Building2, ArrowRight } from "lucide-react";
import { H1, H2, Lede, P, Card, IconCircle, CTA, Eyebrow, LegalRef } from "@/components/landing/primitives";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://klaris-app.fr";
const URL = `${SITE_URL}/guides/decret-tracfin-2026`;
const TITLE = "Décret n° 2026-310 du 24 avril 2026 : la formation LCB-FT, ce qui change pour les agences immobilières";
const DESC =
  "Le décret n° 2026-310 du 24 avril 2026 précise l'obligation de formation à la lutte contre le blanchiment (LCB-FT) de tous les professionnels assujettis, dont les agents immobiliers. Ce que dit le texte, ce qu'il faut conserver, qui sanctionne.";
const PUBLISHED = "2026-06-22";

export const metadata: Metadata = {
  title: `${TITLE} | Klaris`,
  description: DESC,
  alternates: { canonical: "/guides/decret-tracfin-2026" },
  openGraph: { type: "article", url: URL, title: TITLE, description: DESC },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const FAQ = [
  {
    q: "Le décret s'applique-t-il à la gestion locative et aux syndics ?",
    a: "Le décret vise les personnes mentionnées à l'article L.561-2 du Code monétaire et financier. Pour l'immobilier, le 8° de cet article renvoie aux activités des 1°, 2°, 4°, 5° et 8° de l'article 1er de la loi Hoguet, et ne retient la location que sous mandat de transaction, lorsque le loyer mensuel est supérieur ou égal à 10 000 euros. La gestion immobilière (6°) et les fonctions de syndic de copropriété (9°) n'y figurent pas.",
  },
  {
    q: "À quelle fréquence faut-il former les collaborateurs ?",
    a: "Le texte prévoit une formation lors de l'embauche, puis de manière régulière. Il ne fixe pas de périodicité : le contenu et la fréquence sont adaptés aux risques identifiés et aux fonctions exercées.",
  },
  {
    q: "Combien de temps conserver les attestations de formation ?",
    a: "Les documents relatifs aux formations suivies sont tenus à jour pendant la durée des fonctions du collaborateur, puis pendant cinq ans à compter de la fin de celles-ci.",
  },
];

export default function DecretTracfin2026() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: TITLE,
        description: DESC,
        datePublished: PUBLISHED,
        dateModified: "2026-10-10",
        inLanguage: "fr-FR",
        author: { "@type": "Organization", name: "Klaris" },
        publisher: { "@type": "Organization", name: "Klaris" },
        mainEntityOfPage: URL,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-5 sm:px-6 pb-20">
        {/* Fil d'ariane léger */}
        <div className="mb-5 text-[12.5px]" style={{ color: "var(--lp-text-4)" }}>
          <Link href="/guides" className="transition hover:text-[color:var(--lp-text-2)]" style={{ color: "var(--lp-text-3)" }}>
            Guides
          </Link>{" "}
          · Réglementation
        </div>

        <Eyebrow>Guide · Réglementation LCB-FT</Eyebrow>
        <H1 className="mt-5 !text-[30px] sm:!text-[40px] md:!text-[46px]">{TITLE}</H1>

        <div className="mt-4 text-[13px]" style={{ color: "var(--lp-text-4)" }}>
          Mis à jour le 10 octobre 2026 · Lecture ~6 min
        </div>

        <div className="mt-6">
          <Lede>
            Le décret n° 2026-310 du 24 avril 2026, publié au Journal officiel du 25 avril 2026,
            <strong style={{ color: "var(--lp-text)" }}> précise l'obligation de formation LCB-FT</strong> de
            tous les professionnels assujettis, dont les agents immobiliers. Voici ce que dit le texte, et
            ce que cela change pour votre agence.
          </Lede>
        </div>

        {/* 1 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Ce que change le décret</H2>
        <P className="mt-4">
          Le texte précise une obligation qui figurait déjà à l'article L.561-34 du Code monétaire et
          financier : la formation à la lutte contre le blanchiment de capitaux et le financement du
          terrorisme. Il crée pour cela l'article D.561-38-1-1 du même code. Le même décret modifie aussi
          les règles d'accès au registre des bénéficiaires effectifs, que ce guide ne détaille pas.
          Trois points à retenir :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Formation à l'embauche, puis de manière régulière</strong> — les personnes qui participent à la mise en œuvre des obligations LCB-FT sont formées lors de leur embauche, puis régulièrement. La formation porte sur les obligations et sur les sanctions applicables, et aide à reconnaître les opérations susceptibles d'être liées au blanchiment ou au financement du terrorisme.</Bullet>
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Tous les professionnels assujettis</strong> — le décret vise l'ensemble des personnes mentionnées à l'article L.561-2, pas seulement l'immobilier. Pour l'immobilier, seules les activités visées au 8° sont concernées : la location n'y entre que sous mandat de transaction, lorsque le loyer mensuel atteint 10 000 euros. La gestion locative et le syndic de copropriété n'y figurent pas.</Bullet>
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Entrée en vigueur le lendemain de la publication</strong> — soit le 26 avril 2026 pour l'obligation de formation.</Bullet>
        </ul>

        {/* 2 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Ce que vous devez pouvoir prouver</H2>
        <P className="mt-4">
          L'autorité de contrôle s'assure que l'obligation de formation est respectée, et que la fréquence
          et le contenu des formations sont adaptés aux fonctions exercées et aux risques auxquels l'agence
          est exposée. Le texte vous demande de :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet><strong style={{ color: "var(--lp-text)" }}>tenir à jour l'ensemble des documents relatifs aux formations obligatoires</strong> suivies par les membres de votre personnel ;</Bullet>
          <Bullet>les conserver <strong style={{ color: "var(--lp-text)" }}>pendant la durée de leurs fonctions, puis cinq ans</strong> à compter de la fin de celles-ci ;</Bullet>
          <Bullet>les tenir <strong style={{ color: "var(--lp-text)" }}>à la disposition de l'autorité de contrôle</strong> (la DGCCRF pour les agents immobiliers).</Bullet>
        </ul>
        <P className="mt-4">
          Le décret ne dresse pas de liste des pièces à conserver.
        </P>

        {/* 3 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Les risques en cas de manquement</H2>
        <P className="mt-4">
          Les contrôles sont menés par la DGCCRF. Les sanctions sont prononcées par la Commission
          nationale des sanctions, qui peut décider :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet>un avertissement, un blâme, une interdiction temporaire d'exercice (cinq ans au plus) ou le <strong style={{ color: "var(--lp-text)" }}>retrait de la carte professionnelle</strong> ;</Bullet>
          <Bullet>une <strong style={{ color: "var(--lp-text)" }}>sanction pécuniaire</strong>, à la place ou en plus, jusqu'à cinq millions d'euros ou le double de l'avantage retiré du manquement ;</Bullet>
          <Bullet>des sanctions visant aussi <strong style={{ color: "var(--lp-text)" }}>les dirigeants et les salariés</strong>, du fait de leur implication personnelle.</Bullet>
        </ul>
        <div className="mt-4"><LegalRef>CMF Art. L.561-40</LegalRef></div>

        {/* 4 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">La formation ne suffit pas</H2>
        <P className="mt-4">
          Se former est nécessaire, mais ne couvre qu'une partie de vos obligations. La LCB-FT impose aussi,
          pour chaque relation d'affaires : l'<strong style={{ color: "var(--lp-text)" }}>identification du client</strong> (KYC)
          et du bénéficiaire effectif, l'<strong style={{ color: "var(--lp-text)" }}>évaluation du risque</strong>, une
          <strong style={{ color: "var(--lp-text)" }}> vigilance constante pendant toute la relation d'affaires</strong>, et la
          <strong style={{ color: "var(--lp-text)" }}> déclaration de soupçon à TRACFIN</strong> en cas de doute.
        </P>
        <div className="mt-4"><LegalRef>CMF Art. L.561-4-1, L.561-5, L.561-6 et L.561-15</LegalRef></div>

        {/* 5 — produit */}
        <Card accent className="mt-10">
          <div className="flex items-start gap-3">
            <IconCircle icon={ShieldCheck} />
            <div>
              <H2 className="!text-[20px] sm:!text-[22px]">Comment Klaris vous aide à rester en règle</H2>
              <P className="mt-2">
                Klaris aide les agents immobiliers sur la partie « dossier client » de la LCB-FT. Klaris ne
                remplace pas la formation de vos équipes.
              </P>
              <ul className="mt-4 space-y-2.5">
                <FeatureLine icon={FileSearch}>Identification client (KYC) par lien sécurisé, sans app à installer côté client.</FeatureLine>
                <FeatureLine icon={ShieldCheck}>Scoring de risque automatique à 4 niveaux, versionné et auditable.</FeatureLine>
                <FeatureLine icon={Lock}>Conservation chiffrée 5 ans, hébergée en France et dans l'Union européenne.</FeatureLine>
                <FeatureLine icon={ScrollText}>Attestation PDF horodatée, avec empreinte SHA-256, à présenter en cas de contrôle.</FeatureLine>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <CTA href="/tarifs" variant="primary">Découvrir Klaris<ArrowRight width={15} height={15} /></CTA>
                <CTA href="/" variant="ghost">Voir la démo</CTA>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <H2 className="mt-14 !text-[24px] sm:!text-[28px]">Questions fréquentes</H2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl p-5 border"
              style={{ background: "var(--lp-card-bg)", borderColor: "var(--lp-card-border)", boxShadow: "var(--lp-card-shadow)" }}
            >
              <div className="flex items-start gap-2.5">
                <Building2 width={16} height={16} className="mt-1 shrink-0" style={{ color: "var(--lp-accent-text)" }} />
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: "var(--lp-text)" }}>{f.q}</div>
                  <p className="mt-1.5 text-[13.5px] sm:text-[14px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Avertissement */}
        <div
          className="mt-10 rounded-xl p-4 text-[12.5px] leading-relaxed"
          style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-1)", color: "var(--lp-text-4)" }}
        >
          Cet article est informatif et ne constitue pas un conseil juridique. Sources : décret n° 2026-310 du
          24 avril 2026 (JORF n° 0098 du 25 avril 2026, NOR ECOT2602447D) ; articles L.561-2, L.561-34, L.561-40
          et D.561-38-1-1 du Code monétaire et financier. Pour le texte exact, consultez Légifrance et
          rapprochez-vous de votre autorité de contrôle (DGCCRF) ou d'un conseil.
        </div>
      </article>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: "var(--lp-accent)" }}
      />
      <span className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{children}</span>
    </li>
  );
}

function FeatureLine({ icon: Icon, children }: { icon: React.ComponentType<{ width?: number; height?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0" style={{ color: "var(--lp-accent-text)" }}>
        <Icon width={16} height={16} />
      </span>
      <span className="text-[13.5px] sm:text-[14px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>
        {children}
      </span>
    </li>
  );
}
