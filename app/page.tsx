// app/page.tsx — Landing Klaris (refonte fintech sérieuse · mobile-first)
// Direction : sécurité juridique au cœur, palette « Iris » (violet/rose/teal) via
// tokens --lp-* (clair/sombre), pédagogie LCB-FT intégrée, autorités mises en avant.

"use client";

import Link from "next/link";
import { useClerk, useAuth } from "@clerk/nextjs";
import {
  ArrowRight, Play, Check, ShieldCheck, FileSearch, Lock, Send, Mail, FileDown,
  Building2, Briefcase, Scale, Landmark, Gem,
  BookOpen, Clock, Users, Gavel, MapPin, EyeOff, Server, AlertTriangle, FileText, BadgeCheck,
} from "lucide-react";
import FloatingNav from "@/components/landing/FloatingNav";
import HeroCarousel from "@/components/landing/HeroCarousel";
import LegalFooter from "@/components/legal/LegalFooter";
import {
  Section, SectionHeader, H3, Lede, P, Card, IconCircle, CTA,
  Eyebrow, LegalRef,
} from "@/components/landing/primitives";
import EnvoiLienSection from "@/components/landing/sections/EnvoiLienSection";
import { SOUS_TRAITANTS } from "@/lib/legal";

export default function LandingPage() {
  const { openSignUp, openSignIn } = useClerk();
  const { isSignedIn } = useAuth();

  const openDemo = () => window.dispatchEvent(new Event("klaris:open-demo"));

  return (
    <div className="klaris-public min-h-screen relative overflow-x-hidden">
      <BackgroundOrbs />
      <NoiseTexture />
      <FloatingNav />

      {/* ───────── HERO ───────── */}
      <section className="relative max-w-7xl mx-auto px-5 sm:px-6 pt-28 sm:pt-32 md:pt-36 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr,1fr] gap-10 lg:gap-12 items-center">
          <div className="relative z-10">
            <Eyebrow>Conformité LCB-FT · Souveraineté UE</Eyebrow>

            <h1
              className="mt-5 text-[36px] sm:text-[46px] md:text-[56px] lg:text-[62px] leading-[1.03] font-bold tracking-tight"
              style={{
                background: "var(--lp-heading)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Tracez vos dossiers KYC{" "}
              <span
                style={{
                  background: "var(--lp-accent-grad)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                comme l'exige la loi.
              </span>
              <br className="hidden sm:block" /> Sans stress.
            </h1>

            <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] leading-relaxed max-w-xl" style={{ color: "var(--lp-text-3)" }}>
              Klaris est la plateforme française de conformité LCB-FT pour les professionnels
              assujettis. Identification client, scoring de risque, conservation 5 ans, attestations
              opposables — tout ce qu'attend un contrôle DGCCRF, ACPR ou de votre Ordre.
            </p>

            <div className="mt-7 sm:mt-8 flex flex-wrap gap-3">
              {isSignedIn ? (
                <CTA href="/dashboard" variant="primary" size="lg">
                  Mon tableau de bord
                  <ArrowRight width={15} height={15} />
                </CTA>
              ) : (
                <>
                  <CTA onClick={openDemo} variant="primary" size="lg">
                    <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
                    Voir la démo
                  </CTA>
                  <CTA onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })} variant="ghost" size="lg">
                    Essayer 14 jours gratuits
                    <ArrowRight width={15} height={15} />
                  </CTA>
                </>
              )}
            </div>

            {/* Lien discret pour les utilisateurs déjà inscrits — évite que la
                seule porte d'entrée pour eux soit le bouton sign-up (ambigu). */}
            {!isSignedIn && (
              <div className="mt-3 text-[13px]" style={{ color: "var(--lp-text-4)" }}>
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" })}
                  className="font-medium underline underline-offset-4 transition text-[color:var(--lp-text-2)] hover:text-[color:var(--lp-text)]"
                >
                  Se connecter
                </button>
              </div>
            )}

            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[11.5px]" style={{ color: "var(--lp-text-4)" }}>
              <TrustItem>Aucun prélèvement avant J14</TrustItem>
              <TrustItem>Données 100% UE</TrustItem>
              <TrustItem>Conforme RGPD</TrustItem>
            </div>
          </div>

          {/* Mockup carrousel (maquette « écran » — volontairement sombre) */}
          <div className="relative z-10 mt-2 lg:mt-0">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* ───────── BANDEAU AUTORITÉS ───────── */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-6 pb-8">
        <div
          className="rounded-2xl p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 border"
          style={{
            background: "var(--lp-card-bg)",
            borderColor: "var(--lp-card-border)",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--lp-card-shadow)",
          }}
        >
          <AuthorityPill icon={Scale} label="RGPD" sub="Règlement UE 2016/679" />
          <AuthorityPill icon={Gavel} label="CMF L.561" sub="Code monétaire & financier" />
          <AuthorityPill icon={ShieldCheck} label="Privacy by design" sub="Registre RGPD tenu" />
          <AuthorityPill icon={MapPin} label="🇪🇺 Souverain" sub="Francfort · Paris" />
        </div>
      </section>

      {/* ───────── COMPRENDRE LA LCB-FT ───────── */}
      <Section id="understand">
        <SectionHeader
          eyebrow="Comprendre"
          title={<>La LCB-FT, en 60 secondes.</>}
          desc="Avant de parler outil, posons les bases. Trois questions, trois réponses, pour savoir où vous mettez les pieds."
        />

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <IconCircle icon={BookOpen} />
            <div className="mt-4 mb-1.5 flex items-center gap-2">
              <H3>De quoi parle-t-on ?</H3>
            </div>
            <P>
              La <Strong>lutte contre le blanchiment de capitaux et le
              financement du terrorisme</Strong>. Imposée par la 5ᵉ directive européenne, transposée
              en droit français au sein du <em>Code monétaire et financier</em>.
            </P>
            <div className="mt-3"><LegalRef>CMF Art. L.561-1 et s.</LegalRef></div>
          </Card>

          <Card>
            <IconCircle icon={Users} tone="teal" />
            <div className="mt-4 mb-1.5"><H3>À qui ça s'applique ?</H3></div>
            <P>
              Aux <Strong>professions assujetties</Strong> : agents
              immobiliers, experts-comptables, CGP, notaires, avocats sous conditions, marchands
              d'art… Plus de 200 000 professionnels en France.
            </P>
            <div className="mt-3"><LegalRef>CMF Art. L.561-2</LegalRef></div>
          </Card>

          <Card>
            <IconCircle icon={Clock} tone="pink" />
            <div className="mt-4 mb-1.5"><H3>Quelles obligations ?</H3></div>
            <P>
              Identifier vos clients (KYC), évaluer le risque, <Strong>conserver
              les pièces 5 ans</Strong>, signaler les soupçons à TRACFIN. Le contrôle peut tomber
              à tout moment.
            </P>
            <div className="mt-3"><LegalRef>CMF Art. L.561-12-1 · L.561-15</LegalRef></div>
          </Card>
        </div>

        <div className="mt-6 text-center text-[12.5px]" style={{ color: "var(--lp-text-4)" }}>
          Vous voulez tout savoir ? Un guide pédagogique est inclus dans le tableau de bord (7 chapitres, ~10 min).
        </div>
      </Section>

      {/* ───────── VOUS ÊTES CONCERNÉ SI… ───────── */}
      <Section maxWidth="6xl">
        <SectionHeader
          eyebrow="Périmètre"
          title={<>Vous êtes concerné si vous exercez…</>}
          desc="La LCB-FT vise une dizaine de professions distinctes. Klaris s'adapte au cadre légal de chacune — KYC, scoring, autorité de contrôle."
        />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <ProfCard icon={Building2} title="Agent immobilier" sub="Transactions ≥ 10 000 € · Locations ≥ 10 000 €/mois" auth="Contrôle DGCCRF" available />
          <ProfCard icon={Briefcase} title="Expert-comptable" sub="Toute mission de conseil ou de tenue comptable" auth="Contrôle Conseil de l'Ordre" comingSoon />
          <ProfCard icon={Landmark} title="CGP · CIF" sub="Conseil en gestion de patrimoine / investissements" auth="Contrôle AMF" comingSoon />
          <ProfCard icon={Scale} title="Notaire" sub="Toute relation d'affaires à risque" auth="Conseil supérieur du notariat" comingSoon />
          <ProfCard icon={FileText} title="Avocat" sub="Sous conditions : immo, fiscal, fiducie" auth="Contrôle Bâtonniers" comingSoon />
          <ProfCard icon={Gem} title="Marchand d'art / précieux" sub="Transactions en numéraire ≥ 10 000 €" auth="Contrôle Douanes" comingSoon />
        </div>
      </Section>

      {/* ───────── FONCTIONNALITÉS ───────── */}
      <Section id="features">
        <SectionHeader
          eyebrow="Plateforme"
          title="Tout ce qu'un contrôle peut exiger."
          desc="Six fonctionnalités, six obligations LCB-FT réelles. Pas de gadget — chaque module répond à un article du CMF."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard
            icon={FileSearch}
            title="Formulaire KYC dynamique"
            text="Lien sécurisé unique envoyé à votre client. Identification, bénéficiaires effectifs, justificatifs, consentement RGPD."
            refCode="L.561-5"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Scoring LCB-FT v2"
            text="Algorithme propriétaire à 4 niveaux : vigilance standard, renforcée, examen renforcé, interdiction. Versionné et auditable."
            refCode="L.561-10"
          />
          <FeatureCard
            icon={Lock}
            title="Conservation 5 ans"
            text="Stockage chiffré AES-256 en France & UE. Conservation automatique conforme à l'obligation légale, suppression bloquée jusqu'au terme."
            refCode="L.561-12-1"
          />
          <FeatureCard
            icon={Send}
            title="Envoi 0 friction"
            text="Pas d'app à installer pour vos clients. Le formulaire passe par email, SMS ou WhatsApp. Réception automatique dans votre dossier."
            refCode="L.561-4"
          />
          <FeatureCard
            icon={Mail}
            title="Déclaration TRACFIN"
            text="Bouton direct vers le portail ERMES. Export structuré de votre fiche KYC, prêt à joindre à la déclaration de soupçon."
            refCode="L.561-15"
          />
          <FeatureCard
            icon={FileDown}
            title="Attestation PDF certifiée"
            text="Document horodaté, signé SHA-256, opposable lors d'un contrôle. Format premium, références CMF intégrées."
            refCode="L.561-32"
          />
        </div>
      </Section>

      {/* ───────── ENVOI DU LIEN KYC (spotlight différenciateur) ───────── */}
      <EnvoiLienSection />

      {/* ───────── 4 ÉTAPES ───────── */}
      <Section id="how" maxWidth="5xl">
        <SectionHeader
          eyebrow="Workflow"
          title={<>De la collecte à l'attestation,<br className="hidden sm:block" /> en 4 étapes claires.</>}
          desc="Aucune étape ne dépasse 2 minutes côté professionnel. Le client final n'a aucun compte à créer."
        />

        <div className="space-y-3 sm:space-y-4">
          <StepRow
            num="01"
            title="Créez le dossier"
            text="Saisissez le nom du client (personne physique ou morale), choisissez son type. Klaris pré-configure le KYC adapté."
          />
          <StepRow
            num="02"
            title="Envoyez le formulaire KYC"
            text="Un lien sécurisé est généré. Vous le partagez par le canal de votre choix. Le client remplit en autonomie depuis n'importe quel appareil."
          />
          <StepRow
            num="03"
            title="Recevez l'analyse automatique"
            text="Dès soumission, l'algorithme Klaris v2 calcule le niveau de vigilance. Les pièces sont stockées, le dossier pré-rempli pour vous."
          />
          <StepRow
            num="04"
            title="Exportez l'attestation"
            text="Téléchargez l'attestation PDF + fiche KYC + pièces dans un ZIP unique, prêt pour archivage ou contrôle. SHA-256 inclus."
          />
        </div>
      </Section>

      {/* ───────── SOUVERAINETÉ TEASER ───────── */}
      <Section maxWidth="6xl">
        <SectionHeader
          eyebrow="Souveraineté"
          title={<>Vos dossiers ne quittent jamais le sol européen.</>}
          desc="Klaris a été conçu pour traiter ce qui se fait de plus sensible : l'identité de vos clients, leurs documents personnels, vos analyses de soupçon. La souveraineté n'est pas un argument marketing, c'est une promesse vérifiable."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SovereigntyPoint icon={MapPin} tone="teal" title="🇪🇺 100% UE" text="Postgres Frankfurt, fichiers Paris. Aucun transfert hors UE des KYC." />
          <SovereigntyPoint icon={Lock} tone="violet" title="AES-256 + TLS 1.3" text="Chiffrement au repos et en transit. Aucune donnée en clair stockée." />
          <SovereigntyPoint icon={EyeOff} tone="pink" title="Aucune lecture" text="Nous ne consultons jamais vos dossiers, sauf demande explicite ou réquisition." />
          <SovereigntyPoint icon={Server} tone="teal" title={`${SOUS_TRAITANTS.length} sous-traitants`} text="Liste publique et exhaustive. Pas un tiers caché." />
        </div>

        <div className="mt-8 flex justify-center">
          <CTA href="/confiance" variant="ghost">
            Lire notre engagement complet
            <ArrowRight width={14} height={14} />
          </CTA>
        </div>
      </Section>

      {/* ───────── SANCTIONS ───────── */}
      <Section maxWidth="6xl">
        <SectionHeader
          eyebrow="Le risque réel"
          title={<>La conformité n'est plus une option.</>}
          desc="Les sanctions LCB-FT sont graduelles, mais elles sont prononcées. En cas de manquement, vous risquez bien plus qu'un avertissement."
        />

        <div className="grid md:grid-cols-3 gap-3">
          <SanctionCard
            icon={AlertTriangle}
            level="Disciplinaire"
            headline="Avertissement à radiation"
            text="Avertissement, blâme, interdiction temporaire d'exercer, radiation définitive. Décision de votre autorité de tutelle."
            refCode="CMF L.561-36"
          />
          <SanctionCard
            icon={Gavel}
            level="Pécuniaire"
            headline="Jusqu'à 1 million €"
            text="Sanctions financières graduelles, pouvant atteindre 1 M€ pour défaut de vigilance manifeste. Cumul possible avec les sanctions disciplinaires."
            refCode="CMF L.561-36"
          />
          <SanctionCard
            icon={ShieldCheck}
            level="Pénale"
            headline="5 ans · 375 000 €"
            text="Complicité de blanchiment : 5 ans d'emprisonnement et 375 000 € d'amende. Doublé en cas de circonstance aggravante."
            refCode="Code pénal 324-1"
          />
        </div>

        <div
          className="mt-8 rounded-2xl p-5 sm:p-6 text-center border"
          style={{
            background: "var(--lp-card-bg-accent)",
            borderColor: "var(--lp-card-border-accent)",
          }}
        >
          <p className="text-[13.5px] sm:text-[14px] leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--lp-text-2)" }}>
            En 2024, <Strong>+47 %</Strong> de contrôles DGCCRF sur les
            agences immobilières. <Strong>3 sanctions pécuniaires sur 4</Strong>{" "}
            visaient un défaut de KYC formalisé.
          </p>
        </div>
      </Section>

      {/* ───────── CTA FINAL ───────── */}
      <Section maxWidth="4xl">
        <div
          className="relative rounded-3xl p-8 sm:p-12 md:p-14 text-center overflow-hidden border"
          style={{
            background: "var(--lp-card-bg-accent)",
            borderColor: "var(--lp-card-border-accent)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow: "var(--lp-card-shadow)",
          }}
        >
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--lp-accent), transparent 70%)" }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, var(--lp-accent-2), transparent 70%)" }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}
            >
              <BadgeCheck width={14} height={14} style={{ color: "var(--lp-accent-text)" }} />
              <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--lp-text-3)" }}>14 jours gratuits · aucun prélèvement avant J14</span>
            </div>
            <h2
              className="text-[28px] sm:text-[36px] md:text-[42px] leading-[1.1] font-bold tracking-tight"
              style={{
                background: "var(--lp-heading)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Démarrez votre conformité.
            </h2>
            <div className="mt-3 sm:mt-4 max-w-xl mx-auto">
              <Lede>
                Première fiche KYC en moins de 2 minutes. Première attestation signée et téléchargée
                en moins de 5 minutes. Sans frais, sans engagement.
              </Lede>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {!isSignedIn ? (
                <>
                  <CTA onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })} variant="primary" size="lg">
                    Créer mon compte
                    <ArrowRight width={15} height={15} />
                  </CTA>
                  <CTA onClick={openDemo} variant="ghost" size="lg">
                    <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
                    Voir la démo d'abord
                  </CTA>
                </>
              ) : (
                <CTA href="/dashboard" variant="primary" size="lg">
                  Aller au dashboard
                  <ArrowRight width={15} height={15} />
                </CTA>
              )}
            </div>
          </div>
        </div>
      </Section>

      <LegalFooter />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PRIMITIVES SPÉCIFIQUES À LA LANDING
   ════════════════════════════════════════════════════════════ */

