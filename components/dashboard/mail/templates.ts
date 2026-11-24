// components/dashboard/mail/templates.ts — Modèles d'e-mails de la marche à suivre
//
// Sans IA : chaque modèle assemble son texte à partir du dossier (nom, rôle, bien,
// e-mail du client, signature de l'agent) et des cases cochées dans la fenêtre de
// rédaction. Le texte reste modifiable avant envoi.

export type MailId = "pieces" | "validation" | "infos" | "convocation" | "refus";

export interface MailCtx {
  clientName: string;
  partie: "vendeur" | "acquereur";
  email?: string | null;
  lieuBien?: string | null;
  agent?: string | null;
  agency?: string | null;
}

export type MailOpt =
  | { id: string; type: "check"; label: string; def: boolean }
  | { id: string; type: "radio"; label: string; choices: Array<{ id: string; label: string }>; def: string };

export type Sel = Record<string, boolean | string>;

export interface MailTpl {
  title: string;
  /** Destinataire : le client (e-mail de sa fiche) ou le correspondant LCB-FT (à saisir). */
  to: "client" | "correspondant";
  warning?: string;
  options: (c: MailCtx) => MailOpt[];
  build: (c: MailCtx, s: Sel) => { subject: string; body: string };
}

const bien = (c: MailCtx) => (c.lieuBien && c.lieuBien.trim() ? ` (${c.lieuBien.trim()})` : "");
const projet = (c: MailCtx) => (c.partie === "vendeur" ? "de vente" : "d'acquisition");
const sig = (c: MailCtx) => ["Cordialement,", c.agent, c.agency].filter(Boolean).join("\n");
const sigCorresp = (c: MailCtx) => ["Merci,", c.agent].filter(Boolean).join("\n");
const bullets = (items: string[]) => items.map((i) => `• ${i}`).join("\n");

const FORMULE: MailOpt = {
  id: "formule", type: "radio", label: "Formule d'appel",
  choices: [{ id: "nom", label: "Bonjour + nom" }, { id: "mm", label: "Madame, Monsieur" }], def: "nom",
};
const formule = (c: MailCtx, s: Sel) => (s.formule === "mm" ? "Madame, Monsieur," : `Bonjour ${c.clientName},`);

const DELAI: MailOpt = {
  id: "delai", type: "radio", label: "Délai demandé",
  choices: [{ id: "8", label: "8 jours" }, { id: "15", label: "15 jours" }, { id: "asap", label: "Dès que possible" }], def: "8",
};
const delai = (s: Sel) => (s.delai === "15" ? "sous 15 jours" : s.delai === "asap" ? "dès que possible" : "sous 8 jours");

