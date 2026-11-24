// app/page.tsx — Page d'accueil Klaris (identité « Étiquette », voir DESIGN.md)
//
// Déroulé :
//  1. haut de page clair, brume cobalt et corail : le titre, puis le tableau de bord posé en perspective
//     qui se redresse au défilement, et le téléphone du client avec le vrai formulaire ;
//  2. le registre des garanties (hébergement, chiffrement, conservation, empreinte) ;
//  3. « Comment ça marche » : quatre étapes, une scène épinglée qui change de plan ;
//  4. l'échelle de vigilance, signature du produit ;
//  5. les obligations, ce que fait Klaris, le texte ;
//  6. la LCB-FT en trois questions ; 7. l'hébergement ; 8. l'appel final.
// Règles de fond : chiffres sourcés uniquement, Klaris « aide à être conforme » et ne
// promet pas la conformité, ton rassurant, chaque article cité renvoie au texte.

"use client";

import Link from "next/link";
import { useClerk, useAuth } from "@clerk/nextjs";
import { ArrowRight, Play, KeyRound } from "lucide-react";
import InstallApp from "@/components/pwa/InstallApp";
import { PhoneApp } from "@/components/landing/DemoScreens";
import FloatingNav from "@/components/landing/FloatingNav";
import LegalFooter from "@/components/legal/LegalFooter";
import ScrollFx from "@/components/landing/ScrollFx";
import LegalRef from "@/components/landing/LegalRef";
import HeroStage from "@/components/landing/HeroStage";
import HeroMark from "@/components/landing/HeroMark";
import ProductStory from "@/components/landing/ProductStory";
import { VigilanceExplorer } from "@/components/landing/VigilanceScale";
import KlarisLogo from "@/components/ui/KlarisLogo";
import "@/components/landing/landing.css";

