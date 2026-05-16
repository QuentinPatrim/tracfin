// app/legal/mentions-legales/page.tsx — Obligatoire en application de la LCEN 2004

import type { Metadata } from "next";
import { EDITEUR, HEBERGEUR_SITE, HEBERGEURS_DONNEES } from "@/lib/legal";
import { LegalTitle, Section, P, Strong, TableWrap, TH, TD, Note } from "@/components/legal/LegalUI";

export const metadata: Metadata = {
  title: "Mentions légales — Klaris",
  description: "Informations légales relatives à l'éditeur et à l'hébergement du service Klaris.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <LegalTitle
        eyebrow="Informations légales"
        title="Mentions légales"
        subtitle="En application de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), nous publions ici l'identité de l'éditeur du site et de son hébergeur."
        updatedAt="16 mai 2026"
      />

      <Section title="Éditeur du service">
        <P>
          Le service <Strong>{EDITEUR.marque}</Strong> (« le Service ») est édité par :
        </P>
        <TableWrap>
          <tbody>
            <tr><TH>Raison sociale</TH><TD>{EDITEUR.raisonSociale}</TD></tr>
            <tr><TH>Statut juridique</TH><TD>{EDITEUR.statutJuridique}</TD></tr>
            <tr><TH>SIRET</TH><TD>{EDITEUR.siret}</TD></tr>
            <tr><TH>Inscription</TH><TD>{EDITEUR.rne}</TD></tr>
            <tr><TH>TVA</TH><TD>{EDITEUR.tvaIntra}</TD></tr>
            <tr><TH>Adresse du siège</TH><TD>{EDITEUR.adresse}</TD></tr>
            <tr><TH>Téléphone</TH><TD>{EDITEUR.telephone}</TD></tr>
            <tr><TH>Email</TH><TD><a href={`mailto:${EDITEUR.email}`} className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{EDITEUR.email}</a></TD></tr>
            <tr><TH>Directeur de la publication</TH><TD>{EDITEUR.directeurPublication}</TD></tr>
            <tr><TH>Nom de domaine</TH><TD>{EDITEUR.siteUrl}</TD></tr>
          </tbody>
        </TableWrap>
        <Note>
          L'éditeur est immatriculé au Registre National des Entreprises (RNE) tenu par l'INPI, qui a remplacé le RCS pour les entrepreneurs individuels depuis le 1er janvier 2023.
        </Note>
      </Section>

      <Section title="Hébergement du site (code applicatif)">
        <P>
          Le code applicatif du Service (rendu des pages, exécution des fonctions serveur) est hébergé par :
        </P>
        <TableWrap>
          <tbody>
            <tr><TH>Raison sociale</TH><TD>{HEBERGEUR_SITE.raisonSociale}</TD></tr>
            <tr><TH>Siège social</TH><TD>{HEBERGEUR_SITE.adresse}</TD></tr>
            <tr><TH>Filiale européenne</TH><TD>{HEBERGEUR_SITE.filialeEU}</TD></tr>
            <tr><TH>Téléphone</TH><TD>{HEBERGEUR_SITE.telephone}</TD></tr>
            <tr><TH>Site web</TH><TD><a href={HEBERGEUR_SITE.site} target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{HEBERGEUR_SITE.site}</a></TD></tr>
            <tr><TH>Région d'exécution</TH><TD>{HEBERGEUR_SITE.region}</TD></tr>
          </tbody>
        </TableWrap>
      </Section>

      <Section title="Hébergement des données utilisateurs">
        <P>
          Les données traitées par le Service (comptes, dossiers, pièces justificatives KYC) sont
          hébergées exclusivement au sein de l'Union Européenne par les prestataires suivants :
        </P>
        {HEBERGEURS_DONNEES.map((h) => (
          <div key={h.nom} className="rounded-xl p-4 my-3 bg-white/[0.03] border border-white/[0.08]">
            <div className="font-semibold text-white text-[14px] mb-1">{h.nom}</div>
            <div className="text-[12.5px] text-white/55 mb-2">{h.role}</div>
            <div className="text-[13px] text-white/75 leading-relaxed space-y-1">
              <div><Strong>Localisation :</Strong> {h.region}</div>
              <div><Strong>Adresse :</Strong> {h.adresse}</div>
              {"filialeEU" in h && h.filialeEU && (
                <div><Strong>Précision :</Strong> {h.filialeEU}</div>
              )}
              <div><Strong>Certifications :</Strong> {h.certifications}</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Propriété intellectuelle">
        <P>
          L'ensemble des éléments présents sur le Service (marque, logo, textes, interface, code,
          base de données, scoring algorithmique LCB-FT v2) est protégé par le droit d'auteur et le
          droit des marques. Toute reproduction, représentation, modification, publication ou
          adaptation de tout ou partie des éléments du Service, sans autorisation préalable écrite
          de l'éditeur, est strictement interdite.
        </P>
        <P>
          La marque <Strong>Klaris</Strong> est la propriété exclusive de son éditeur. Toute
          utilisation non autorisée est constitutive d'une contrefaçon sanctionnée par les
          articles L.713-2 et suivants du Code de la propriété intellectuelle.
        </P>
      </Section>

      <Section title="Responsabilité de l'éditeur">
        <P>
          Klaris est un outil d'aide à la conformité LCB-FT. <Strong>Il ne se substitue jamais à
          l'analyse professionnelle de l'utilisateur</Strong>, qui demeure seul responsable des
          décisions prises (refus de relation d'affaires, déclaration de soupçon TRACFIN, etc.).
        </P>
        <P>
          L'éditeur s'engage à apporter le plus grand soin à la qualité de l'information diffusée,
          mais ne saurait être tenu pour responsable d'erreurs ou d'omissions, ni des conséquences
          de leur utilisation par un tiers. La législation française et européenne évoluant
          fréquemment, l'utilisateur est invité à vérifier la version en vigueur des textes cités
          (CMF, RGPD, jurisprudence) lors de leur application.
        </P>
      </Section>

      <Section title="Médiation de la consommation">
        <P>
          Le Service étant exclusivement destiné à un usage professionnel (B2B), la médiation de
          la consommation prévue par les articles L.611-1 et suivants du Code de la consommation
          n'est pas applicable. Pour tout litige, les parties s'efforceront en priorité de
          rechercher une solution amiable avant tout recours contentieux.
        </P>
      </Section>

      <Section title="Droit applicable et juridiction compétente">
        <P>
          Les présentes mentions légales sont soumises au <Strong>droit français</Strong>. À
          défaut de résolution amiable, tout litige relatif à l'interprétation ou à l'exécution
          des présentes relève de la compétence exclusive des tribunaux du ressort du siège
          social de l'éditeur.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          Pour toute question relative au Service ou à ces mentions légales, vous pouvez nous
          joindre à <a href={`mailto:${EDITEUR.email}`} className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{EDITEUR.email}</a>.
        </P>
      </Section>
    </>
  );
}
