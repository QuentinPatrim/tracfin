// components/landing/sections/EnvoiLienSection.tsx — Section "Envoi du lien KYC"
//
// Spotlight sur le différenciateur produit : votre client n'installe rien, ne crée
// pas de compte, reçoit juste un lien et remplit sur son téléphone en 5 min.

import {
  Mail, Smartphone, Send, Check, Lock, Zap, ShieldCheck, ArrowRight,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/landing/primitives";
import KlarisLogo from "@/components/ui/KlarisLogo";

export default function EnvoiLienSection() {
  return (
    <Section maxWidth="6xl">
      <SectionHeader
        eyebrow="Expérience client"
        title={<>Votre client remplit en 5 minutes,<br className="hidden sm:block" /> depuis son téléphone.</>}
        desc="Pas d'application à installer. Pas de compte à créer. Pas de mot de passe à mémoriser. Vous envoyez un lien sécurisé en 30 secondes, votre client clique et complète. Klaris réceptionne automatiquement."
      />

      {/* Bloc visuel : email côté agent → téléphone côté client
          Flexbox simple = ordre DOM respecté, alignement vertical au centre */}
      <div className="relative mt-8 sm:mt-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-5">
        <EmailMockup />
        <ArrowConnector />
        <PhoneMockup />
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
   Mockup 1 — Email envoyé depuis Klaris (côté agent)
   ─────────────────────────────────────────────────────────────── */

function EmailMockup() {
  return (
    <div
      className="relative w-full max-w-[360px] rounded-2xl overflow-hidden"
      style={{
        // Maquette « écran email » — volontairement sombre et OPAQUE pour tenir
        // sur la landing en mode clair comme sombre (capture produit).
        background: "linear-gradient(180deg, #12131F, #0C0D17)",
        border: "1px solid rgba(124,58,237,0.30)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.10) inset, 0 24px 60px -20px rgba(109,94,246,0.35), 0 8px 20px -8px rgba(0,0,0,0.40)",
      }}
    >
      {/* Top bar email */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.10))",
            border: "1px solid rgba(124,58,237,0.30)",
          }}
        >
          <Mail width={13} height={13} className="text-violet-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-white truncate">
            Email à Claire Martin
          </div>
          <div className="text-[9.5px] text-white/45">
            depuis votre dashboard Klaris
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-bold"
          style={{
            background: "rgba(16,185,129,0.10)",
            border: "1px solid rgba(16,185,129,0.30)",
            color: "#6ee7b7",
          }}
        >
          Prêt
        </span>
      </div>

      {/* Contenu email */}
      <div className="p-4">
        <div className="text-[10.5px] text-white/55 mb-1">À : claire.martin@email.fr</div>
        <div className="text-[12px] font-semibold text-white mb-3 leading-snug">
          Klaris · Vérification d&apos;identité pour votre projet
        </div>
        <p className="text-[11px] text-white/70 leading-relaxed mb-3">
          Bonjour Claire, dans le cadre de votre projet, merci de compléter votre fiche en cliquant sur le lien sécurisé ci-dessous.
        </p>

        {/* Le LIEN — mis en avant */}
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(236,72,153,0.08))",
            border: "1px solid rgba(124,58,237,0.35)",
            boxShadow: "0 0 0 1px rgba(124,58,237,0.10), 0 4px 14px rgba(124,58,237,0.20)",
          }}
        >
          <Lock width={11} height={11} className="text-violet-200 shrink-0" />
          <div className="flex-1 text-[10.5px] font-mono text-violet-100 truncate">
            klaris-app.fr/kyc/Yt8K…aB3z
          </div>
          <ArrowRight width={11} height={11} className="text-violet-200 shrink-0" />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40">
          <Check width={10} height={10} className="text-emerald-400" strokeWidth={3} />
          Lien sécurisé · expire dans 7 jours
        </div>
      </div>

      {/* Footer email */}
      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <Send width={10} height={10} className="text-white/40" />
        <span className="text-[9px] text-white/40">Envoi via email · SMS · WhatsApp</span>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Mockup 2 — Téléphone qui affiche le KYC
   ─────────────────────────────────────────────────────────────── */

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Halo violet derrière le téléphone */}
      <div
        className="absolute -inset-8 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(closest-side, rgba(124,58,237,0.22), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Phone frame */}
      <div
        className="relative"
        style={{
          width: 220,
          height: 440,
          borderRadius: 36,
          padding: 8,
          background: "linear-gradient(180deg, #1a1a2e, #0d0d1f)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 30px 80px -20px rgba(124,58,237,0.45), 0 12px 30px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.12) inset",
        }}
      >
        <div
          className="w-full h-full rounded-[28px] overflow-hidden relative"
          style={{ background: "#06070D" }}
        >
          {/* Notch */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black z-10" />

          <div className="flex flex-col h-full pt-7">
            {/* Status bar */}
            <div className="px-4 pb-1 flex items-center justify-between text-[8.5px] font-medium text-white/70">
              <span>14:34</span>
              <div className="flex items-center gap-1">
                <span>●●●●</span>
                <span>5G</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Top bar Klaris */}
            <div
              className="px-3 py-2 flex items-center gap-1.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <KlarisLogo size={16} />
              <div className="text-[9.5px] font-bold text-white">Klaris</div>
              <div className="ml-auto flex items-center gap-1 text-[8px] text-emerald-400">
                <Lock width={8} height={8} />
                Sécurisé
              </div>
            </div>

            {/* Stepper progression */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] uppercase tracking-widest font-bold text-violet-200">
                  Étape 2 / 6
                </span>
                <span className="text-[7.5px] text-white/40">33%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "33%",
                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                    boxShadow: "0 0 8px rgba(124,58,237,0.50)",
                  }}
                />
              </div>
            </div>

            {/* Contenu form */}
            <div className="px-3 pt-2 space-y-2 flex-1">
              <div className="text-[10.5px] font-bold text-white">Votre identité</div>
              <div className="text-[8.5px] text-white/55">Renseignements officiels.</div>

              <div className="space-y-1.5 pt-1">
                <MobileField label="Nom et prénom" value="Claire Martin" />
                <MobileField label="Date de naissance" value="12 juin 1986" />
                <MobileField label="Nationalité" value="Française" />
              </div>

              <div className="pt-1">
                <div className="text-[7.5px] uppercase tracking-widest text-white/45 font-bold mb-1">
                  Pièce d&apos;identité
                </div>
                <div
                  className="rounded-md px-2 py-1.5 flex items-center gap-1.5 border"
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    borderColor: "rgba(16,185,129,0.30)",
                  }}
                >
                  <div
                    className="w-5 h-5 rounded grid place-items-center shrink-0"
                    style={{ background: "rgba(16,185,129,0.18)" }}
                  >
                    <Check width={9} height={9} className="text-emerald-300" strokeWidth={3} />
                  </div>
                  <span className="text-[9px] text-white">CNI · reçue</span>
                </div>
              </div>
            </div>

            {/* Bouton Continuer */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div
                className="w-full py-2 rounded-md text-center text-[10px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px rgba(124,58,237,0.40)",
                }}
              >
                Continuer →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[7.5px] uppercase tracking-widest text-white/45 font-bold mb-0.5">
        {label}
      </div>
      <div
        className="px-2 py-1 rounded text-[9px] text-white"
        style={{
          background: "rgba(124,58,237,0.10)",
          border: "1px solid rgba(124,58,237,0.30)",
        }}
      >
        {value}
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
        background: "rgba(20,21,34,0.92)",
        border: "1px solid rgba(124,58,237,0.30)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Send width={12} height={12} className="text-violet-300" />
      <span className="hidden md:block text-[10px] uppercase tracking-widest font-semibold text-violet-200">
        30 sec
      </span>
      <div className="hidden md:block w-12 h-px relative">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(124,58,237,0.45), rgba(236,72,153,0.45))",
            boxShadow: "0 0 4px rgba(124,58,237,0.30)",
          }}
        />
      </div>
      <ArrowRight width={13} height={13} className="text-violet-300" />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Chip de bénéfice
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