export default function LandingPage() {
  const { openSignUp, openSignIn } = useClerk();
  const { isSignedIn } = useAuth();

  const openDemo = () => window.dispatchEvent(new Event("klaris:open-demo"));
  const signUp = () => openSignUp({ fallbackRedirectUrl: "/dashboard" });
  const signIn = () => openSignIn({ fallbackRedirectUrl: "/dashboard" });

  return (
    <div className="klaris-public min-h-screen">
      <FloatingNav over="field" />
      <ScrollFx />

      <main>
        {/* ───────── HAUT DE PAGE ───────── */}
        <section className="lp-hero">
          <div className="lp-blobs" aria-hidden="true"><span /><span /><span /></div>
          <div className="kl-wrap lp-hero__inner">
            <div className="lp-hero__grid">
            <div className="lp-hero__text">
            <Link href="/guides/decret-tracfin-2026" className="lp-announce kl-enter">
              <b>Guide</b>
              <span>Décret Tracfin 2026<span className="hidden sm:inline"> : ce qui change pour les agences</span></span>
              <ArrowRight width={14} height={14} />
            </Link>

            <h1 className="kl-display kl-h1 kl-enter" style={{ "--d": "60ms" } as React.CSSProperties}>
              Chaque client identifié. <em>Chaque dossier prêt.</em>
            </h1>

            <p className="kl-lede kl-enter" style={{ "--d": "120ms" } as React.CSSProperties}>
              Klaris aide les agences immobilières à identifier leurs clients, évaluer le niveau
              de vigilance et conserver les pièces cinq ans. Le jour d&apos;un contrôle, tout est
              déjà au même endroit.
            </p>

            <div className="lp-hero__ctas kl-enter" style={{ "--d": "180ms" } as React.CSSProperties}>
              {isSignedIn ? (
                <Link href="/dashboard" className="kl-btn kl-btn--primary kl-btn--lg">
                  Mon tableau de bord <ArrowRight width={16} height={16} className="kl-arrow" />
                </Link>
              ) : (
                <button type="button" onClick={signUp} className="kl-btn kl-btn--primary kl-btn--lg">
                  Essayer 14 jours gratuits <ArrowRight width={16} height={16} className="kl-arrow" />
                </button>
              )}
              <button type="button" onClick={openDemo} className="kl-btn kl-btn--ghost kl-btn--lg">
                <Play width={12} height={12} fill="currentColor" strokeWidth={0} />
                Voir la démo guidée
              </button>
            </div>

            <p className="lp-hero__fine kl-enter" style={{ "--d": "220ms" } as React.CSSProperties}>
              Aucun prélèvement avant le 14ᵉ jour · Sans engagement
              {!isSignedIn && (
                <>
                  {" "}· <button type="button" onClick={signIn}>Se connecter</button>
                </>
              )}
            </p>
            <p className="lp-hero__by kl-enter" style={{ "--d": "260ms" } as React.CSSProperties}>
              <span aria-hidden="true"><KeyRound width={12} height={12} strokeWidth={2.4} /></span>
              Conçu par un négociateur immobilier en activité, pour les agences.
            </p>
            </div>
            <HeroMark />
            </div>

            <div className="kl-enter w-full" style={{ "--d": "320ms" } as React.CSSProperties}>
              <HeroStage />
            </div>
          </div>
        </section>

        {/* ───────── REGISTRE DES GARANTIES ───────── */}
        <section className="pt-14 sm:pt-20">
          <div className="kl-wrap">
            <dl className="lp-ledger fx-fade" data-fx="" data-fx-span="0.4">
              <div>
                <dt>Hébergé en Union européenne</dt>
                <dd>Base de données à Francfort, fichiers à Paris.</dd>
              </div>
              <div>
                <dt>Chiffré au repos et en transit</dt>
                <dd>AES-256 au repos, TLS 1.3 pendant les échanges.</dd>
              </div>
              <div>
                <dt>Conservé cinq ans</dt>
                <dd>La suppression est bloquée jusqu&apos;au terme légal.</dd>
              </div>
              <div>
                <dt>Attestation horodatée</dt>
                <dd>Un PDF avec son empreinte SHA-256, pour chaque dossier.</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ───────── COMMENT ÇA MARCHE ───────── */}
        <ProductStory />

        {/* ───────── VIGILANCE ───────── */}
        <section id="vigilance" className="kl-section kl-section--white">
          <div className="kl-wrap">
            <div className="fx-head max-w-[48rem]" data-fx="">
              <p className="kl-kicker">L&apos;échelle de vigilance</p>
              <h2 className="kl-display kl-h2 mt-5">
                Chaque dossier reçoit un niveau, <em>lisible comme une étiquette énergie.</em>
              </h2>
              <p className="kl-lede mt-6">
                Klaris applique les mêmes critères à tous vos dossiers et vous dit quoi faire à
                chaque niveau. La décision reste la vôtre, et elle est tracée.
              </p>
            </div>
            <div className="fx-bars mt-12 sm:mt-16" data-fx="" data-fx-span="0.6">
              <VigilanceExplorer />
            </div>
          </div>
        </section>

        {/* ───────── OBLIGATIONS ───────── */}
        <section id="features" className="kl-section">
          <div className="kl-wrap">
            <div className="fx-head max-w-[46rem]" data-fx="">
              <p className="kl-kicker">Vos obligations</p>
              <h2 className="kl-display kl-h2 mt-5">
                Ce que la loi vous demande, <em>et ce que Klaris prend en charge.</em>
              </h2>
            </div>

            <table className="kl-table fx-rows mt-12 sm:mt-16" data-fx="" data-fx-span="0.7">
              <thead>
                <tr>
                  <th scope="col">Votre obligation</th>
                  <th scope="col">Dans Klaris</th>
                  <th scope="col" style={{ textAlign: "right" }}>Le texte</th>
                </tr>
              </thead>
              <tbody>
                {OBLIGATIONS.map((o) => (
                  <tr key={o.title} id={`obligation-${o.id}`}>
                    <td>{o.title}</td>
                    <td>{o.text}</td>
                    <td><LegalRef code={o.ref} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────── COMPRENDRE ───────── */}
        <section id="understand" className="kl-section kl-section--white">
          <div className="kl-wrap">
            <div className="fx-head max-w-[44rem]" data-fx="">
              <p className="kl-kicker">Comprendre</p>
              <h2 className="kl-display kl-h2 mt-5">La LCB‑FT <em>en trois questions.</em></h2>
            </div>

            <div className="fx-cols mt-12 grid grid-cols-1 gap-10 sm:mt-16 md:grid-cols-3 md:gap-10" data-fx="" data-fx-span="0.6">
              <div className="lp-q">
                <span className="lp-q__n">01</span>
                <h3>De quoi parle-t-on ?</h3>
                <p className="kl-body mt-3">
                  De la lutte contre le blanchiment de capitaux et le financement du terrorisme.
                  Les règles viennent des directives européennes et figurent, en France, dans le
                  Code monétaire et financier.
                </p>
                <p className="mt-4"><LegalRef code="CMF L.561-1">Art. L.561-1 et suivants</LegalRef></p>
              </div>
              <div className="lp-q">
                <span className="lp-q__n">02</span>
                <h3>Qui est concerné ?</h3>
                <p className="kl-body mt-3">
                  Les professions dites assujetties, dont les agents immobiliers. Klaris est
                  disponible pour eux aujourd&apos;hui. Experts-comptables, conseillers en gestion de
                  patrimoine, notaires et avocats suivront.
                </p>
                <p className="mt-4"><LegalRef code="CMF L.561-2">Art. L.561-2</LegalRef></p>
              </div>
              <div className="lp-q">
                <span className="lp-q__n">03</span>
                <h3>Que faut-il faire ?</h3>
                <p className="kl-body mt-3">
                  Identifier vos clients, évaluer le risque, conserver les pièces cinq ans et
                  déclarer vos soupçons à Tracfin. Un contrôle peut vous demander d&apos;en
                  justifier.
                </p>
                <p className="mt-4"><LegalRef code="CMF L.561-12">Art. L.561-12</LegalRef></p>
              </div>
            </div>

            <p className="kl-body mt-14">
              Pour aller plus loin, <Link href="/guides" className="kl-link">nos guides</Link> détaillent
              les textes et leurs évolutions.
            </p>
          </div>
        </section>

        {/* ───────── SUR LE TÉLÉPHONE ───────── */}
        <section id="app" className="lp-app kl-section kl-section--white">
          <div className="kl-wrap lp-app__grid">
            <div>
              <p className="kl-kicker">Sur votre téléphone</p>
              <h2 className="kl-display kl-h2 mt-5">
                Un dossier lancé <em>entre deux visites.</em>
              </h2>
              <p className="kl-lede mt-6">
                Installez Klaris sur l&apos;écran d&apos;accueil de votre téléphone. Vous créez le
                dossier, le lien part au client par e-mail, WhatsApp ou message, et vous suivez
                sa fiche depuis la voiture.
              </p>
              <ul className="lp-app__list">
                <li><b>Une icône, comme une application.</b> Klaris s&apos;ouvre en plein écran, directement sur vos dossiers.</li>
                <li><b>Rien à chercher dans un store.</b> L&apos;installation se fait depuis le site, en deux gestes.</li>
                <li><b>Toujours à jour.</b> Vos dossiers restent hébergés en Union européenne, pas sur le téléphone.</li>
              </ul>
              <div className="lp-app__ctas">
                <InstallApp className="kl-btn kl-btn--primary kl-btn--lg" label="Installer l'app Klaris" />
                <div className="lp-app__qr" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/pwa/qr-app.svg" alt="" width={88} height={88} />
                  <span>Ou scannez avec<br />votre téléphone</span>
                </div>
              </div>
            </div>
            <div className="lp-app__stage fx-head" data-fx="">
              <div className="lp-app__phone"><PhoneApp /></div>
            </div>
          </div>
        </section>

        {/* ───────── HÉBERGEMENT ───────── */}
        <section className="lp-secure kl-section">
          <div className="kl-wrap"><div className="lp-secure__panel kl-field fx-open" data-fx="" data-fx-span="0.75">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <p className="kl-kicker">Confiance</p>
              <h2 className="kl-display kl-h2 mt-5">
                Les dossiers de vos clients restent <em>en Union européenne.</em>
              </h2>
              <p className="kl-lede mt-6">
                Pièces d&apos;identité, justificatifs, analyses : ce que vous confiez à Klaris est
                ce que vous avez de plus sensible. Voici où c&apos;est conservé, et qui y a accès.
              </p>
              <Link href="/confiance" className="kl-btn kl-btn--ghost mt-9">
                Lire nos engagements <ArrowRight width={15} height={15} className="kl-arrow" />
              </Link>
            </div>

            <dl className="kl-facts">
              <div>
                <dt>Base de données à Francfort, fichiers à Paris</dt>
                <dd>Les fiches et les pièces de vos clients sont stockées dans l&apos;Union européenne.</dd>
              </div>
              <div>
                <dt>Chiffrement au repos et en transit</dt>
                <dd>AES-256 pour le stockage, TLS 1.3 pour les échanges.</dd>
              </div>
              <div>
                <dt>Vos dossiers ne sont pas consultés</dt>
                <dd>Sauf demande explicite de votre part, ou réquisition.</dd>
              </div>
              <div>
                <dt>Des sous-traitants nommés</dt>
                <dd>Leur liste est publique, avec le rôle et la localisation de chacun.</dd>
              </div>
            </dl>
          </div>
          </div></div>
        </section>

        {/* ───────── APPEL FINAL ───────── */}
        <section className="kl-section">
          <div className="kl-wrap">
            <div className="lp-cta fx-zoom" data-fx="" data-fx-span="0.5">
              <div className="lp-cta__logo" aria-hidden="true"><KlarisLogo size={340} inverted /></div>
              <h2 className="kl-display kl-h1" style={{ fontSize: "clamp(2.6rem, 1.4rem + 4.4vw, 4.75rem)" }}>
                Essayez Klaris sur <em>votre prochain dossier.</em>
              </h2>
              <p className="kl-lede">
                14 jours gratuits, aucun prélèvement avant le 14ᵉ jour, sans engagement.
              </p>
              <div className="lp-cta__btns">
                {!isSignedIn ? (
                  <>
                    <button type="button" onClick={signUp} className="kl-btn kl-btn--white kl-btn--lg">
                      Créer mon compte <ArrowRight width={16} height={16} className="kl-arrow" />
                    </button>
                    <button type="button" onClick={openDemo} className="kl-btn kl-btn--glass kl-btn--lg">
                      <Play width={12} height={12} fill="currentColor" strokeWidth={0} />
                      Voir la démo d&apos;abord
                    </button>
                  </>
                ) : (
                  <Link href="/dashboard" className="kl-btn kl-btn--white kl-btn--lg">
                    Aller au tableau de bord <ArrowRight width={16} height={16} className="kl-arrow" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

/* Ce que la loi demande → ce que fait Klaris → le texte. Une ligne par obligation
   réelle ; pas de fonctionnalité « gadget » dans ce tableau. */
const OBLIGATIONS = [
  {
    id: "identifier",
    title: "Identifier votre client",
    text: "Un formulaire envoyé par lien recueille l'identité, les bénéficiaires effectifs, les justificatifs et le consentement RGPD.",
    ref: "CMF L.561-5",
  },
  {
    id: "evaluer",
    title: "Évaluer le risque",
    text: "Chaque dossier est classé sur quatre niveaux de vigilance, selon des critères documentés. La version des règles appliquées est conservée.",
    ref: "CMF L.561-4-1",
  },
  {
    id: "conserver",
    title: "Conserver cinq ans",
    text: "Fiches et pièces sont stockées chiffrées. La suppression est bloquée jusqu'au terme légal.",
    ref: "CMF L.561-12",
  },
  {
    id: "declarer",
    title: "Déclarer un soupçon",
    text: "Klaris prépare un export structuré du dossier et vous envoie vers ERMES, la plateforme de Tracfin.",
    ref: "CMF L.561-15",
  },
  {
    id: "justifier",
    title: "Justifier vos diligences",
    text: "Une attestation PDF horodatée, avec empreinte SHA-256, et une archive complète du dossier à présenter en cas de contrôle.",
    ref: "CMF L.561-12",
  },
];
