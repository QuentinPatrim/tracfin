// app/page.tsx — Landing Klaris

"use client";

import Link from "next/link";
import { useClerk, useAuth } from "@clerk/nextjs";
import {
  FileSearch, Lock, Send, Mail, FileDown,
  Sparkles, ArrowRight, Check, Building2, Briefcase, Scale, ShieldCheck,
} from "lucide-react";
import FloatingNav from "@/components/landing/FloatingNav";
import HeroCarousel from "@/components/landing/HeroCarousel";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function LandingPage() {
  const { openSignUp } = useClerk();
  const { isSignedIn } = useAuth();

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: "#06070D", fontFamily: "Inter, sans-serif" }}
    >
      <BackgroundOrbs />
      <NoiseTexture />

      <FloatingNav />

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 pt-36 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="relative z-10">
            <FloatingChip>
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
              <span>La conformité LCB-FT, simplifiée</span>
            </FloatingChip>

            <h1 className="text-[42px] md:text-[58px] lg:text-[68px] leading-[1.04] font-extrabold tracking-[-0.035em] mb-6 mt-6">
              Protégez votre agence
              <br />
              avec des audits{" "}
              <span
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
                  backgroundSize: "200% 200%",
                  animation: "gradShift 6s ease infinite",
                }}
              >
                LCB-FT instantanés
              </span>
            </h1>

            <p className="text-base md:text-lg text-white/55 mb-8 leading-relaxed max-w-xl">
              Générez des fiches KYC sécurisées, collectez les pièces justificatives et obtenez un score de risque Tracfin automatique pour chaque transaction.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {isSignedIn ? (
                <CTAButton href="/dashboard" primary>
                  Mon dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </CTAButton>
              ) : (
                <CTAButton onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })} primary>
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </CTAButton>
              )}
              <CTAButton href="/tarifs">Voir les tarifs</CTAButton>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-white/40 uppercase tracking-[0.15em] font-semibold">
              <TrustItem>Conforme RGPD</TrustItem>
              <TrustItem>Sans CB requise</TrustItem>
              <TrustItem>Hébergé en Europe</TrustItem>
            </div>
          </div>

          {/* Carrousel */}
          <div className="relative z-10 hidden lg:block">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-24">
        <SectionHeader
          eyebrow="Fonctionnalités"
          title="Tout ce qu'il vous faut, rien de superflu"
          desc="Pensé pour les professionnels de l'immobilier. Chaque fonctionnalité répond à une obligation Tracfin réelle."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<FileSearch className="w-5 h-5" />} accent="cyan" badge="KYC"
            title="Formulaire KYC dynamique"
            description="Un lien unique sécurisé envoyé à vos clients (Physique ou Morale) pour collecter leurs informations et pièces justificatives."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5" />} accent="violet" badge="Score auto"
            title="Scoring Tracfin en temps réel"
            description="Notre algorithme analyse 7 critères réglementaires pour donner un niveau de risque immédiat."
          />
          <FeatureCard
            icon={<Lock className="w-5 h-5" />} accent="emerald" badge="RGPD"
            title="Stockage sécurisé"
            description="Hébergement chiffré en Europe pour les Kbis, pièces d'identité et documents financiers."
          />
          <FeatureCard
            icon={<Send className="w-5 h-5" />} accent="pink" badge="0 friction"
            title="Envoi par lien partagé"
            description="Pas d'app à installer côté client. Vous générez un lien, vous l'envoyez par email ou WhatsApp."
          />
          <FeatureCard
            icon={<Mail className="w-5 h-5" />} accent="indigo" badge="Auto"
            title="Pré-remplissage intelligent"
            description="Quand le client a rempli sa fiche KYC, son dossier Tracfin se pré-remplit automatiquement."
          />
          <FeatureCard
            icon={<FileDown className="w-5 h-5" />} accent="cyan" badge="PDF"
            title="Attestation PDF premium"
            description="Exportez en un clic une attestation LCB-FT au design pro, archivable lors d'un contrôle."
          />
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="how" className="relative max-w-6xl mx-auto px-6 py-24">
        <SectionHeader
          eyebrow="Comment ça marche"
          title={<>De la collecte à l'attestation,<br />en 4 étapes</>}
        />

        <div className="relative">
          <div
            className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.4) 30%, rgba(168,85,247,0.4) 70%, transparent)" }}
          />

          <div className="space-y-8 md:space-y-16">
            <StepRow num="01" title="Créez le dossier" desc="En quelques secondes, créez un dossier dans votre tableau de bord, attribuez-lui un client (physique ou morale)." align="left" />
            <StepRow num="02" title="Envoyez la fiche KYC" desc="Générez un lien sécurisé personnalisé. Partagez-le par email, WhatsApp ou SMS. Le client remplit en ligne et upload ses documents." align="right" />
            <StepRow num="03" title="Pré-remplissage automatique" desc="Vous êtes notifié dès que le client a complété sa fiche. Les données et pièces justificatives remplissent automatiquement votre dossier Tracfin." align="left" />
            <StepRow num="04" title="Score & attestation" desc="Validez les facteurs de risque, obtenez un score automatique (vert/orange/rouge), exportez l'attestation PDF en un clic." align="right" />
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <SectionHeader eyebrow="Pour qui" title="Conçu pour les professionnels exigeants" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AudienceCard icon={<Building2 className="w-6 h-6" />} title="Agences immobilières" description="Gérez vos transactions vendeurs/acquéreurs en conformité avec le décret n° 2018-284." />
          <AudienceCard icon={<Briefcase className="w-6 h-6" />} title="Conseillers patrimoniaux" description="Sécurisez vos opérations clients avec une trace écrite des contrôles LCB-FT effectués." />
          <AudienceCard icon={<Scale className="w-6 h-6" />} title="Notaires & juristes" description="Centralisez les pièces et l'analyse de risque dans un dossier structuré, prêt pour les contrôles." />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative max-w-5xl mx-auto px-6 py-24">
        <div
          className="relative rounded-3xl p-10 md:p-14 text-center overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow: [
              "0 0 0 1px rgba(255,255,255,0.08)",
              "0 1px 0 rgba(255,255,255,0.15) inset",
              "0 30px 80px -20px rgba(168,85,247,0.40)",
              "0 12px 30px -8px rgba(0,0,0,0.5)",
            ].join(", "),
          }}
        >
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366F1, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #EC4899, transparent 70%)" }}
          />
          <div
            className="absolute inset-x-12 top-0 h-px rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.30) 50%, transparent)" }}
          />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.025em] mb-4">
              Prêt à sécuriser votre activité ?
            </h2>
            <p className="text-white/55 mb-8 max-w-xl mx-auto leading-relaxed">
              Démarrez gratuitement. Sans carte bancaire. Première fiche KYC en moins de 2 minutes.
            </p>
            {!isSignedIn && (
              <CTAButton onClick={() => openSignUp({ fallbackRedirectUrl: "/dashboard" })} primary large>
                Créer mon compte gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </CTAButton>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/[0.06] py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KlarisLogo size={26} />
            <span className="text-[14px] font-bold tracking-tight">Klaris</span>
          </div>
          <div className="text-[11px] text-white/30 uppercase tracking-widest">
            © {new Date().getFullYear()} — Tous droits réservés
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

/* ----- Sub-components ----- */

function BackgroundOrbs() {
  return (
    <>
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 800, height: 800, top: -250, left: -180, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
      }} />
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 700, height: 700, bottom: -200, right: -150, zIndex: 0, filter: "blur(110px)",
        background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)",
      }} />
      <div className="fixed pointer-events-none rounded-full" style={{
        width: 500, height: 500, top: "40%", left: "50%", zIndex: 0, filter: "blur(110px)",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)",
      }} />
    </>
  );
}

