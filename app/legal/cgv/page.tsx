// app/legal/cgv/page.tsx — Conditions Générales de Vente

import type { Metadata } from "next";
import { EDITEUR } from "@/lib/legal";
import { LegalTitle, Section, P, Strong, List, LI, Callout, Note } from "@/components/legal/LegalUI";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Klaris",
  description: "Conditions Générales de Vente des abonnements au service Klaris.",
};

export default function CGVPage() {
  return (
    <>
      <LegalTitle
        eyebrow="Cadre commercial"
        title="Conditions Générales de Vente"
        subtitle="Les présentes Conditions Générales de Vente (CGV) régissent la souscription et l'exécution des abonnements au Service Klaris. Elles complètent les CGU sans s'y substituer."
        updatedAt="16 mai 2026"
      />

      <Section title="Article 1 — Champ d'application">
        <P>
          Les présentes CGV s'appliquent à toute commande d'abonnement passée par un professionnel
          (« le Client ») auprès de <Strong>{EDITEUR.raisonSociale}</Strong> (« l'Éditeur »)
          pour l'accès au Service Klaris.
        </P>
        <P>
          Le Service étant strictement réservé aux professionnels, <Strong>les dispositions du
          Code de la consommation relatives à la vente à distance et au droit de rétractation
          ne sont pas applicables</Strong>.
        </P>
      </Section>

      <Section title="Article 2 — Période d'essai gratuite">
        <P>
          Tout nouveau Client bénéficie d'une période d'essai gratuite de{" "}
          <Strong>14 jours calendaires</Strong> à compter de la création de son compte, sans
          engagement et sans demande de moyen de paiement préalable. Pendant cette période, le
          Client accède à l'intégralité des fonctionnalités du Service.
        </P>
        <P>
          À l'expiration de la période d'essai, l'accès au Service est suspendu jusqu'à
          souscription d'un abonnement payant. Les données restent conservées pendant 30 jours
          supplémentaires pour permettre une éventuelle reprise.
        </P>
      </Section>

      <Section title="Article 3 — Offres et tarifs">
        <P>Klaris propose quatre formules d'abonnement :</P>
        <List>
          <LI><Strong>Pro mensuel</Strong> — facturation mensuelle, sans engagement de durée</LI>
          <LI><Strong>Pro annuel</Strong> — facturation annuelle, prix préférentiel</LI>
          <LI><Strong>Agence mensuel</Strong> — facturation mensuelle, fonctionnalités étendues</LI>
          <LI><Strong>Agence annuel</Strong> — facturation annuelle, prix préférentiel</LI>
        </List>
        <P>
          Les tarifs en vigueur sont publiés sur la page{" "}
          <a href="/tarifs" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Tarifs</a>.
          Ils s'entendent <Strong>hors taxes</Strong> (TVA non applicable, art. 293 B du CGI —
          franchise en base de TVA pour l'auto-entrepreneur).
        </P>
        <Note>
          L'Éditeur se réserve le droit de modifier ses tarifs. Toute modification s'applique aux
          nouveaux abonnements et aux renouvellements futurs ; les abonnements en cours sont
          conservés au tarif initialement souscrit jusqu'à leur prochain terme.
        </Note>
      </Section>

      <Section title="Article 4 — Souscription et paiement">
        <P>
          La souscription s'effectue en ligne depuis la page Tarifs, via la plateforme de paiement
          sécurisée <Strong>Stripe</Strong> (Stripe Payments Europe Ltd., Dublin, Irlande).
          Aucune donnée de carte bancaire ne transite ni n'est conservée par Klaris.
        </P>
        <P>
          Le paiement est exigible à la souscription. Les moyens acceptés sont ceux proposés par
          Stripe (carte bancaire, prélèvement SEPA selon disponibilité).
        </P>
      </Section>

      <Section title="Article 5 — Renouvellement automatique">
        <P>
          Sauf résiliation préalable par le Client, l'abonnement se{" "}
          <Strong>renouvelle automatiquement</Strong> à chaque échéance (mensuelle ou annuelle)
          pour une durée identique à la période initiale. Le renouvellement est facturé par
          Stripe sur le moyen de paiement enregistré, sans nouvelle action du Client.
        </P>
      </Section>

      <Section title="Article 6 — Résiliation par le Client">
        <P>
          Le Client peut résilier son abonnement à tout moment depuis son espace abonnement
          (portail Stripe accessible depuis la page Tarifs). La résiliation prend effet à la fin
          de la période en cours déjà facturée — <Strong>aucun remboursement prorata temporis</Strong>{" "}
          n'est dû pour la période entamée.
        </P>
        <P>Concrètement :</P>
        <List>
          <LI>Abonnement mensuel résilié le 15 du mois → accès maintenu jusqu'à la fin du mois en cours, pas de prélèvement le mois suivant</LI>
          <LI>Abonnement annuel résilié au 6e mois → accès maintenu jusqu'au terme des 12 mois payés, pas de renouvellement à l'année suivante</LI>
        </List>
      </Section>

      <Section title="Article 7 — Résiliation par l'Éditeur">
        <P>
          L'Éditeur peut résilier l'abonnement de plein droit en cas de :
        </P>
        <List>
          <LI>Défaut de paiement non régularisé dans un délai de 7 jours après mise en demeure</LI>
          <LI>Violation grave des CGU (usage frauduleux, atteinte à la sécurité du Service, etc.)</LI>
          <LI>Décision d'une autorité publique imposant la cessation du Service</LI>
        </List>
      </Section>

      <Section title="Article 8 — Conséquences de la résiliation">
        <P>
          À l'issue de la résiliation effective :
        </P>
        <List>
          <LI>L'accès aux fonctionnalités de création de nouveaux dossiers est immédiatement suspendu</LI>
          <LI>Le Client dispose de <Strong>30 jours</Strong> pour exporter ses dossiers existants au format PDF + ZIP</LI>
          <LI>Au-delà des 30 jours, les données du compte sont supprimées <Strong>à l'exception des données KYC</Strong> qui restent conservées pendant 5 ans conformément à l'art. L.561-12-1 CMF</LI>
        </List>
        <Callout tone="legal" title="Conservation 5 ans des données KYC">
          La résiliation de l'abonnement Klaris ne libère pas le Client de son obligation légale
          de conservation des données KYC. Klaris conserve ces données de manière sécurisée
          pendant la durée légale, accessibles sur demande motivée du Client (audit, contrôle de
          son autorité de tutelle, requête judiciaire).
        </Callout>
      </Section>

      <Section title="Article 9 — Facturation">
        <P>
          Une facture électronique est émise à chaque paiement et envoyée à l'adresse email
          enregistrée. Les factures sont également accessibles depuis le portail de facturation
          Stripe. Le Client peut à tout moment compléter ou modifier ses informations de
          facturation (raison sociale, SIRET, adresse, TVA) depuis ce portail.
        </P>
      </Section>

      <Section title="Article 10 — Accord de traitement de données (DPA)">
        <P>
          Les présentes CGV intègrent l'accord de traitement de données prévu à l'article 28 du
          RGPD, par lequel l'Éditeur agit en qualité de sous-traitant du Client pour le
          traitement des données KYC des clients finaux. Les modalités complètes figurent dans
          notre <a href="/legal/confidentialite" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">Politique de confidentialité</a> (section « Distinction des rôles »).
        </P>
      </Section>

      <Section title="Article 11 — Responsabilité financière">
        <P>
          La responsabilité financière de l'Éditeur, toutes causes confondues, est strictement
          limitée au montant des sommes effectivement perçues du Client au titre du Service au
          cours des <Strong>12 derniers mois précédant le fait générateur</Strong>.
        </P>
      </Section>

      <Section title="Article 12 — Droit applicable et juridiction">
        <P>
          Les présentes CGV sont régies par le <Strong>droit français</Strong>. Tout litige est
          soumis à la compétence exclusive des tribunaux du ressort du siège social de
          l'Éditeur, après tentative préalable de résolution amiable.
        </P>
      </Section>

      <Section title="Article 13 — Contact">
        <P>
          Pour toute question relative à votre abonnement ou à la facturation :{" "}
          <a href={`mailto:${EDITEUR.email}`} className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{EDITEUR.email}</a>.
        </P>
      </Section>
    </>
  );
}
