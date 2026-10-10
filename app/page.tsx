// app/page.tsx — Page d'accueil Klaris
//
// Identité « Papier & encre » :
//  - un champ d'encre violette pour le hero et l'hébergement, du papier pour le reste ;
//  - le vrai document (attestation) et le vrai formulaire client, plutôt que des
//    cartes à icône ;
//  - l'échelle de vigilance, dans la grammaire de l'étiquette énergie, comme signature ;
//  - chaque article cité est un lien vers le texte officiel (components/landing/LegalRef).
// Règles de fond : chiffres sourcés uniquement, Klaris « aide à être conforme » et ne
// promet pas la conformité, ton rassurant.

"use client";

import Link from "next/link";
import { useClerk, useAuth } from "@clerk/nextjs";
import { Play } from "lucide-react";
import FloatingNav from "@/components/landing/FloatingNav";
import LegalFooter from "@/components/legal/LegalFooter";
import EnvoiLienSection from "@/components/landing/sections/EnvoiLienSection";
import PdfPreviewFrame from "@/components/landing/PdfPreviewFrame";
import LegalRef from "@/components/landing/LegalRef";
import { VigilanceMini, VigilanceExplorer } from "@/components/landing/VigilanceScale";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function LandingPage() {
  const { openSignUp, openSignIn } = useClerk();
  const { isSignedIn } = useAuth();

  const openDemo = () => window.dispatchEvent(new Event("klaris:open-demo"));
  const signUp = () => openSignUp({ fallbackRedirectUrl: "/dashboard" });

  return (
    <div className="klaris-public min-h-screen">
      <FloatingNav over="field" />

      <main>
        {/* ───────── HERO : le dossier, tel qu'il sort de Klaris ───────── */}
        <section className="kl-field relative">
          <div className="kl-wrap grid grid-cols-1 gap-12 pt-28 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,33rem)] lg:gap-14 lg:pt-36">
            <div className="pb-2 lg:pb-24">
              <h1 className="kl-display kl-h1 kl-enter">
                Vos dossiers LCB-FT en ordre, sans stress.
              </h1>
              <p className="kl-lede kl-enter mt-6" style={delay(70)}>
                Klaris aide les agences immobilières à identifier leurs clients, évaluer le
                niveau de vigilance et conserver les pièces cinq ans. Le jour d&apos;un contrôle,
                tout est déjà au même endroit.
              </p>

              <div className="kl-enter mt-9 flex flex-wrap items-center gap-3" style={delay(140)}>
                {isSignedIn ? (
                  <Link href="/dashboard" className="kl-btn kl-btn--onfield">
                    Mon tableau de bord
                  </Link>
                ) : (
                  <button type="button" onClick={signUp} className="kl-btn kl-btn--onfield">
                    Essayer 14 jours gratuits
                  </button>
                )}
                {/* Démo guidée : toujours accessible (connecté ou non) */}
                <button type="button" onClick={openDemo} className="kl-btn kl-btn--ghost">
                  <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
                  Voir la démo guidée
                </button>
              </div>

              <p
                className="kl-enter mt-5 text-[0.9rem]"
                style={{ ...delay(200), color: "var(--kl-on-field-2)" }}
              >
                Aucun prélèvement avant le 14ᵉ jour.
                {!isSignedIn && (
                  <>
                    {" "}Déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" })}
                      className="kl-link"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Le VRAI document remis en cas de contrôle, rendu par le gabarit PDF de
                l'application. La vignette reprend le niveau affiché sur l'attestation. */}
            <div className="kl-enter relative self-end" style={delay(220)}>
              <PdfPreviewFrame maxVisible={560}>
                <div className="absolute -bottom-7 left-3 z-10 lg:-bottom-9 lg:-left-20">
                  <VigilanceMini level={1} />
                </div>
              </PdfPreviewFrame>
            </div>
          </div>
        </section>

        <p className="kl-wrap pt-12 text-[0.8rem] lg:pt-4" style={{ color: "var(--lp-text-4)" }}>
          Document généré par Klaris à partir d&apos;un dossier fictif (« Camille Rousseau »).
        </p>

        {/* ───────── FONCTIONNEMENT : le parcours client + les 4 étapes ───────── */}
        <EnvoiLienSection />

        {/* ───────── VIGILANCE : l'échelle, signature du produit ───────── */}
        <section id="vigilance" className="kl-section kl-section--white">
          <div className="kl-wrap">
            <div className="max-w-[46rem]">
              <h2 className="kl-display kl-h2">
                Chaque dossier reçoit un niveau de vigilance, lisible comme une étiquette énergie.
              </h2>
              <p className="kl-lede mt-5">
                Klaris applique les mêmes critères à tous vos dossiers et vous dit quoi faire
                à chaque niveau. La décision reste la vôtre, et elle est tracée.
              </p>
            </div>
            <div className="mt-12 sm:mt-14">
              <VigilanceExplorer />
            </div>
          </div>
        </section>

        {/* ───────── OBLIGATIONS : ce que la loi demande, ce que fait Klaris ───────── */}
        <section id="features" className="kl-section">
          <div className="kl-wrap">
            <div className="max-w-[44rem]">
              <h2 className="kl-display kl-h2">
                Ce que la loi vous demande, et ce que Klaris prend en charge.
              </h2>
            </div>

            <table className="kl-table mt-10 sm:mt-12">
              <thead>
                <tr>
                  <th scope="col">Votre obligation</th>
                  <th scope="col">Dans Klaris</th>
                  <th scope="col" style={{ textAlign: "right" }}>Le texte</th>
                </tr>
              </thead>
              <tbody>
                {OBLIGATIONS.map((o) => (
                  <tr key={o.title}>
                    <td>{o.title}</td>
                    <td>{o.text}</td>
                    <td><LegalRef code={o.ref} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ───────── COMPRENDRE : la LCB-FT sans jargon ───────── */}
        <section id="understand" className="kl-section kl-section--white">
          <div className="kl-wrap">
            <div className="max-w-[44rem]">
              <h2 className="kl-display kl-h2">La LCB-FT en trois questions.</h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 sm:mt-12 md:grid-cols-3 md:gap-12">
              <div>
                <h3 className="kl-display kl-h3">De quoi parle-t-on ?</h3>
                <p className="kl-body mt-3">
                  De la lutte contre le blanchiment de capitaux et le financement du terrorisme.
                  Les règles viennent des directives européennes et figurent, en France, dans le
                  Code monétaire et financier.
                </p>
                <p className="mt-3"><LegalRef code="CMF L.561-1">Art. L.561-1 et suivants</LegalRef></p>
              </div>
              <div>
                <h3 className="kl-display kl-h3">Qui est concerné ?</h3>
                <p className="kl-body mt-3">
                  Les professions dites assujetties, dont les agents immobiliers. Klaris est
                  disponible pour eux aujourd&apos;hui. Experts-comptables, conseillers en gestion de
                  patrimoine, notaires et avocats suivront.
                </p>
                <p className="mt-3"><LegalRef code="CMF L.561-2">Art. L.561-2</LegalRef></p>
              </div>
              <div>
                <h3 className="kl-display kl-h3">Que faut-il faire ?</h3>
                <p className="kl-body mt-3">
                  Identifier vos clients, évaluer le risque, conserver les pièces cinq ans et
                  déclarer vos soupçons à Tracfin. Un contrôle peut vous demander d&apos;en
                  justifier.
                </p>
                <p className="mt-3"><LegalRef code="CMF L.561-12">Art. L.561-12</LegalRef></p>
              </div>
            </div>

            <p className="kl-body mt-12">
              Pour aller plus loin, <Link href="/guides" className="kl-link">nos guides</Link> détaillent
              les textes et leurs évolutions.
            </p>
          </div>
        </section>

        {/* ───────── HÉBERGEMENT : où sont les dossiers ───────── */}
        <section className="kl-field kl-section">
          <div className="kl-wrap grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
            <div>
              <h2 className="kl-display kl-h2">
                Les dossiers de vos clients sont hébergés en Union européenne.
              </h2>
              <p className="kl-lede mt-5">
                Pièces d&apos;identité, justificatifs, analyses : ce que vous confiez à Klaris est
                ce que vous avez de plus sensible. Voici où c&apos;est conservé, et qui y a accès.
              </p>
              <Link href="/confiance" className="kl-btn kl-btn--ghost mt-8">
                Lire nos engagements
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
        </section>

        {/* ───────── CTA FINAL ───────── */}
        <section className="kl-section">
          <div className="kl-wrap">
            <div className="max-w-[56rem]">
              <h2 className="kl-display kl-h1">Essayez Klaris sur votre prochain dossier.</h2>
              <p className="kl-lede mt-5">
                14 jours gratuits, aucun prélèvement avant le 14ᵉ jour, sans engagement.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {!isSignedIn ? (
                  <>
                    <button type="button" onClick={signUp} className="kl-btn kl-btn--primary">
                      Créer mon compte
                    </button>
                    <button type="button" onClick={openDemo} className="kl-btn kl-btn--ghost">
                      <Play width={13} height={13} fill="currentColor" strokeWidth={0} />
                      Voir la démo d&apos;abord
                    </button>
                  </>
                ) : (
                  <Link href="/dashboard" className="kl-btn kl-btn--primary">
                    Aller au tableau de bord
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
    title: "Identifier votre client",
    text: "Un formulaire envoyé par lien recueille l'identité, les bénéficiaires effectifs, les justificatifs et le consentement RGPD.",
    ref: "CMF L.561-5",
  },
  {
    title: "Évaluer le risque",
    text: "Chaque dossier est classé sur quatre niveaux de vigilance, selon des critères documentés. La version des règles appliquées est conservée.",
    ref: "CMF L.561-4-1",
  },
  {
    title: "Conserver cinq ans",
    text: "Fiches et pièces sont stockées chiffrées. La suppression est bloquée jusqu'au terme légal.",
    ref: "CMF L.561-12",
  },
  {
    title: "Déclarer un soupçon",
    text: "Klaris prépare un export structuré du dossier et vous envoie vers ERMES, la plateforme de Tracfin.",
    ref: "CMF L.561-15",
  },
  {
    title: "Justifier vos diligences",
    text: "Une attestation PDF horodatée, avec empreinte SHA-256, et une archive complète du dossier à présenter en cas de contrôle.",
    ref: "CMF L.561-12",
  },
];