export const MAIL_TEMPLATES: Record<MailId, MailTpl> = {
  /* Vigilance renforcée : pièces complémentaires (au client) */
  pieces: {
    title: "Demander des pièces complémentaires",
    to: "client",
    options: (c) => [
      FORMULE,
      { id: "origine", type: "check", def: true, label: c.partie === "vendeur" ? "Origine du bien vendu" : "Origine des fonds" },
      { id: "revenus", type: "check", def: true, label: "Revenus ou activité professionnelle" },
      ...(c.partie === "acquereur" ? [{ id: "financement", type: "check", def: false, label: "Offre ou accord de prêt" } as MailOpt] : []),
      { id: "identite", type: "check", def: false, label: "Nouvelle pièce d'identité" },
      { id: "ppe", type: "check", def: false, label: "Déclaration sur la fonction exercée (PPE)" },
      DELAI,
    ],
    build: (c, s) => {
      const items: string[] = [];
      if (s.origine) items.push(c.partie === "vendeur"
        ? "un justificatif de l'origine du bien vendu (titre de propriété, acte d'acquisition, donation ou succession…)"
        : "un justificatif de l'origine des fonds (relevés bancaires, acte de vente d'un bien, donation ou succession…)");
      if (s.revenus) items.push("un justificatif de revenus ou d'activité professionnelle (dernier avis d'imposition, bulletins de salaire)");
      if (s.financement) items.push("l'offre ou l'accord de prêt, ou une attestation de financement");
      if (s.identite) items.push("une pièce d'identité en cours de validité et bien lisible");
      if (s.ppe) items.push("une déclaration sur l'honneur précisant la fonction exercée et sa durée");
      return {
        subject: "Documents complémentaires pour votre dossier",
        body:
`${formule(c, s)}

Dans le cadre de votre projet ${projet(c)}${bien(c)}, et de nos obligations de vigilance (art. L.561-10 du Code monétaire et financier), nous avons besoin de quelques pièces complémentaires pour finaliser votre dossier :

${items.length ? bullets(items) : "• [précisez les pièces demandées]"}

Merci de nous les transmettre ${delai(s)}, en répondant simplement à ce message.

Nous restons à votre disposition pour toute question.

${sig(c)}`,
      };
    },
  },

  /* Vigilance renforcée : accord du correspondant LCB-FT */
  validation: {
    title: "Demander la validation du correspondant",
    to: "correspondant",
    options: () => [
      { id: "joint", type: "check", def: true, label: "J'ajoute l'attestation en pièce jointe" },
      { id: "urgence", type: "radio", label: "Réponse souhaitée", choices: [{ id: "jour", label: "Dans la journée" }, { id: "48", label: "Sous 48 h" }], def: "48" },
    ],
    build: (c, s) => ({
      subject: `Validation demandée · dossier ${c.clientName} (vigilance renforcée)`,
      body:
`Bonjour,

Le dossier de ${c.clientName} (${c.partie === "vendeur" ? "vendeur" : "acquéreur"}${c.lieuBien?.trim() ? `, ${c.lieuBien.trim()}` : ""}) est classé en vigilance renforcée (art. L.561-10 et L.561-10-1 du Code monétaire et financier).

${s.joint ? "Je joins l'attestation Klaris et mon analyse du risque." : "L'attestation Klaris et mon analyse du risque sont disponibles dans le dossier."}

Peux-tu me donner ton accord, ou tes recommandations, ${s.urgence === "jour" ? "dans la journée" : "sous 48 h"} ?

${sigCorresp(c)}`,
    }),
  },

  /* Examen renforcé : informations complémentaires (au client) */
  infos: {
    title: "Demander des informations complémentaires",
    to: "client",
    options: (c) => [
      FORMULE,
      { id: "origine", type: "check", def: true, label: c.partie === "vendeur" ? "Origine du bien" : "Origine des fonds" },
      { id: "objet", type: "check", def: true, label: "Objet et destination de l'opération" },
      { id: "contexte", type: "check", def: true, label: "Documents de contexte" },
      { id: "suspendre", type: "check", def: false, label: "Prévenir que le dossier est mis en attente" },
      DELAI,
    ],
    build: (c, s) => {
      const items: string[] = [];
      if (s.origine) items.push(c.partie === "vendeur" ? "un justificatif détaillé de l'origine du bien" : "un justificatif détaillé de l'origine des fonds");
      if (s.objet) items.push("quelques lignes sur l'objet et la destination de l'opération");
      if (s.contexte) items.push("tout document utile pour comprendre le contexte (acte notarié, contrat antérieur, attestation comptable…)");
      return {
        subject: "Informations complémentaires pour votre dossier",
        body:
`${formule(c, s)}

Dans le cadre de votre projet ${projet(c)}${bien(c)}, nos obligations réglementaires (art. L.561-10-2 du Code monétaire et financier) nous conduisent à vous demander quelques précisions avant de poursuivre :

${items.length ? bullets(items) : "• [précisez les informations demandées]"}

Merci de nous les transmettre ${delai(s)}, en répondant simplement à ce message.${s.suspendre ? "\n\nDans l'attente de ces éléments, la suite de votre dossier est mise en attente." : ""}

${sig(c)}`,
      };
    },
  },

  /* Examen renforcé : réunion avec le correspondant LCB-FT */
  convocation: {
    title: "Organiser la réunion de décision",
    to: "correspondant",
    options: () => [
      { id: "delai", type: "radio", label: "Créneau souhaité", choices: [{ id: "24", label: "Sous 24 h" }, { id: "48", label: "Sous 48 h" }], def: "24" },
      { id: "joint", type: "check", def: true, label: "J'ajoute l'attestation en pièce jointe" },
    ],
    build: (c, s) => ({
      subject: `Examen renforcé · dossier ${c.clientName} : réunion à prévoir`,
      body:
`Bonjour,

Le dossier de ${c.clientName} déclenche un examen renforcé (art. L.561-10-2 du Code monétaire et financier). J'ai demandé des compléments au client.

Peux-tu me proposer un créneau ${s.delai === "48" ? "sous 48 h" : "sous 24 h"} pour une réunion de décision ?${s.joint ? " Je joins l'attestation Klaris." : ""}

${sigCorresp(c)}`,
    }),
  },

  /* Refus / fin de la relation (au client) — sans jamais révéler une déclaration */
  refus: {
    title: "Mettre fin à la relation",
    to: "client",
    warning: "Ne mentionnez jamais Tracfin, une déclaration ou un soupçon : c'est interdit (art. L.561-18 du Code monétaire et financier). Le texte proposé reste neutre.",
    options: () => [
      FORMULE,
      {
        id: "motif", type: "radio", label: "Formulation",
        choices: [{ id: "neutre", label: "Neutre" }, { id: "interne", label: "Décision interne" }, { id: "mission", label: "Fin de mission" }], def: "neutre",
      },
      { id: "fin", type: "check", def: true, label: "Annoncer la fin de notre mission" },
      { id: "conservation", type: "check", def: false, label: "Préciser que les documents sont conservés (obligation légale)" },
      { id: "merci", type: "check", def: true, label: "Remercier le client" },
    ],
    build: (c, s) => {
      const first =
        s.motif === "interne" ? "Pour des raisons internes, notre agence a décidé de ne pas donner suite à votre demande."
        : s.motif === "mission" ? `Nous ne sommes pas en mesure de poursuivre notre mission concernant votre projet ${projet(c)}${bien(c)}.`
        : "Après examen de votre dossier, nous ne sommes pas en mesure de donner suite à votre demande.";
      const lines = [first];
      if (s.fin && s.motif !== "mission") lines.push(`Nous mettons donc fin à notre mission concernant votre projet ${projet(c)}${bien(c)}.`);
      if (s.conservation) lines.push("Conformément à nos obligations légales, les documents que vous nous avez transmis sont conservés de façon sécurisée pendant la durée prévue par la loi.");
      if (s.merci) lines.push("Nous vous remercions pour la confiance que vous nous avez témoignée.");
      return {
        subject: "Suite donnée à votre demande",
        body: `${formule(c, s)}

${lines.join("\n\n")}

${sig(c)}`,
      };
    },
  },
};

export function defaults(opts: MailOpt[]): Sel {
  const s: Sel = {};
  for (const o of opts) s[o.id] = o.def;
  return s;
}
