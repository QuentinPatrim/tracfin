// app/legal/confidentialite/page.tsx — Politique RGPD (art. 13 & 14 RGPD)

import type { Metadata } from "next";
import { EDITEUR, SOUS_TRAITANTS, CONSERVATION, DROITS_RGPD } from "@/lib/legal";
import { LegalTitle, Section, P, Strong, List, LI, Callout, TableWrap, TH, TD, Note } from "@/components/legal/LegalUI";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Klaris",
  description: "Comment Klaris traite vos données personnelles : finalités, durées, droits RGPD, sous-traitants, transferts hors UE.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <LegalTitle
        eyebrow="RGPD · Données personnelles"
        title="Politique de confidentialité"
        subtitle="Nous traitons vos données comme nous aimerions que les nôtres le soient : avec sobriété, transparence, et la même rigueur que celle qu'impose la loi LCB-FT à nos utilisateurs professionnels."
        updatedAt="16 mai 2026"
      />

      <Callout tone="info" title="L'essentiel en 30 secondes">
        Klaris stocke ses données <Strong>exclusivement dans l'Union Européenne</Strong> (Francfort
        & Paris). Nous ne consultons jamais le contenu des dossiers KYC de nos utilisateurs sauf
        obligation judiciaire. Les données KYC sont conservées <Strong>5 ans</Strong> conformément
        à l'art. L.561-12-1 du Code monétaire et financier — cette obligation prime sur le droit
        à l'effacement.
      </Callout>

      <Section id="responsable" title="1. Responsable de traitement">
        <P>
          Le responsable du traitement de vos données est <Strong>{EDITEUR.raisonSociale}</Strong>,
          éditeur du Service Klaris, dont l'identité complète figure sur la page <a href="/legal/mentions-legales" className="text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline underline-offset-2">Mentions légales</a>.
        </P>
        <P>
          Contact dédié à la protection des données :{" "}
          <a href={`mailto:${EDITEUR.emailRgpd}`} className="text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline underline-offset-2">{EDITEUR.emailRgpd}</a>.
        </P>
        <Note>
          Compte tenu de sa taille et de la nature de ses traitements, l'éditeur n'a pas désigné
          de Délégué à la Protection des Données (DPO). Toute question relative à la vie privée
          est traitée directement par la direction.
        </Note>
      </Section>

      <Section id="role" title="2. Distinction des rôles : qui est responsable de quoi ?">
        <P>
          Klaris est un outil mis à disposition des <Strong>professionnels assujettis à la
          LCB-FT</Strong> (agents immobiliers, experts-comptables, CGP, notaires, etc.). Cette
          architecture induit deux niveaux de responsabilité distincts :
        </P>
        <List>
          <LI>
            <Strong>Pour les données du compte professionnel</Strong> (email, nom du cabinet, données
            de facturation) : Klaris agit en tant que <Strong>responsable de traitement</Strong>.
          </LI>
          <LI>
            <Strong>Pour les données KYC des clients finaux</Strong> (CNI, justificatifs, scoring,
            pièces) : le professionnel utilisateur est <Strong>responsable de traitement</Strong>,
            Klaris est son <Strong>sous-traitant</Strong> au sens de l'art. 28 RGPD. Un accord de
            traitement de données (DPA) est inclus dans les CGV.
          </LI>
        </List>
      </Section>

      <Section id="categories" title="3. Données collectées et finalités">
        <TableWrap>
          <thead>
            <tr><TH>Catégorie de données</TH><TH>Finalité</TH><TH>Base légale</TH></tr>
          </thead>
          <tbody>
            <tr>
              <TD>Identification du compte pro (email, nom, prénom)</TD>
              <TD>Création et gestion du compte, authentification</TD>
              <TD>Exécution du contrat (art. 6.1.b RGPD)</TD>
            </tr>
            <tr>
              <TD>Profil professionnel (cabinet, profession, n° pro)</TD>
              <TD>Personnaliser l'attestation et le guide selon votre activité</TD>
              <TD>Exécution du contrat</TD>
            </tr>
            <tr>
              <TD>Données KYC clients finaux (identité, pièces, scoring)</TD>
              <TD>Permettre au professionnel d'exécuter ses obligations LCB-FT</TD>
              <TD>Obligation légale du pro (art. L.561-5 CMF) — Klaris sous-traite</TD>
            </tr>
            <tr>
              <TD>Données de facturation (Stripe)</TD>
              <TD>Encaissement de l'abonnement, comptabilité</TD>
              <TD>Exécution du contrat + obligation comptable</TD>
            </tr>
            <tr>
              <TD>Logs techniques (IP, horodatage, route appelée)</TD>
              <TD>Sécurité, détection d'abus, debugging</TD>
              <TD>Intérêt légitime (sécurité du service)</TD>
            </tr>
          </tbody>
        </TableWrap>
        <Note>
          Klaris ne collecte <Strong>aucune donnée à des fins publicitaires ou de profilage
          commercial</Strong>. Il n'y a ni tracker tiers, ni outil d'analytics comportemental.
        </Note>
      </Section>

      <Section id="conservation" title="4. Durées de conservation">
        <P>Nous appliquons strictement le principe de minimisation. Voici les durées par catégorie :</P>
        {CONSERVATION.map((c) => (
          <div
            key={c.categorie}
            className="rounded-xl p-4 my-2.5 border"
            style={{
              borderColor: c.important ? "var(--lp-card-border-accent)" : "var(--lp-border-2)",
              background: c.important ? "var(--lp-card-bg-accent)" : "var(--lp-surface)",
            }}
          >
            <div className="font-semibold text-[color:var(--lp-text)] text-[14px] mb-1">{c.categorie}</div>
            <div className="text-[13.5px] text-[color:var(--lp-text-2)] mb-1.5"><Strong>Durée :</Strong> {c.duree}</div>
            <div className="text-[12.5px] text-[color:var(--lp-text-4)]">{c.base}</div>
          </div>
        ))}
        <Callout tone="legal" title="⚖️ Conservation 5 ans des données KYC — explication">
          L'article L.561-12-1 du Code monétaire et financier impose aux professionnels assujettis
          à la LCB-FT de conserver les documents d'identification, les pièces justificatives et
          les analyses de risque pendant <Strong>5 années à compter de la fin de la relation
          d'affaires</Strong>. Cette obligation légale prime sur le droit à l'effacement prévu à
          l'art. 17 RGPD. Concrètement : si vous êtes un client final ayant rempli un KYC, votre
          professionnel ne pourra pas supprimer vos données avant l'expiration de ce délai, même
          sur demande. Vous gardez en revanche tous vos autres droits (accès, rectification,
          limitation, portabilité).
        </Callout>
      </Section>

      <Section id="sous-traitants" title="5. Sous-traitants (art. 28 RGPD)">
        <P>
          Pour faire fonctionner le Service, Klaris recourt à un nombre volontairement restreint
          de sous-traitants, chacun lié par un contrat de traitement (DPA) conforme au RGPD :
        </P>
        {SOUS_TRAITANTS.map((s) => (
          <div key={s.nom} className="rounded-xl p-4 my-2.5 bg-[var(--lp-surface)] border border-[color:var(--lp-border-2)]">
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <div className="font-semibold text-[color:var(--lp-text)] text-[14px]">{s.nom}</div>
              <a
                href={s.site}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[11px] text-[color:var(--lp-accent-text)] hover:text-[color:var(--lp-accent-text)] underline underline-offset-2 shrink-0"
              >
                {s.site.replace(/^https?:\/\//, "")} ↗
              </a>
            </div>
            <div className="text-[13px] text-[color:var(--lp-text-3)] leading-relaxed space-y-1">
              <div><Strong>Finalité :</Strong> {s.finalite}</div>
              <div><Strong>Données traitées :</Strong> {s.donnees}</div>
              <div><Strong>Localisation :</Strong> {s.localisation}</div>
              <div><Strong>Conservation :</Strong> {s.duree}</div>
            </div>
          </div>
        ))}
      </Section>

      <Section id="transferts" title="6. Transferts hors Union Européenne">
        <P>
          Toutes les données structurées (Postgres) et les pièces justificatives (stockage objet)
          sont hébergées <Strong>au sein de l'Union Européenne</Strong> — Francfort et Paris.
        </P>
        <P>
          Seul un sous-traitant a son siège hors UE : <Strong>Clerk Inc.</Strong> (États-Unis),
          que nous utilisons pour l'authentification. Le transfert est encadré par les{" "}
          <Strong>Clauses Contractuelles Types</Strong> de la Commission européenne (décision
          2021/914), complétées par les engagements du Data Privacy Framework (décision
          d'adéquation 2023/1795 du 10 juillet 2023). Les données transférées sont strictement
          limitées aux identifiants nécessaires à la session (email, nom, hash de mot de passe).
        </P>
      </Section>

      <Section id="droits" title="7. Vos droits">
        <P>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits
          suivants sur vos données :
        </P>
        <div className="grid sm:grid-cols-2 gap-2 my-3">
          {DROITS_RGPD.map((d) => (
            <div key={d.code} className="rounded-lg p-3" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border-2)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[13px] font-semibold text-[color:var(--lp-text)]">Droit {d.code.toLowerCase()}</span>
                <span className="text-[10.5px] uppercase tracking-widest text-[color:var(--lp-text-4)]">{d.article}</span>
              </div>
              <div className="text-[12.5px] leading-relaxed text-[color:var(--lp-text-3)]">{d.description}</div>
            </div>
          ))}
        </div>
        <P>
          Pour exercer ces droits, contactez-nous à{" "}
          <a href={`mailto:${EDITEUR.emailRgpd}`} className="text-violet-300 hover:text-violet-200 underline underline-offset-2">{EDITEUR.emailRgpd}</a>.
          Nous vous répondrons sous <Strong>30 jours maximum</Strong>. Si vous estimez que vos
          droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL
          (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer noopener" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">www.cnil.fr</a>).
        </P>
      </Section>

      <Section id="securite" title="8. Sécurité">
        <P>
          Klaris met en œuvre les mesures techniques et organisationnelles suivantes pour
          protéger vos données :
        </P>
        <List>
          <LI><Strong>Chiffrement en transit :</Strong> TLS 1.3 sur toutes les connexions HTTPS.</LI>
          <LI><Strong>Chiffrement au repos :</Strong> AES-256 sur la base de données (Neon) et le stockage objet (Scaleway).</LI>
          <LI><Strong>Isolation par tenant :</Strong> chaque dossier est strictement rattaché à un compte ; aucune fuite inter-comptes possible.</LI>
          <LI><Strong>Authentification forte :</Strong> mots de passe hachés (bcrypt/argon2), MFA disponible via Clerk.</LI>
          <LI><Strong>Accès admin minimal :</Strong> seuls les accès strictement nécessaires à l'exploitation sont accordés, journalisés et revus régulièrement.</LI>
          <LI><Strong>Sauvegardes :</Strong> snapshots quotidiens de la base, conservés 7 jours, chiffrés.</LI>
        </List>
      </Section>

      <Section id="violations" title="9. Notification de violation">
        <P>
          En cas de violation de données susceptible d'engendrer un risque pour vos droits et
          libertés, nous notifions la CNIL dans les <Strong>72 heures</Strong> conformément à
          l'art. 33 RGPD. Si le risque est élevé, nous vous en informons également sans délai
          déraisonnable (art. 34 RGPD).
        </P>
      </Section>

      <Section id="modification" title="10. Modification de la présente politique">
        <P>
          Nous pouvons être amenés à mettre à jour cette politique pour tenir compte d'évolutions
          légales, réglementaires ou techniques. Toute modification substantielle vous sera
          notifiée par email au moins 30 jours avant son entrée en vigueur. La version en cours
          d'application est toujours celle datée en haut de cette page.
        </P>
      </Section>
    </>
  );
}
