// app/confiance/page.tsx — Page "Confiance & Souveraineté" (argument commercial fort)

import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck, Lock, MapPin, EyeOff, Database, FileText, Archive,
  Scale, ArrowRight, Server, Cpu, Clock,
} from "lucide-react";
import { HEBERGEURS_DONNEES, SOUS_TRAITANTS, CONSERVATION } from "@/lib/legal";
import LegalFooter from "@/components/legal/LegalFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Confiance & souveraineté — Klaris",
  description: "Comment Klaris protège vos données : hébergement souverain UE (Francfort + Paris), chiffrement, accès admin minimal, conformité RGPD et LCB-FT.",
};

export default function ConfiancePage() {
  return (
    <div className="klaris-public min-h-screen relative overflow-hidden">
      {/* Halos */}
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: -200, left: -100,
          width: 600, height: 600,
          background: "radial-gradient(circle, var(--lp-orb-1), transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="fixed pointer-events-none rounded-full"
        style={{
          top: "30%", right: -200,
          width: 500, height: 500,
          background: "radial-gradient(circle, var(--lp-orb-2), transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-[color:var(--lp-border-1)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <KlarisLogo size={32} />
            <span className="font-bold tracking-tight text-[15px]">Klaris</span>
          </Link>
          <nav className="flex items-center gap-5 text-[12.5px] text-[color:var(--lp-text-3)]">
            <Link href="/securite" className="hover:text-[color:var(--lp-text)] transition">Sécurité</Link>
            <Link href="/tarifs" className="hover:text-[color:var(--lp-text)] transition">Tarifs</Link>
            <Link href="/" className="hover:text-[color:var(--lp-text)] transition">Accueil</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--lp-surface-2)] border border-[color:var(--lp-border-2)] text-[11px] uppercase tracking-widest text-[color:var(--lp-text-3)] mb-6">
              <span>🇪🇺</span> <span>Souveraineté · Transparence · Conformité</span>
            </div>
            <h1
              className="text-[44px] md:text-[60px] leading-[1.02] font-bold tracking-tight max-w-4xl mx-auto"
              style={{
                background: "var(--lp-heading)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Vos dossiers méritent un coffre-fort, pas un cloud lointain.
            </h1>
            <p className="mt-6 text-[17px] md:text-[18px] text-[color:var(--lp-text-3)] leading-relaxed max-w-3xl mx-auto">
              Klaris a été conçu pour traiter ce qui se fait de plus sensible : l'identité de vos
              clients, leurs documents personnels, et vos analyses de soupçon TRACFIN. Nous
              traitons cette responsabilité avec la même rigueur que la loi vous impose à vous.
            </p>
          </div>

          {/* Trois piliers */}
          <div className="grid sm:grid-cols-3 gap-4 mt-14">
            {[
              { icon: MapPin, title: "100% Union Européenne", text: "Vos données ne quittent jamais le sol européen. Postgres en Allemagne, fichiers en France." },
              { icon: Lock, title: "Chiffré de bout en bout", text: "TLS 1.3 en transit, AES-256 au repos. Aucun accès en clair, même par nous." },
              { icon: EyeOff, title: "Accès admin minimal", text: "Nous ne consultons jamais vos dossiers clients sauf demande explicite ou obligation judiciaire." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl p-6 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)] backdrop-blur"
              >
                <div
                  className="w-11 h-11 rounded-xl grid place-items-center mb-3"
                  style={{
                    background: "var(--lp-icon-bg)",
                    border: "1px solid var(--lp-icon-border)",
                    color: "var(--lp-icon-color)",
                  }}
                >
                  <p.icon width={18} height={18} />
                </div>
                <div className="font-semibold text-[15px] text-[color:var(--lp-text)] mb-1.5">{p.title}</div>
                <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed">{p.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section : Où vivent vos données */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Cartographie des données</Eyebrow>
          <H2>Où vivent exactement vos données ?</H2>
          <P className="mt-3 max-w-3xl">
            La souveraineté ne se déclare pas, elle se prouve. Voici la liste précise et publique
            des infrastructures qui hébergent vos données — vous pouvez vérifier chacune.
          </P>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {HEBERGEURS_DONNEES.map((h) => (
              <div
                key={h.nom}
                className="rounded-2xl p-6 border"
                style={{
                  background: "var(--lp-card-bg)",
                  borderColor: "var(--lp-card-border)",
                  boxShadow: "var(--lp-card-shadow)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl grid place-items-center"
                    style={{
                      background: "var(--lp-success-bg)",
                      border: "1px solid var(--lp-success-border)",
                      color: "var(--lp-success)",
                    }}
                  >
                    {h.nom.startsWith("Neon") ? (
                      <Database width={17} height={17} />
                    ) : (
                      <Server width={17} height={17} />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-[15px] text-[color:var(--lp-text)]">{h.nom}</div>
                    <div className="text-[11.5px] text-[color:var(--lp-text-4)] uppercase tracking-widest">{h.region}</div>
                  </div>
                </div>
                <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed mb-3">{h.role}</div>
                <div className="text-[11.5px] text-[color:var(--lp-text-4)] leading-relaxed pt-3 border-t border-[color:var(--lp-border-1)]">
                  <div className="mb-1"><span className="text-[color:var(--lp-text-3)] font-medium">Certifications :</span> {h.certifications}</div>
                  <div><span className="text-[color:var(--lp-text-3)] font-medium">Site officiel :</span>{" "}
                    <a href={h.site} target="_blank" rel="noreferrer noopener" className="text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline underline-offset-2">{h.site.replace(/^https?:\/\//, "")}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section : Engagements concrets */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Nos engagements</Eyebrow>
          <H2>Six engagements concrets, vérifiables.</H2>

          <div className="grid md:grid-cols-2 gap-3 mt-8">
            <Commitment
              icon={EyeOff}
              title="Aucune consultation de vos dossiers"
              text="Nous nous engageons à ne jamais consulter le contenu des dossiers KYC de vos clients, sauf demande explicite de votre part (debug) ou obligation judiciaire formelle (réquisition)."
            />
            <Commitment
              icon={Lock}
              title="Chiffrement à plusieurs niveaux"
              text="TLS 1.3 sur toutes les connexions, AES-256 au repos sur Neon et Scaleway, hash bcrypt/argon2 pour les mots de passe. Aucune donnée en clair stockée."
            />
            <Commitment
              icon={MapPin}
              title="Aucun transfert hors UE des données KYC"
              text="Vos dossiers et pièces ne quittent jamais l'Union Européenne. Seul Clerk (auth) est aux États-Unis sous Clauses Contractuelles Types, et ne traite que vos identifiants de session — jamais les KYC."
            />
            <Commitment
              icon={Archive}
              title="Export et portabilité à tout moment"
              text="Chaque dossier est exportable en ZIP (pièces + PDF d'attestation + fiche KYC). Vos données vous appartiennent et restent récupérables, même après résiliation."
            />
            <Commitment
              icon={Scale}
              title="Conservation 5 ans = votre garantie"
              text="L'art. L.561-12-1 du CMF nous oblige à conserver les KYC 5 ans après la fin de la relation. C'est aussi votre meilleure protection en cas de contrôle de votre autorité de tutelle."
            />
            <Commitment
              icon={FileText}
              title="Sous-traitants 100% publics"
              text={`Nous publions la liste exhaustive et à jour de nos ${SOUS_TRAITANTS.length} sous-traitants (détaillée ci-dessous) avec leur rôle, leur localisation et leur certification. Aucun tiers caché.`}
            />
          </div>
        </section>

        {/* Section : Conservation */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Durées de conservation</Eyebrow>
          <H2>Combien de temps vos données sont-elles gardées ?</H2>
          <P className="mt-3 max-w-3xl">
            Chaque type de donnée a une durée de conservation précise, dictée soit par
            l'exécution du contrat, soit par une obligation légale incompressible.
          </P>

          <div className="mt-8 rounded-2xl overflow-hidden border border-[color:var(--lp-border-2)]">
            {CONSERVATION.map((c, i) => (
              <div
                key={c.categorie}
                className="p-5"
                style={{
                  background: c.important ? "var(--lp-card-bg-accent)" : (i % 2 ? "var(--lp-surface)" : "var(--lp-surface-2)"),
                  borderTop: i > 0 ? "1px solid var(--lp-border-1)" : "none",
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                  <div className="flex items-center gap-3 md:flex-1">
                    <Clock
                      width={16}
                      height={16}
                      className={c.important ? "text-[color:var(--lp-accent-2-text)]" : "text-[color:var(--lp-text-4)]"}
                    />
                    <div className="font-medium text-[14px] text-[color:var(--lp-text)]">{c.categorie}</div>
                  </div>
                  <div className="text-[13px] text-[color:var(--lp-text-2)] font-medium md:w-72 md:shrink-0">{c.duree}</div>
                </div>
                <div className="mt-2 ml-[28px] text-[12px] text-[color:var(--lp-text-4)] leading-relaxed">
                  {c.base}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section : Sous-traitants */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Transparence sous-traitants</Eyebrow>
          <H2>{SOUS_TRAITANTS.length} sous-traitants. Pas un de plus.</H2>
          <P className="mt-3 max-w-3xl">
            Chaque sous-traitant que nous utilisons fait l'objet d'un contrat de traitement (DPA)
            conforme à l'art. 28 du RGPD. Nous limitons volontairement leur nombre pour réduire
            la surface d'exposition de vos données.
          </P>

          <div className="grid md:grid-cols-2 gap-3 mt-8">
            {SOUS_TRAITANTS.map((s) => (
              <div
                key={s.nom}
                className="rounded-xl p-5 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="font-semibold text-[14px] text-[color:var(--lp-text)]">{s.nom}</div>
                  <a
                    href={s.site}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[10.5px] text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline underline-offset-2 shrink-0"
                  >
                    {s.site.replace(/^https?:\/\//, "")} ↗
                  </a>
                </div>
                <div className="text-[12.5px] text-[color:var(--lp-text-3)] leading-relaxed mb-2">{s.finalite}</div>
                <div className="text-[11.5px] text-[color:var(--lp-text-4)] leading-relaxed">{s.localisation}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section : Architecture */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Architecture technique</Eyebrow>
          <H2>Comment ça fonctionne sous le capot ?</H2>

          <div
            className="mt-8 rounded-2xl p-6 md:p-8 border"
            style={{
              background: "var(--lp-card-bg)",
              borderColor: "var(--lp-card-border)",
              boxShadow: "var(--lp-card-shadow)",
            }}
          >
            <div className="grid md:grid-cols-3 gap-6">
              <ArchBlock
                icon={Cpu}
                title="1. Vous remplissez un KYC"
                text="Le formulaire est servi par Vercel depuis Paris (cdg1). Connexion HTTPS chiffrée TLS 1.3 jusqu'au serveur."
              />
              <ArchBlock
                icon={Database}
                title="2. Les données sont stockées"
                text="Champs structurés → Neon Postgres Frankfurt. Pièces justificatives → Scaleway Object Storage Paris. Le tout en AES-256."
              />
              <ArchBlock
                icon={ShieldCheck}
                title="3. Vous gardez la main"
                text="Vous pouvez exporter, supprimer (sous réserve de la conservation 5 ans LCB-FT) ou consulter vos données à tout moment depuis votre espace."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Eyebrow>Une question ?</Eyebrow>
          <H2>Notre engagement est avant tout humain.</H2>
          <P className="mt-3 max-w-2xl mx-auto">
            La technique est essentielle, mais elle ne suffit pas. Si vous avez la moindre
            question sur la protection de vos données, sur nos sous-traitants, ou sur un point
            de conformité particulier, écrivez-nous directement.
          </P>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contact@klaris.fr"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[14px] text-white"
              style={{
                background: "var(--lp-cta-grad)",
                boxShadow: "var(--lp-cta-shadow)",
              }}
            >
              Nous écrire
              <ArrowRight width={14} height={14} />
            </a>
            <Link
              href="/legal/confidentialite"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-[14px] text-[color:var(--lp-text-2)] bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)] hover:bg-[var(--lp-surface-3)] transition"
            >
              Lire la politique de confidentialité
            </Link>
          </div>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

/* ───────── primitives de cette page ───────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block px-2.5 py-1 rounded-md bg-[var(--lp-surface-2)] border border-[color:var(--lp-border-2)] text-[10.5px] uppercase tracking-widest text-[color:var(--lp-text-3)] mb-4">
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[28px] md:text-[34px] leading-[1.1] font-bold tracking-tight"
      style={{
        background: "var(--lp-heading)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </h2>
  );
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[15px] text-[color:var(--lp-text-3)] leading-relaxed ${className}`}>{children}</p>;
}

function Commitment({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl p-5 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]">
      <div className="flex items-start gap-3">
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
        <div>
          <div className="font-semibold text-[14px] text-[color:var(--lp-text)] mb-1">{title}</div>
          <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed">{text}</div>
        </div>
      </div>
    </div>
  );
}

function ArchBlock({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div
        className="w-11 h-11 rounded-xl grid place-items-center mb-3"
        style={{
          background: "var(--lp-icon-bg)",
          border: "1px solid var(--lp-icon-border)",
          color: "var(--lp-icon-color)",
        }}
      >
        <Icon width={18} height={18} />
      </div>
      <div className="font-semibold text-[14px] text-[color:var(--lp-text)] mb-1.5">{title}</div>
      <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed">{text}</div>
    </div>
  );
}