function NoiseTexture() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
      style={{
        zIndex: 1,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function FloatingChip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: "linear-gradient(180deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
        backdropFilter: "blur(20px)",
        boxShadow: "0 0 0 1px rgba(168,85,247,0.30), 0 1px 0 rgba(255,255,255,0.10) inset, 0 0 24px -4px rgba(168,85,247,0.40)",
      }}
    >
      <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-200 inline-flex items-center gap-2">
        {children}
      </span>
    </div>
  );
}

function CTAButton({
  children, onClick, href, primary = false, large = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
  large?: boolean;
}) {
  const sizeClass = large ? "px-8 py-4 text-[14px]" : "px-7 py-3.5 text-[14px]";

  const base = `group inline-flex items-center justify-center gap-2 rounded-full font-bold transition-transform hover:scale-105 ${sizeClass}`;

  const primaryStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
    backgroundSize: "200% 200%",
    animation: "gradShift 6s ease infinite",
    color: "white",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.10) inset, 0 1px 0 rgba(255,255,255,0.30) inset, 0 10px 40px rgba(168,85,247,0.50), 0 4px 12px rgba(0,0,0,0.3)",
  };

  const secondaryStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    color: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 1px 0 rgba(255,255,255,0.10) inset, 0 8px 24px -4px rgba(0,0,0,0.3)",
  };

  if (href) {
    return (
      <Link href={href} className={base} style={primary ? primaryStyle : secondaryStyle}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={base} style={primary ? primaryStyle : secondaryStyle}>
      {children}
    </button>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(52,211,153,0.15)",
          boxShadow: "0 0 0 1px rgba(52,211,153,0.40), 0 0 8px rgba(52,211,153,0.30)",
        }}
      >
        <Check className="w-2.5 h-2.5 text-emerald-400" strokeWidth={3} />
      </div>
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow, title, desc,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="text-center mb-16">
      <div className="inline-block mb-3 text-[11px] font-bold tracking-[0.2em] uppercase"
        style={{
          background: "linear-gradient(90deg, #6366F1, #A855F7, #EC4899)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {eyebrow}
      </div>
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.025em] mb-4">
        {title}
      </h2>
      {desc && <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">{desc}</p>}
    </div>
  );
}

