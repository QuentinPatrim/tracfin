// app/guides/decret-tracfin-2026/page.tsx — Article SEO (cluster « Guides »)
// Angle : décret du 24 avril 2026 (renforcement formation LCB-FT immobilier).
// Contenu informatif, factuel ; à valider juridiquement avant publication.

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileSearch, Lock, ScrollText, Building2, ArrowRight } from "lucide-react";
import { H1, H2, Lede, P, Card, IconCircle, CTA, Eyebrow, LegalRef } from "@/components/landing/primitives";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://klaris-app.fr";
const URL = `${SITE_URL}/guides/decret-tracfin-2026`;
const TITLE = "Décret TRACFIN du 24 avril 2026 : ce qui change pour les agences immobilières";
const DESC =
  "Le décret du 24 avril 2026 renforce l'obligation de formation LCB-FT des professionnels de l'immobilier (transaction, gestion, syndic). Obligations concrètes, preuves à conserver et sanctions DGCCRF.";
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
    q: "Le décret s'applique-t-il aux mandataires, à la gestion locative et aux syndics ?",
    a: "Oui. L'obligation de formation LCB-FT vise toute personne exerçant une activité immobilière sous la loi Hoguet, sans distinction : transaction, gestion locative comme syndic de copropriété.",
  },
  {
    q: "À quelle fréquence faut-il former les collaborateurs ?",
    a: "Une formation est requise dès l'arrivée d'un collaborateur, puis de façon régulière (formation continue). Chaque session doit être tracée et documentée.",
  },
  {
    q: "Combien de temps conserver les attestations de formation ?",
    a: "Les justificatifs de formation doivent rester accessibles pendant cinq ans, y compris après le départ du collaborateur concerné.",
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
        dateModified: PUBLISHED,
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
          Mis à jour le 22 juin 2026 · Lecture ~6 min
        </div>

        <div className="mt-6">
          <Lede>
            Le 24 avril 2026, un décret est venu <strong style={{ color: "var(--lp-text)" }}>renforcer
            l'obligation de formation LCB-FT</strong> de tous les professionnels de l'immobilier.
            Voici, concrètement, ce qui change pour votre agence — et comment rester en règle sans y passer vos journées.
          </Lede>
        </div>

        {/* 1 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Ce que change le décret</H2>
        <P className="mt-4">
          Le texte précise et durcit une obligation qui existait déjà : la formation à la lutte contre le
          blanchiment de capitaux et le financement du terrorisme. Trois points à retenir :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Formation dès l'arrivée puis en continu</strong> — chaque collaborateur qui rejoint l'agence doit être formé aux obligations LCB-FT dès sa prise de poste, avec un suivi régulier ensuite.</Bullet>
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Tout le périmètre loi Hoguet</strong> — transaction, gestion locative et syndic : aucune activité n'est exclue.</Bullet>
          <Bullet><strong style={{ color: "var(--lp-text)" }}>Application immédiate</strong> — l'obligation est entrée en vigueur sans délai de mise en conformité étalé.</Bullet>
        </ul>

        {/* 2 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Ce que vous devez pouvoir prouver</H2>
        <P className="mt-4">
          En cas de contrôle DGCCRF, l'oral ne suffit pas : il faut une trace écrite. Pour chaque formation,
          conservez :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet>le <strong style={{ color: "var(--lp-text)" }}>nom du collaborateur</strong> formé ;</Bullet>
          <Bullet>la <strong style={{ color: "var(--lp-text)" }}>date</strong> et la <strong style={{ color: "var(--lp-text)" }}>durée</strong> ;</Bullet>
          <Bullet>le <strong style={{ color: "var(--lp-text)" }}>contenu</strong> abordé et l'<strong style={{ color: "var(--lp-text)" }}>organisme</strong> formateur.</Bullet>
        </ul>
        <P className="mt-4">
          Ces attestations doivent rester accessibles <strong style={{ color: "var(--lp-text)" }}>cinq ans</strong>,
          même lorsqu'un collaborateur quitte l'agence.
        </P>

        {/* 3 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">Les risques en cas de manquement</H2>
        <P className="mt-4">
          L'immobilier est le secteur le plus contrôlé en matière de LCB-FT. Un défaut de formation
          formalisée expose l'agence à :
        </P>
        <ul className="mt-4 space-y-3">
          <Bullet>des <strong style={{ color: "var(--lp-text)" }}>amendes administratives</strong> prononcées par la DGCCRF ;</Bullet>
          <Bullet>un <strong style={{ color: "var(--lp-text)" }}>retrait possible de la carte professionnelle</strong> ;</Bullet>
          <Bullet>la <strong style={{ color: "var(--lp-text)" }}>responsabilité personnelle du dirigeant</strong> en cas de manquements associés.</Bullet>
        </ul>

        {/* 4 */}
        <H2 className="mt-12 !text-[24px] sm:!text-[28px]">La formation ne suffit pas</H2>
        <P className="mt-4">
          Se former est nécessaire, mais ne couvre qu'une partie de vos obligations. La LCB-FT impose aussi,
          pour chaque relation d'affaires : l'<strong style={{ color: "var(--lp-text)" }}>identification du client</strong> (KYC)
          et du bénéficiaire effectif, l'<strong style={{ color: "var(--lp-text)" }}>évaluation du risque</strong>, une
          <strong style={{ color: "var(--lp-text)" }}> vigilance jusqu'à l'acte définitif</strong>, et la
          <strong style={{ color: "var(--lp-text)" }}> déclaration de soupçon à TRACFIN</strong> en cas de doute.
        </P>
        <div className="mt-4"><LegalRef>CMF Art. L.561-2</LegalRef></div>

        {/* 5 — produit */}
        <Card accent className="mt-10">
          <div className="flex items-start gap-3">
            <IconCircle icon={ShieldCheck} />
            <div>
              <H2 className="!text-[20px] sm:!text-[22px]">Comment Klaris vous aide à rester en règle</H2>
              <P className="mt-2">
                Klaris automatise la partie « dossier » de la LCB-FT pour les agents immobiliers : ce qu'un
                contrôle DGCCRF exige, prêt en quelques minutes.
              </P>
              <ul className="mt-4 space-y-2.5">
                <FeatureLine icon={FileSearch}>Identification client (KYC) par lien sécurisé, sans app à installer côté client.</FeatureLine>
                <FeatureLine icon={ShieldCheck}>Scoring de risque automatique à 4 niveaux, versionné et auditable.</FeatureLine>
                <FeatureLine icon={Lock}>Conservation chiffrée 5 ans en France &amp; UE, conforme à l'obligation légale.</FeatureLine>
                <FeatureLine icon={ScrollText}>Attestation de conformité horodatée et opposable, prête pour le contrôle.</FeatureLine>
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
          Cet article est informatif et ne constitue pas un conseil juridique. Pour le texte exact et ses
          références, consultez Légifrance et rapprochez-vous de votre autorité de tutelle (DGCCRF) ou d'un conseil.
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