// Emphase inline (remplace les <strong className="text-white">) — couleur thème.
function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "var(--lp-text)" }}>{children}</strong>;
}

function BackgroundOrbs() {
  return (
    <>
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 700, height: 700, top: -250, left: -180, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, var(--lp-orb-1) 0%, transparent 70%)",
      }} />
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 600, height: 600, bottom: -200, right: -150, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, var(--lp-orb-2) 0%, transparent 70%)",
      }} />
    </>
  );
}

function NoiseTexture() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
      style={{
        zIndex: 1,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: "var(--lp-success-bg)",
          border: "1px solid var(--lp-success-border)",
        }}
      >
        <Check className="w-2.5 h-2.5" strokeWidth={3} style={{ color: "var(--lp-success)" }} />
      </div>
      <span className="text-[12px] font-medium" style={{ color: "var(--lp-text-3)" }}>{children}</span>
    </div>
  );
}

function AuthorityPill({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
        style={{
          background: "var(--lp-surface)",
          border: "1px solid var(--lp-border-2)",
          color: "var(--lp-text-3)",
        }}
      >
        <Icon width={15} height={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold truncate" style={{ color: "var(--lp-text)" }}>{label}</div>
        <div className="text-[10.5px] truncate" style={{ color: "var(--lp-text-4)" }}>{sub}</div>
      </div>
    </div>
  );
}

function ProfCard({
  icon: Icon,
  title,
  sub,
  auth,
  available,
  comingSoon,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  sub: string;
  auth: string;
  available?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <Card accent={available} className="relative">
      <div className="flex items-start gap-3">
        <IconCircle icon={Icon} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <H3 className="!text-[14.5px] sm:!text-[15.5px]">{title}</H3>
            {available && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-widest"
                style={{ background: "var(--lp-success-bg)", color: "var(--lp-success)", border: "1px solid var(--lp-success-border)" }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: "currentColor" }} />
                Disponible
              </span>
            )}
            {comingSoon && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-widest"
                style={{ background: "var(--lp-surface)", color: "var(--lp-text-4)", border: "1px solid var(--lp-border-2)" }}
              >
                Bientôt
              </span>
            )}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--lp-text-3)" }}>{sub}</div>
          <div className="mt-2 text-[10.5px] uppercase tracking-widest" style={{ color: "var(--lp-text-4)" }}>{auth}</div>
        </div>
      </div>
    </Card>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
  refCode,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  text: string;
  refCode: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <IconCircle icon={Icon} />
        <LegalRef>CMF {refCode}</LegalRef>
      </div>
      <H3>{title}</H3>
      <P className="mt-1.5">{text}</P>
    </Card>
  );
}

