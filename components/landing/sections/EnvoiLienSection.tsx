// components/landing/sections/EnvoiLienSection.tsx — Section "Envoi du lien KYC"
//
// Spotlight sur le différenciateur produit : votre client n'installe rien, ne crée
// pas de compte, reçoit juste un lien et remplit sur son téléphone en 5 min.
// Le téléphone affiche le VRAI formulaire client (/kyc/demo), pas une maquette.

import {
  Mail, Smartphone, Send, Check, Lock, Zap, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/landing/primitives";
import KycPhonePreview from "@/components/landing/KycPhonePreview";

export default function EnvoiLienSection() {
  return (
    <Section maxWidth="6xl">
      <SectionHeader
        eyebrow="Expérience client"
        title={<>Votre client remplit en 5 minutes,<br className="hidden sm:block" /> depuis son téléphone.</>}
        desc="Pas d'application à installer. Pas de compte à créer. Pas de mot de passe à mémoriser. Vous envoyez un lien sécurisé en 30 secondes, votre client clique et complète. Klaris réceptionne automatiquement."
      />

      {/* Bloc visuel : email côté agent → téléphone côté client (vrai formulaire) */}
      <div className="relative mt-8 sm:mt-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-5">
        <EmailMockup />
        <ArrowConnector />
        <KycPhonePreview />
      </div>

      {/* Bénéfices clés sous le visuel */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <BenefitChip
          icon={Zap}
          title="30 secondes"
          desc="pour envoyer le lien depuis Klaris"
        />
        <BenefitChip
          icon={Smartphone}
          title="Mobile-first"
          desc="le formulaire est optimisé téléphone"
        />
        <BenefitChip
          icon={ShieldCheck}
          title="Pas de compte"
          desc="aucun mot de passe pour votre client"
        />
      </div>
    </Section>
  );
}

/* ───────────────────────────────────────────────────────────────
   Mockup — Email envoyé depuis Klaris (côté agent) — thémé clair/sombre
   ─────────────────────────────────────────────────────────────── */

function EmailMockup() {
  return (
    <div
      className="relative w-full max-w-[360px] rounded-2xl overflow-hidden"
      style={{
        background: "var(--lp-card-bg)",
        border: "1px solid var(--lp-card-border)",
        boxShadow: "var(--lp-card-shadow), 0 24px 60px -20px rgba(109,94,246,0.25)",
      }}
    >
      {/* Top bar email */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid var(--lp-border-1)" }}
      >
        <div
          className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
          style={{
            background: "var(--lp-icon-bg)",
            border: "1px solid var(--lp-icon-border)",
            color: "var(--lp-icon-color)",
          }}
        >
          <Mail width={13} height={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold truncate" style={{ color: "var(--lp-text)" }}>
            Email à Camille Rousseau
          </div>
          <div className="text-[9.5px]" style={{ color: "var(--lp-text-4)" }}>
            depuis votre dashboard Klaris
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-bold"
          style={{
            background: "var(--lp-success-bg)",
            border: "1px solid var(--lp-success-border)",
            color: "var(--lp-success)",
          }}
        >
          Prêt
        </span>
      </div>

      {/* Contenu email */}
      <div className="p-4">
        <div className="text-[10.5px] mb-1" style={{ color: "var(--lp-text-4)" }}>À : camille.rousseau@example.com</div>
        <div className="text-[12px] font-semibold mb-3 leading-snug" style={{ color: "var(--lp-text)" }}>
          Klaris · Vérification d&apos;identité pour votre projet
        </div>
        <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--lp-text-3)" }}>
          Bonjour Camille, dans le cadre de votre projet, merci de compléter votre fiche en cliquant sur le lien sécurisé ci-dessous.
        </p>

        {/* Le LIEN — mis en avant */}
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{
            background: "var(--lp-card-bg-accent)",
            border: "1px solid var(--lp-card-border-accent)",
            color: "var(--lp-accent-text)",
          }}
        >
          <Lock width={11} height={11} className="shrink-0" />
          <div className="flex-1 text-[10.5px] font-mono truncate">
            klaris-app.fr/kyc/Yt8K…aB3z
          </div>
          <ArrowRight width={11} height={11} className="shrink-0" />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--lp-text-4)" }}>
          <Check width={10} height={10} strokeWidth={3} style={{ color: "var(--lp-success)" }} />
          Lien sécurisé · expire dans 7 jours
        </div>
      </div>

      {/* Footer email */}
      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid var(--lp-border-1)", background: "var(--lp-surface)" }}
      >
        <Send width={10} height={10} style={{ color: "var(--lp-text-4)" }} />
        <span className="text-[9px]" style={{ color: "var(--lp-text-4)" }}>Envoi via email · SMS · WhatsApp</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Flèche connecteur entre les 2 mockups
   ─────────────────────────────────────────────────────────────── */

function ArrowConnector() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full"
      style={{
        background: "var(--lp-card-bg)",
        border: "1px solid var(--lp-card-border-accent)",
        boxShadow: "var(--lp-card-shadow)",
        color: "var(--lp-accent-text)",
      }}
    >
      <Send width={12} height={12} />
      <span className="hidden md:block text-[10px] uppercase tracking-widest font-semibold">
        30 sec
      </span>
      <div className="hidden md:block w-12 h-px relative">
        <div
          className="absolute inset-0"
          style={{ background: "var(--lp-cta-grad)" }}
        />
      </div>
      <ArrowRight width={13} height={13} />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Chip de bénéfice (contenu de page — thémé clair/sombre)
   ─────────────────────────────────────────────────────────────── */

function BenefitChip({
  icon: Icon, title, desc,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "var(--lp-card-bg)",
        border: "1px solid var(--lp-card-border)",
        boxShadow: "var(--lp-card-shadow)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
        style={{
          background: "var(--lp-icon-bg)",
          border: "1px solid var(--lp-icon-border)",
          color: "var(--lp-icon-color)",
        }}
      >
        <Icon width={15} height={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-bold leading-tight mb-0.5" style={{ color: "var(--lp-text)" }}>{title}</div>
        <div className="text-[12px] leading-snug" style={{ color: "var(--lp-text-3)" }}>{desc}</div>
      </div>
    </div>
  );
}
