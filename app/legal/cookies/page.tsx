// app/legal/cookies/page.tsx — Politique cookies (CNIL Délibération 2020-091)

import type { Metadata } from "next";
import { COOKIES, EDITEUR } from "@/lib/legal";
import { LegalTitle, Section, P, Strong, Callout, TableWrap, TH, TD } from "@/components/legal/LegalUI";

export const metadata: Metadata = {
  title: "Politique cookies — Klaris",
  description: "Quels cookies Klaris utilise, pourquoi, et comment les gérer.",
};

export default function CookiesPage() {
  return (
    <>
      <LegalTitle
        eyebrow="Traceurs"
        title="Politique cookies"
        subtitle="Quels traceurs sont déposés par Klaris, pour quelles finalités, et comment vous pouvez les gérer."
        updatedAt="16 mai 2026"
      />

      <Callout tone="info" title="L'essentiel">
        Klaris n'utilise <Strong>aucun cookie publicitaire</Strong>, ni outil d'analytics
        comportemental, ni tracker tiers. Les seuls cookies déposés sont <Strong>strictement
        nécessaires au fonctionnement du Service</Strong> : authentification de session et
        sécurisation du paiement. Conformément à la recommandation CNIL du 17 septembre 2020,
        ces cookies ne nécessitent pas votre consentement préalable.
      </Callout>

      <Section title="1. Qu'est-ce qu'un cookie ?">
        <P>
          Un cookie est un petit fichier texte déposé par un site web sur le navigateur de
          l'utilisateur. Il permet notamment de mémoriser une session de connexion, des
          préférences d'affichage, ou de mesurer la fréquentation d'un site. Le terme inclut
          également les technologies similaires (local storage, session storage).
        </P>
      </Section>

      <Section title="2. Cookies utilisés par Klaris">
        <TableWrap>
          <thead>
            <tr>
              <TH>Nom</TH>
              <TH>Émetteur</TH>
              <TH>Finalité</TH>
              <TH>Durée</TH>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.nom}>
                <TD><code className="text-[12.5px] text-violet-200 font-mono">{c.nom}</code></TD>
                <TD>{c.emetteur}</TD>
                <TD>{c.finalite}</TD>
                <TD>{c.duree}</TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <P>
          Tous les cookies ci-dessus sont catégorisés comme <Strong>strictement nécessaires</Strong>{" "}
          au sens de l'article 82 de la loi Informatique et Libertés et des recommandations CNIL.
          Ils ne peuvent donc pas être désactivés sans dégrader le fonctionnement essentiel du
          Service (notamment l'impossibilité de se connecter).
        </P>
      </Section>

      <Section title="3. Pas d'analytics, pas de pub">
        <P>
          Klaris fait le choix délibéré de <Strong>ne pas utiliser d'outil d'analytics
          comportemental</Strong> (Google Analytics, Matomo en mode tracking, etc.) ni de tracker
          publicitaire. Cette posture est cohérente avec le secteur très sensible (LCB-FT) dans
          lequel le Service s'inscrit : moins de tiers = moins de surface de risque.
        </P>
        <P>
          Si nous devions ajouter un outil de mesure d'audience à l'avenir, nous privilégierions
          une solution conforme à l'exemption CNIL (configuration anonymisée, hébergement EU,
          pas de croisement avec d'autres sources) et vous en informerions explicitement.
        </P>
      </Section>

      <Section title="4. Comment gérer les cookies depuis votre navigateur ?">
        <P>
          Vous pouvez à tout moment refuser ou supprimer les cookies depuis les paramètres de
          votre navigateur. Attention : refuser les cookies strictement nécessaires rendra
          impossible la connexion au Service.
        </P>
        <P>Liens directs vers la documentation des principaux navigateurs :</P>
        <ul className="list-disc pl-6 text-[14px] text-white/75 leading-relaxed space-y-1">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Microsoft Edge</a></li>
        </ul>
      </Section>

      <Section title="5. Contact">
        <P>
          Pour toute question relative à cette politique cookies :{" "}
          <a href={`mailto:${EDITEUR.emailRgpd}`} className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{EDITEUR.emailRgpd}</a>.
        </P>
      </Section>
    </>
  );
}