function StepRow({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <Card>
      <div className="flex items-start gap-4 sm:gap-5">
        <div
          className="font-mono text-[22px] sm:text-[26px] font-bold tracking-tight shrink-0 w-12 sm:w-14"
          style={{
            background: "var(--lp-accent-grad)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {num}
        </div>
        <div className="flex-1">
          <H3>{title}</H3>
          <P className="mt-1.5">{text}</P>
        </div>
      </div>
    </Card>
  );
}

function SovereigntyPoint({
  icon: Icon,
  title,
  text,
  tone = "violet",
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  text: string;
  tone?: "violet" | "teal" | "pink";
}) {
  return (
    <Card>
      <IconCircle icon={Icon} size="sm" tone={tone} />
      <H3 className="mt-3 !text-[14px] sm:!text-[14.5px]">{title}</H3>
      <P className="mt-1.5 !text-[12.5px]">{text}</P>
    </Card>
  );
}

function SanctionCard({
  icon: Icon,
  level,
  headline,
  text,
  refCode,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  level: string;
  headline: string;
  text: string;
  refCode: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <IconCircle icon={Icon} size="sm" />
        <div className="text-[10.5px] uppercase tracking-widest font-semibold" style={{ color: "var(--lp-text-3)" }}>{level}</div>
      </div>
      <H3 className="!text-[16px] sm:!text-[17px]">{headline}</H3>
      <P className="mt-1.5">{text}</P>
      <div className="mt-3"><LegalRef>{refCode}</LegalRef></div>
    </Card>
  );
}
