// app/legal/cgu/page.tsx — Conditions Générales d'Utilisation

import type { Metadata } from "next";
import { EDITEUR } from "@/lib/legal";
import { LegalTitle, Section, P, Strong, List, LI, Callout, Note } from "@/components/legal/LegalUI";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Klaris",
  description: "Conditions Générales d'Utilisation du service Klaris.",
};

export default function CGUPage() {
  return (
    <>
      <LegalTitle
        eyebrow="Cadre contractuel"
        title="Conditions Générales d'Utilisation"
        subtitle="Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du Service Klaris. Elles s'appliquent à tout utilisateur dès la création de son compte."
        updatedAt="16 mai 2026"
      />

      <Section title="Article 1 — Objet">
        <P>
          Les présentes CGU ont pour objet de définir les modalités selon lesquelles{" "}
          <Strong>{EDITEUR.raisonSociale}</Strong> (« l'Éditeur ») met à disposition de
          l'utilisateur (« l'Utilisateur ») le service en ligne Klaris (« le Service »),
          plateforme SaaS d'assistance à la conformité LCB-FT destinée aux professionnels
          assujettis à la lutte contre le blanchiment et le financement du terrorisme.
        </P>
      </Section>

      <Section title="Article 2 — Acceptation">
        <P>
          La création d'un compte sur le Service vaut <Strong>acceptation pleine et entière des
          présentes CGU</Strong>. L'Utilisateur reconnaît en avoir pris connaissance et déclare
          en accepter les termes sans réserve. L'Éditeur se réserve le droit de modifier les CGU
          à tout moment ; les modifications substantielles font l'objet d'une information
          préalable d'au moins 30 jours par email.
        </P>
      </Section>

      <Section title="Article 3 — Qualité de l'Utilisateur">
        <P>
          Le Service est <Strong>strictement réservé à un usage professionnel (B2B)</Strong>. En
          créant un compte, l'Utilisateur déclare et garantit :
        </P>
        <List>
          <LI>Agir dans le cadre d'une activité professionnelle légalement enregistrée (entreprise individuelle, société, etc.)</LI>
          <LI>Être assujetti à la LCB-FT au sens de l'article L.561-2 du Code monétaire et financier, ou utiliser le Service dans un cadre légitime de conformité (formation, audit)</LI>
          <LI>Disposer du pouvoir juridique nécessaire pour engager son entité</LI>
          <LI>Fournir des informations exactes, à jour, et les maintenir dans un état conforme à la réalité</LI>
        </List>
        <Note>
          Les particuliers non professionnels ne sont pas autorisés à utiliser le Service. Le
          Service n'est pas destiné aux mineurs.
        </Note>
      </Section>

      <Section title="Article 4 — Compte et sécurité">
        <P>
          L'Utilisateur est responsable de la confidentialité de ses identifiants. Toute action
          effectuée depuis son compte est réputée effectuée par lui. En cas de suspicion de
          compromission, il s'engage à modifier immédiatement son mot de passe et à en informer
          l'Éditeur sans délai.
        </P>
      </Section>

      <Section title="Article 5 — Description du Service">
        <P>Le Service permet à l'Utilisateur de :</P>
        <List>
          <LI>Créer des dossiers d'identification client (KYC) via un formulaire structuré</LI>
          <LI>Transmettre un lien unique à son client pour qu'il complète sa fiche en autonomie</LI>
          <LI>Obtenir un score de risque LCB-FT automatisé selon l'algorithme propriétaire Klaris v2</LI>
          <LI>Générer des attestations et fiches KYC au format PDF, signées et horodatées</LI>
          <LI>Conserver les pièces justificatives au sein de l'Union Européenne</LI>
          <LI>Bénéficier d'un guide pédagogique sur la LCB-FT et de liens vers les outils officiels (ERMES TRACFIN, Open Sanctions)</LI>
        </List>
      </Section>

      <Section title="Article 6 — Limites du Service">
        <Callout tone="warn" title="⚠️ Klaris est un outil d'aide, jamais un substitut au jugement professionnel">
          Le scoring algorithmique fourni par Klaris est <Strong>une aide à la décision</Strong>.
          Il ne remplace en aucun cas l'analyse personnelle et professionnelle qui incombe
          légalement à l'Utilisateur assujetti. La décision finale d'entrer en relation
          d'affaires, de refuser, ou de déclarer un soupçon à TRACFIN demeure de la seule
          responsabilité de l'Utilisateur. L'Éditeur ne pourra être tenu responsable d'aucune
          décision prise par l'Utilisateur sur la base des informations fournies par le Service.
        </Callout>
        <P>L'Utilisateur reconnaît en outre que :</P>
        <List>
          <LI>Les sources externes consultées (Open Sanctions, registres officiels) sont opérées par des tiers et leur disponibilité ne peut être garantie</LI>
          <LI>La législation LCB-FT évolue ; il appartient à l'Utilisateur de vérifier la version en vigueur des textes</LI>
          <LI>Les modèles de PDF fournis sont des aides ; l'Utilisateur peut les compléter ou adapter selon son contexte particulier</LI>
        </List>
      </Section>

      <Section title="Article 7 — Obligations de l'Utilisateur">
        <P>L'Utilisateur s'engage à :</P>
        <List>
          <LI>Utiliser le Service conformément à sa destination et aux lois applicables</LI>
          <LI>Ne pas tenter de contourner les mécanismes de sécurité, ni d'accéder à des données qui ne lui appartiennent pas</LI>
          <LI>Ne pas utiliser le Service pour des finalités illicites, frauduleuses, ou portant atteinte aux droits de tiers</LI>
          <LI>Conserver les données KYC de ses clients pendant <Strong>5 ans après la fin de la relation d'affaires</Strong> (art. L.561-12-1 CMF)</LI>
          <LI>Informer ses clients finaux de l'utilisation de Klaris dans son traitement (information RGPD à fournir au moment de la collecte)</LI>
        </List>
      </Section>

      <Section title="Article 8 — Disponibilité du Service">
        <P>
          L'Éditeur s'efforce d'assurer la disponibilité du Service 24h/24, 7j/7, à l'exception
          des opérations de maintenance programmées. Aucun engagement de niveau de service (SLA)
          contractuel n'est cependant souscrit dans le cadre de l'offre standard. Pour les besoins
          contractuels spécifiques (SLA dédié, support prioritaire), l'Utilisateur peut contacter
          l'Éditeur.
        </P>
      </Section>

      <Section title="Article 9 — Propriété intellectuelle">
        <P>
          Le Service, son code, son interface, sa marque, ainsi que l'algorithme de scoring
          Klaris v2 sont la propriété exclusive de l'Éditeur. L'Utilisateur dispose d'un droit
          d'usage personnel, non exclusif et non transférable, limité à la durée de son
          abonnement. Toute reproduction, revente, sous-licence ou rétro-ingénierie est interdite.
        </P>
        <P>
          Les données saisies par l'Utilisateur (dossiers KYC, pièces) <Strong>restent sa
          propriété exclusive</Strong>. L'Éditeur n'acquiert aucun droit dessus et s'interdit
          tout usage à des fins autres que l'exécution du Service.
        </P>
      </Section>

      <Section title="Article 10 — Données personnelles">
        <P>
          Le traitement des données personnelles est régi par notre{" "}
          <a href="/legal/confidentialite" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Politique de confidentialité</a>, qui fait partie intégrante des présentes CGU.
        </P>
      </Section>

      <Section title="Article 11 — Responsabilité">
        <P>
          La responsabilité de l'Éditeur est strictement limitée au montant des sommes
          effectivement payées par l'Utilisateur au titre du Service au cours des 12 derniers
          mois. L'Éditeur ne saurait être tenu responsable des dommages indirects (perte de
          chiffre d'affaires, perte d'image, perte de chance) découlant de l'utilisation ou de
          l'impossibilité d'utilisation du Service.
        </P>
        <P>
          En aucun cas, l'Éditeur ne pourra être tenu responsable de sanctions administratives,
          disciplinaires ou pénales prononcées contre l'Utilisateur dans le cadre de ses
          obligations LCB-FT, le Service n'étant qu'un outil d'aide à la conformité.
        </P>
      </Section>

      <Section title="Article 12 — Force majeure">
        <P>
          Aucune partie ne pourra être tenue responsable d'un manquement à ses obligations
          résultant d'un cas de force majeure tel que défini par la jurisprudence française,
          incluant notamment : pannes généralisées d'Internet, défaillance d'un sous-traitant
          d'hébergement, catastrophes naturelles, crise sanitaire, conflit armé, décision d'une
          autorité publique.
        </P>
      </Section>

      <Section title="Article 13 — Résiliation">
        <P>
          L'Utilisateur peut résilier son compte à tout moment depuis l'espace abonnement. Les
          modalités financières sont régies par les{" "}
          <a href="/legal/cgv" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">CGV</a>.
        </P>
        <P>
          L'Éditeur peut suspendre ou résilier un compte en cas de violation grave des présentes
          CGU, après mise en demeure restée infructueuse pendant 15 jours. En cas d'usage illicite
          manifeste ou de risque pour le Service, la suspension peut être immédiate.
        </P>
      </Section>

      <Section title="Article 14 — Droit applicable et juridiction">
        <P>
          Les présentes CGU sont soumises au <Strong>droit français</Strong>. Tout litige relatif
          à leur interprétation ou exécution relève de la compétence exclusive des tribunaux du
          ressort du siège social de l'Éditeur, après tentative de résolution amiable préalable.
        </P>
      </Section>
    </>
  );
}
