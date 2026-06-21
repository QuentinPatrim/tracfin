// app/securite/page.tsx — Page "Sécurité, certifications & cadre réglementaire"
//
// Objectif : répondre publiquement aux questions des prospects sur la certification
// et la conformité de Klaris. Argumentaire factuel, sans bullshit, défendable
// en cas de challenge juridique ou de contrôle DGCCRF chez le client.

import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck, ScrollText, Scale, Lock, FileCheck, Building2,
  Award, ExternalLink, AlertTriangle, BadgeCheck, Cpu, FileText,
  ArrowRight,
} from "lucide-react";
import { HEBERGEURS_DONNEES, SOUS_TRAITANTS } from "@/lib/legal";
import LegalFooter from "@/components/legal/LegalFooter";
import KlarisLogo from "@/components/ui/KlarisLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Sécurité & cadre réglementaire — Klaris",
  description:
    "Statut juridique de Klaris, conformité RGPD, certifications de la chaîne de sous-traitance, opposabilité de l'attestation LCB-FT. Réponses factuelles à toutes les questions de conformité.",
};

export default function SecuritePage() {
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
            <Link href="/confiance" className="hover:text-[color:var(--lp-text)] transition">Confiance</Link>
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
              <ShieldCheck width={13} height={13} /> Cadre réglementaire & certifications
            </div>
            <h1
              className="text-[40px] md:text-[56px] leading-[1.04] font-bold tracking-tight max-w-4xl mx-auto"
              style={{
                background: "var(--lp-heading)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Klaris est-il certifié, agréé, réglementé ?
            </h1>
            <p className="mt-6 text-[17px] md:text-[18px] text-[color:var(--lp-text-3)] leading-relaxed max-w-3xl mx-auto">
              Réponse honnête, sans détour. Klaris n'a besoin d'aucun agrément spécifique —
              aucun n'existe pour ce type d'outil. Voici pourquoi, et sur quoi repose
              concrètement la solidité juridique de la solution.
            </p>
          </div>
        </section>

        {/* Section 1 : Statut juridique — pourquoi pas d'agrément */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <Eyebrow>Statut juridique</Eyebrow>
          <H2>Klaris est un éditeur de logiciel, pas un assujetti LCB-FT.</H2>
          <P className="mt-3 max-w-3xl">
            La distinction est fondamentale. Les régimes d'agrément (TRACFIN, ACPR, DGCCRF,
            AMF) encadrent <strong>les professionnels qui réalisent les opérations</strong>{" "}
            — pas les éditeurs des outils qu'ils utilisent.
          </P>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="rounded-2xl p-6 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]">
              <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-widest text-[color:var(--lp-success)] font-semibold">
                <BadgeCheck width={14} height={14} /> Qui est assujetti
              </div>
              <ul className="space-y-2.5 text-[13.5px] text-[color:var(--lp-text-3)] leading-relaxed">
                <li className="flex gap-2"><span className="text-[color:var(--lp-success)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">L'agent immobilier</strong> (votre métier) — DGCCRF</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-success)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">Le notaire</strong> — Conseil supérieur du notariat</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-success)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">La banque</strong> — ACPR / Banque de France</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-success)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">L'expert-comptable</strong> — Ordre / DGCCRF</span></li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[color:var(--lp-border-1)] text-[12px] text-[color:var(--lp-text-4)] leading-relaxed">
                Ces professionnels doivent eux-mêmes appliquer L.561-1 et s. CMF, déclarer
                leurs soupçons à TRACFIN, et conserver leurs dossiers 5 ans. Klaris les
                aide à le faire, ne s'y substitue jamais.
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]">
              <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-widest text-[color:var(--lp-accent-text)] font-semibold">
                <Building2 width={14} height={14} /> Qui est Klaris
              </div>
              <ul className="space-y-2.5 text-[13.5px] text-[color:var(--lp-text-3)] leading-relaxed">
                <li className="flex gap-2"><span className="text-[color:var(--lp-accent-text)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">Éditeur de logiciel applicatif</strong> (code APE 5829C)</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-accent-text)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">Prestataire B2B</strong> — fournit un outil, pas un service réglementé</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-accent-text)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">Sous-traitant RGPD</strong> de ses clients (art. 28 RGPD)</span></li>
                <li className="flex gap-2"><span className="text-[color:var(--lp-accent-text)] mt-0.5">▸</span> <span><strong className="text-[color:var(--lp-text)]">Non-assujetti LCB-FT</strong> — hors champ L.561-2 CMF</span></li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[color:var(--lp-border-1)] text-[12px] text-[color:var(--lp-text-4)] leading-relaxed">
                Aucun texte (CMF, Décret 2018-284, lignes directrices DGCCRF) n'encadre
                ou ne certifie les éditeurs RegTech. Aucun de nos concurrents
                (AML Factory, Notilus, MyChoiseTech…) n'a d'agrément non plus.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 : Ce sur quoi repose réellement notre crédibilité */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Solidité juridique</Eyebrow>
          <H2>Sur quoi repose vraiment la crédibilité de Klaris ?</H2>
          <P className="mt-3 max-w-3xl">
            À défaut d'agrément (qui n'existe pas), notre crédibilité juridique repose
            sur cinq piliers concrets, vérifiables et opposables.
          </P>

          <div className="grid md:grid-cols-2 gap-3 mt-8">
            <Pillar
              n="01"
              icon={ScrollText}
              title="Sources légales citées dans l'app"
              text="Chaque verdict d'attestation cite les articles précis : CMF L.561-1 à L.561-22, Décret 2018-284, lignes directrices DGCCRF 2023. Lors d'un contrôle, vos décisions sont rattachables au texte exact qui les fonde."
            />
            <Pillar
              n="02"
              icon={Cpu}
              title="Algorithme déterministe et versionné"
              text="Notre scoring est reproductible (même entrée = même verdict), versionné (algoVersion stocké en base), et hashé SHA-256 dans chaque attestation PDF. Aucun arbitraire, aucune boîte noire."
            />
            <Pillar
              n="03"
              icon={Lock}
              title="Chaîne d'hébergement certifiée"
              text="Données structurées hébergées par Neon (SOC 2 Type II, ISO 27001). Pièces justificatives par Scaleway France (ISO 27001/27017/27018, HDS, SOC 2). Chiffrement AES-256 au repos, TLS 1.3 en transit."
            />
            <Pillar
              n="04"
              icon={FileCheck}
              title="Conservation conforme L.561-12-1 CMF"
              text="Conservation des KYC 5 ans à compter de la fin de la relation d'affaires, comme la loi vous l'impose. Klaris vous garantit la disponibilité de la preuve en cas de contrôle DGCCRF, jusqu'au délai légal."
            />
            <Pillar
              n="05"
              icon={Award}
              title="Conformité RGPD documentée"
              text="Registre des traitements tenu (art. 30 RGPD), DPA disponible sur demande (art. 28), mentions légales et politique de confidentialité à jour, droits exerçables par e-mail. Pas une certification, mais une obligation documentée."
            />
            <Pillar
              n="06"
              icon={Building2}
              title="Sous-traitants tous identifiés"
              text={`Liste publique de nos ${SOUS_TRAITANTS.length} sous-traitants, chacun avec DPA signé. Aucun tiers caché, aucune sous-sous-traitance opaque. Vous savez en permanence où vivent vos données.`}
            />
          </div>
        </section>

        {/* Section 3 : Tableau des certifications de la chaîne */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Chaîne de sous-traitance</Eyebrow>
          <H2>Les certifications réelles, fournisseur par fournisseur.</H2>
          <P className="mt-3 max-w-3xl">
            Nos sous-traitants sont des acteurs établis, audités annuellement par des
            organismes indépendants. Voici leur tableau de bord de conformité.
          </P>

          <div className="mt-8 rounded-2xl overflow-hidden border border-[color:var(--lp-border-2)]">
            <div className="grid grid-cols-[1.4fr_2fr_1.2fr] bg-[var(--lp-surface)] px-5 py-3 text-[10.5px] uppercase tracking-widest text-[color:var(--lp-text-4)] font-semibold">
              <div>Fournisseur</div>
              <div>Rôle dans la chaîne</div>
              <div className="text-right">Certifications</div>
            </div>
            {HEBERGEURS_DONNEES.map((h, i) => (
              <div
                key={h.nom}
                className="grid grid-cols-[1.4fr_2fr_1.2fr] px-5 py-4 gap-4"
                style={{
                  background: i % 2 ? "var(--lp-surface)" : "var(--lp-surface-2)",
                  borderTop: "1px solid var(--lp-border-1)",
                }}
              >
                <div>
                  <div className="text-[13.5px] font-semibold text-[color:var(--lp-text)]">{h.nom}</div>
                  <div className="text-[11px] text-[color:var(--lp-text-4)] mt-0.5">{h.region}</div>
                </div>
                <div className="text-[12.5px] text-[color:var(--lp-text-3)] leading-relaxed">{h.role}</div>
                <div className="text-[11.5px] text-[color:var(--lp-text-3)] text-right leading-relaxed">{h.certifications}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[12px] text-[color:var(--lp-text-4)] leading-relaxed max-w-3xl">
            Note : ces certifications portent sur l'infrastructure, pas sur Klaris lui-même.
            Klaris hérite de leur niveau de sécurité par contrat (DPA art. 28 RGPD) et y
            ajoute ses propres mesures applicatives (chiffrement applicatif, contrôle
            d'accès, audit log).
          </div>
        </section>

        {/* Section 4 : Roadmap certifications */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <Eyebrow>Feuille de route</Eyebrow>
          <H2>Et après ? Notre trajectoire certifications.</H2>
          <P className="mt-3 max-w-3xl">
            Aujourd'hui, aucune certification supplémentaire n'est exigée pour exercer
            notre activité. Nous suivons néanmoins une trajectoire alignée sur les
            standards SaaS B2B européens, à mesure que nos clients grandissent.
          </P>

          <div className="mt-8 grid md:grid-cols-3 gap-3">
            <Phase
              label="Aujourd'hui"
              status="active"
              items={[
                "Conformité RGPD documentée",
                "DPA disponible sur demande",
                "Hébergement souverain (Paris + Francfort)",
                "Algorithme versionné & opposable",
                "Sous-traitants certifiés SOC 2 / ISO 27001",
              ]}
            />
            <Phase
              label="Sous 12 mois"
              status="planned"
              items={[
                "Audit RGPD par un DPO externe certifié",
                "Cyber-RC Pro spécialisée tech (Stoïk / Hiscox)",
                "Politique de divulgation responsable (security.txt)",
                "Tests de pénétration annuels",
              ]}
            />
            <Phase
              label="Quand le marché l'exigera"
              status="future"
              items={[
                "Label France Cybersecurity (ANSSI)",
                "Référencement UGAP (marché public)",
                "ISO 27001 (entreprises et réseaux nationaux)",
                "SOC 2 Type II (international)",
              ]}
            />
          </div>
        </section>

        {/* Section 5 : FAQ */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <Eyebrow>Questions fréquentes</Eyebrow>
          <H2>Les vraies questions, les vraies réponses.</H2>

          <div className="mt-8 space-y-3">
            <FAQ q="Klaris est-il agréé par TRACFIN ?">
              Non — et aucun outil ne peut l'être. TRACFIN est le service de renseignement
              financier (cellule de Bercy), il <strong>reçoit</strong> les déclarations de
              soupçon faites par les professionnels assujettis, il ne certifie aucun
              logiciel. C'est le professionnel (vous) qui déclare, jamais l'éditeur.
            </FAQ>
            <FAQ q="Klaris est-il agréé par l'ACPR ?">
              Non — l'ACPR (Autorité de Contrôle Prudentiel et de Résolution) supervise les
              établissements bancaires, financiers, et de paiement. Klaris n'est ni une
              banque, ni un PSAN, ni un PSI. Aucun cadre d'agrément ACPR ne s'applique aux
              éditeurs RegTech.
            </FAQ>
            <FAQ q="Klaris est-il agréé par la DGCCRF ?">
              Non — la DGCCRF supervise les professionnels de l'immobilier (vous), pas leurs
              outils. Elle vérifie chez vous que vos obligations LCB-FT sont remplies. Klaris
              vous y aide en restituant chaque décision avec sa base légale, mais vous restez
              le sujet du contrôle.
            </FAQ>
            <FAQ q="Quelle est la base légale de l'attestation Klaris ?">
              L'attestation est délivrée sur la base de l'analyse algorithmique Klaris,
              appliquant les articles L.561-1 et s. du Code monétaire et financier, le
              Décret 2018-284, et les lignes directrices DGCCRF 2023 pour le secteur
              immobilier. Elle est <strong>opposable</strong> mais{" "}
              <strong>ne se substitue pas</strong> à votre analyse personnelle — vous restez
              le décideur final.
            </FAQ>
            <FAQ q="Vos données sont-elles certifiées ISO 27001 ?">
              L'infrastructure qui héberge vos données l'est : Neon (base PostgreSQL) est
              certifié SOC 2 Type II et ISO 27001, Scaleway (pièces) est certifié ISO 27001,
              ISO 27017, ISO 27018 et HDS. Klaris hérite par contrat de ce niveau de sécurité
              (DPA art. 28 RGPD). Klaris lui-même n'est pas (encore) certifié ISO 27001 en
              tant qu'éditeur — c'est une trajectoire visée lorsque le volume de clients
              enterprise le justifiera.
            </FAQ>
            <FAQ q="Êtes-vous conforme au RGPD ?">
              Oui. Nous tenons un registre des traitements (art. 30), nous fournissons un
              DPA conforme à l'art. 28 (disponible sur demande à <a href="mailto:contact@klaris.fr" className="text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline">contact@klaris.fr</a>),
              nos sous-traitants sont tous listés publiquement (Vercel, Neon, Scaleway, Clerk,
              Stripe), et les droits d'accès / rectification / effacement sont exerçables
              par e-mail. La conservation 5 ans des données KYC découle directement de
              l'art. L.561-12-1 CMF (obligation légale qui prime sur le droit à l'effacement).
            </FAQ>
            <FAQ q="Et en cas de contrôle DGCCRF chez moi ?">
              L'export ZIP (attestation PDF + fiche KYC PDF + toutes les pièces) couvre
              l'intégralité de ce que la DGCCRF peut vous demander : identité du client,
              analyse de risque motivée, pièces justificatives, hash SHA-256 d'intégrité,
              et conservation 5 ans documentée. Vous présentez ce ZIP, vous êtes en règle.
            </FAQ>
            <FAQ q="Que se passe-t-il en cas de faille de sécurité ?">
              Notification CNIL sous 72h (art. 33 RGPD), notification individuelle des
              personnes concernées si risque élevé (art. 34), procédure interne de gestion
              de l'incident documentée, et — lorsque nous serons couverts — indemnisation
              via notre cyber-RC Pro. La transparence prime sur l'opacité.
            </FAQ>
          </div>
        </section>

        {/* Section 6 : Mise en garde sur les promesses creuses */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div
            className="rounded-2xl p-7 md:p-9 border"
            style={{
              background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(248,113,113,0.04))",
              borderColor: "rgba(251,146,60,0.25)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                style={{
                  background: "rgba(251,146,60,0.18)",
                  border: "1px solid rgba(251,146,60,0.40)",
                }}
              >
                <AlertTriangle width={17} height={17} className="text-orange-300" />
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-widest text-orange-300/85 font-semibold mb-2">
                  À savoir
                </div>
                <h3 className="text-[20px] md:text-[22px] font-bold tracking-tight text-[color:var(--lp-text)] mb-3">
                  Méfiez-vous des promesses « certifié TRACFIN ».
                </h3>
                <p className="text-[13.5px] text-[color:var(--lp-text-3)] leading-relaxed">
                  Si un éditeur RegTech vous affirme être « certifié TRACFIN », « agréé
                  DGCCRF » ou « approuvé ACPR », c'est <strong>factuellement faux</strong>{" "}
                  — ces certifications n'existent pas pour les éditeurs. Une telle
                  affirmation relève de la pratique commerciale trompeuse (art. L.121-1 du
                  Code de la consommation, 2 ans d'emprisonnement et 300 000 € d'amende).
                  Chez Klaris, nous préférons la précision juridique à la promesse
                  marketing creuse.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Eyebrow>Une question précise ?</Eyebrow>
          <H2>Demandez le DPA ou un point juridique.</H2>
          <P className="mt-3 max-w-2xl mx-auto">
            Vous êtes un responsable conformité, un DPO, un compliance officer ?
            Nous vous transmettons sur demande le DPA, la liste détaillée des
            sous-traitants, ou répondons à tout point spécifique de votre due diligence.
          </P>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contact@klaris.fr?subject=Demande%20DPA%20%2F%20Question%20conformit%C3%A9"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[14px] text-white"
              style={{
                background: "var(--lp-cta-grad)",
                boxShadow: "var(--lp-cta-shadow)",
              }}
            >
              Demander le DPA
              <ArrowRight width={14} height={14} />
            </a>
            <Link
              href="/confiance"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-[14px] text-[color:var(--lp-text-2)] bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)] hover:bg-[var(--lp-surface-3)] transition"
            >
              Voir la cartographie des données
            </Link>
            <Link
              href="/legal/confidentialite"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-[14px] text-[color:var(--lp-text-2)] bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)] hover:bg-[var(--lp-surface-3)] transition"
            >
              Politique de confidentialité
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

function Pillar({
  n,
  icon: Icon,
  title,
  text,
}: {
  n: string;
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl p-6 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)] relative overflow-hidden">
      <div
        className="absolute top-3 right-4 text-[36px] font-bold tracking-tighter select-none pointer-events-none"
        style={{
          background: "var(--lp-accent-grad)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {n}
      </div>
      <div
        className="w-10 h-10 rounded-xl grid place-items-center mb-4"
        style={{
          background: "var(--lp-icon-bg)",
          border: "1px solid var(--lp-icon-border)",
          color: "var(--lp-icon-color)",
        }}
      >
        <Icon width={16} height={16} />
      </div>
      <div className="font-semibold text-[15px] text-[color:var(--lp-text)] mb-2">{title}</div>
      <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed">{text}</div>
    </div>
  );
}

function Phase({
  label,
  status,
  items,
}: {
  label: string;
  status: "active" | "planned" | "future";
  items: string[];
}) {
  const styles =
    status === "active"
      ? { dot: "var(--lp-success)", ring: "var(--lp-success-border)", label: "var(--lp-success)" }
      : status === "planned"
      ? { dot: "var(--lp-accent-text)", ring: "var(--lp-card-border-accent)", label: "var(--lp-accent-text)" }
      : { dot: "var(--lp-text-4)", ring: "var(--lp-border-1)", label: "var(--lp-text-4)" };

  return (
    <div className="rounded-2xl p-6 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: styles.dot, boxShadow: `0 0 0 4px ${styles.ring}` }}
        />
        <div
          className="text-[10.5px] uppercase tracking-widest font-semibold"
          style={{ color: styles.label }}
        >
          {label}
        </div>
      </div>
      <ul className="space-y-2 text-[13px] text-[color:var(--lp-text-3)] leading-relaxed">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="text-[color:var(--lp-text-4)] mt-0.5 shrink-0">▸</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-[color:var(--lp-border-2)] bg-[var(--lp-surface)] overflow-hidden">
      <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between gap-4 hover:bg-[var(--lp-surface)] transition">
        <span className="text-[14.5px] font-semibold text-[color:var(--lp-text)]">{q}</span>
        <ExternalLink
          width={14}
          height={14}
          className="text-[color:var(--lp-text-4)] shrink-0 group-open:rotate-45 transition-transform"
          style={{ transform: "rotate(45deg)" }}
        />
      </summary>
      <div className="px-5 pb-5 -mt-1 text-[13.5px] text-[color:var(--lp-text-3)] leading-relaxed">
        {children}
      </div>
    </details>
  );
}