function FeatureCard({
  icon, accent, badge, title, description,
}: {
  icon: React.ReactNode;
  accent: "indigo" | "cyan" | "emerald" | "violet" | "pink";
  badge: string;
  title: string;
  description: string;
}) {
  const colorMap = {
    indigo: { hex: "99,102,241", text: "text-indigo-300" },
    cyan: { hex: "6,182,212", text: "text-cyan-300" },
    emerald: { hex: "52,211,153", text: "text-emerald-300" },
    violet: { hex: "168,85,247", text: "text-violet-300" },
    pink: { hex: "236,72,153", text: "text-pink-300" },
  }[accent];

  return (
    <div
      className="group relative rounded-3xl p-6 transition-all overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.06)",
          "0 1px 0 rgba(255,255,255,0.10) inset",
          "0 20px 40px -12px rgba(0,0,0,0.4)",
          `0 0 0 0 rgba(${colorMap.hex},0)`,
        ].join(", "),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = [
          `0 0 0 1px rgba(${colorMap.hex},0.25)`,
          "0 1px 0 rgba(255,255,255,0.15) inset",
          "0 20px 40px -12px rgba(0,0,0,0.4)",
          `0 0 40px -8px rgba(${colorMap.hex},0.40)`,
        ].join(", ");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = [
          "0 0 0 1px rgba(255,255,255,0.06)",
          "0 1px 0 rgba(255,255,255,0.10) inset",
          "0 20px 40px -12px rgba(0,0,0,0.4)",
        ].join(", ");
      }}
    >
      {/* Highlight courbe top */}
      <div
        className="absolute inset-x-6 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 50%, transparent)" }}
      />
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 blur-3xl group-hover:opacity-35 transition-opacity"
        style={{ background: `rgb(${colorMap.hex})` }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div
            className={`w-10 h-10 rounded-2xl ${colorMap.text} flex items-center justify-center`}
            style={{
              background: `linear-gradient(180deg, rgba(${colorMap.hex},0.20), rgba(${colorMap.hex},0.08))`,
              boxShadow: `0 0 0 1px rgba(${colorMap.hex},0.35), 0 0 20px -4px rgba(${colorMap.hex},0.30), 0 1px 0 rgba(255,255,255,0.15) inset`,
            }}
          >
            {icon}
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${colorMap.text}`}
            style={{
              background: `rgba(${colorMap.hex},0.10)`,
              boxShadow: `0 0 0 1px rgba(${colorMap.hex},0.30)`,
            }}
          >
            {badge}
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2 tracking-tight">{title}</h3>
        <p className="text-[13px] text-white/50 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepRow({ num, title, desc, align }: { num: string; title: string; desc: string; align: "left" | "right" }) {
  return (
    <div className={`md:grid md:grid-cols-2 md:gap-12 items-center ${align === "right" ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div className={`md:max-w-md ${align === "right" ? "md:ml-auto md:text-right" : ""}`}>
        <div
          className="inline-block text-[60px] md:text-[84px] font-black leading-none tracking-tighter mb-2"
          style={{
            background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
            backgroundSize: "200% 200%",
            animation: "gradShift 6s ease infinite",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(168,85,247,0.4))",
          }}
        >
          {num}
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] mb-3">{title}</h3>
        <p className="text-white/55 leading-relaxed">{desc}</p>
      </div>
      <div className={`hidden md:block ${align === "right" ? "" : ""}`} />
    </div>
  );
}

function AudienceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div
      className="group relative rounded-3xl p-7 transition-all"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.06)",
          "0 1px 0 rgba(255,255,255,0.10) inset",
          "0 20px 40px -12px rgba(0,0,0,0.4)",
        ].join(", "),
      }}
    >
      <div
        className="absolute inset-x-6 top-0 h-px rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.20) 50%, transparent)" }}
      />
      <div
        className="w-12 h-12 rounded-2xl text-white/70 flex items-center justify-center mb-5 group-hover:text-violet-300 transition-all"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 1px 0 rgba(255,255,255,0.10) inset",
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-[13px] text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}