// components/dashboard/MarcheASuivre.tsx — Wizard pas-à-pas guidé par niveau LCB-FT
//
// Philosophie : UNE seule étape active à la fois. À chaque étape, une action
// CONCRÈTE et CLIQUABLE (Klaris fait le maximum, externe en dernier recours).
// Progression persistée en localStorage par dossier.

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import MailComposer from "./mail/MailComposer";
import type { MailCtx, MailId } from "./mail/templates";
import DownloadButton from "./docs/DownloadButton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, ArrowRight, Check, Clock, Sparkles, Mail, FileDown, Package,
  ExternalLink, Lock, ShieldCheck, AlertTriangle, ShieldOff, RotateCw, Loader2,
} from "lucide-react";
import type { Niveau } from "@/lib/tracfin";

interface Props {
  niveau: Niveau;
  dossierId: string;
  clientName: string;
  /** Rôle du client dans la transaction (defaut acquéreur pour legacy). */
  partie?: "vendeur" | "acquereur";
  mode?: "compact" | "full";
  /** Coordonnées utiles aux e-mails préparés (e-mail du client, lieu du bien). */
  contact?: { email?: string | null; lieuBien?: string | null };
}

/** Contexte des e-mails préparés (client, bien, signature de l'agent). */
const MailCtxC = createContext<MailCtx | null>(null);

/* ════════════════════════════════════════════════════════════════════
   DÉFINITION DES ÉTAPES PAR NIVEAU (UI-first, actions Klaris-natives)
   ════════════════════════════════════════════════════════════════════ */

type ActionKind =
  | { kind: "mailto"; subject: string; body: string; cta: string }
  | { kind: "mail"; mail: MailId; cta: string }
  | { kind: "download"; href: string; filename: string; cta: string }
  | { kind: "decision"; okLabel: string; refuseLabel: string }
  | { kind: "link"; href: string; cta: string; external?: boolean }
  | { kind: "note"; placeholder: string; cta: string }
  | { kind: "done"; cta: string }
  | {
      kind: "branch";
      options: Array<{
        label: string;
        tone?: "neutral" | "warn" | "crit";
        /** Transition automatique du dossier vers ce niveau via /api/dossiers/[id]/transition */
        transitionTo?: Niveau;
        /** URL externe à ouvrir dans un nouvel onglet après la transition */
        externalUrl?: string;
        /** Message de succès affiché temporairement */
        successMessage?: string;
      }>;
    };

interface Step {
  title: string;
  subtitle: string;
  action: ActionKind;
}

interface Wizard {
  tone: "ok" | "warn" | "danger" | "crit";
  icon: typeof CheckCircle2;
  headline: string;
  intro: string;
  cmfRef: string;
  steps: Step[];
}

function buildWizard(
  niveau: Niveau,
  clientName: string,
  dossierId: string,
  partie: "vendeur" | "acquereur" = "acquereur",
): Wizard {
  const safeName = clientName || "votre client";
  const isVendeur = partie === "vendeur";
  // Wording adapté selon que le client est vendeur (justifier origine du bien)
  // ou acquéreur (justifier origine des fonds + montage).
  const noteOrigine = isVendeur
    ? "Ex : Le client a fourni l'acte d'achat initial du bien (notaire Maître X, 2014). Origine confirmée. Aucun lien avec pays à risque. Décision : poursuite de la relation sous surveillance renforcée."
    : "Ex : Le client a fourni les relevés bancaires demandés. Origine des fonds confirmée par notaire. Aucun lien avec pays à risque. Décision : poursuite de la relation sous surveillance renforcée.";
  const noteDeliberation = isVendeur
    ? "Ex : Réunion du JJ/MM/AAAA avec le correspondant LCB-FT. Anomalie : montage atypique sur l'acquisition initiale du bien. Justifications fournies : acte notarié et historique d'occupation. Décision : levée du doute, poursuite sous vigilance renforcée."
    : "Ex : Réunion du JJ/MM/AAAA avec le correspondant LCB-FT. Anomalie : montant atypique vs. revenus déclarés. Justifications fournies : héritage récent avec acte notarié à l'appui. Décision : levée du doute, poursuite sous vigilance renforcée.";

  switch (niveau) {
    case "vigilance_standard":
      return {
        tone: "ok",
        icon: CheckCircle2,
        headline: "Aucune action particulière",
        intro: `Le dossier de ${safeName} relève de la vigilance standard. Vous pouvez continuer normalement.`,
        cmfRef: "CMF L.561-5 à L.561-8",
        steps: [
          {
            title: "Conserver le dossier 5 ans",
            subtitle: "Klaris archive automatiquement vos dossiers KYC pendant 5 ans après la fin de la relation d'affaires. Rien à faire de votre côté.",
            action: { kind: "done", cta: "J'ai bien noté" },
          },
        ],
      };

    case "vigilance_renforcee":
      return {
        tone: "warn",
        icon: AlertTriangle,
        headline: "Vigilance renforcée requise",
        intro: `Le dossier de ${safeName} présente des indicateurs nécessitant une analyse approfondie. Suivez ces étapes dans l'ordre.`,
        cmfRef: "CMF L.561-10 et L.561-10-1",
        steps: [
          {
            title: "Demander les pièces complémentaires au client",
            subtitle: "Klaris prépare l'e-mail : cochez les pièces à demander, puis envoyez-le depuis votre messagerie, Gmail ou Outlook.",
            action: { kind: "mail", mail: "pieces", cta: "Préparer l'e-mail au client" },
          },
          {
            title: "Renseigner votre analyse du risque",
            subtitle: "Décrivez en quelques lignes pourquoi le dossier reste acceptable (ou pas). Cette note est conservée, horodatée, et peut être présentée en cas de contrôle.",
            action: {
              kind: "note",
              placeholder: noteOrigine,
              cta: "Enregistrer mon analyse",
            },
          },
          {
            title: "Faire valider par votre correspondant LCB-FT",
            subtitle: "Son accord écrit est obligatoire. Klaris prépare la demande : ajoutez son adresse et envoyez.",
            action: { kind: "mail", mail: "validation", cta: "Préparer la demande de validation" },
          },
          {
            title: "Confirmer l'ouverture (ou le refus) de la relation",
            subtitle: "Une fois l'accord obtenu, indiquez votre décision. Si vous refusez, Klaris prépare l'e-mail au client, sans en donner la raison.",
            action: { kind: "decision", okLabel: "J'ouvre la relation", refuseLabel: "Je refuse la relation" },
          },
        ],
      };

    case "examen_renforce":
      return {
        tone: "danger",
        icon: AlertTriangle,
        headline: "Examen renforcé requis",
        intro: `Une anomalie significative a été détectée sur le dossier de ${safeName}. La loi impose un examen approfondi avant de poursuivre l'opération.`,
        cmfRef: "CMF L.561-10-2",
        steps: [
          {
            title: "Recueillir des informations complémentaires auprès du client",
            subtitle: isVendeur
              ? "L'art. L.561-10-2 vous impose de vous renseigner sur l'origine du bien, l'objet et la destination de l'opération avant de poursuivre. Vous pouvez (mais n'êtes pas obligé) de suspendre temporairement la transaction. La suspension n'est obligatoire qu'en cas de soupçon avéré."
              : "L'art. L.561-10-2 vous impose de vous renseigner sur l'origine des fonds, l'objet et la destination de l'opération avant de poursuivre. Vous pouvez (mais n'êtes pas obligé) de suspendre temporairement la transaction. La suspension n'est obligatoire qu'en cas de soupçon avéré.",
            action: { kind: "mail", mail: "infos", cta: "Préparer l'e-mail au client" },
          },
          {
            title: "Convoquer le correspondant LCB-FT",
            subtitle: "Réunion obligatoire avec compte-rendu écrit pour formaliser la décision. Klaris prépare l'invitation.",
            action: { kind: "mail", mail: "convocation", cta: "Préparer l'invitation" },
          },
          {
            title: "Documenter la délibération",
            subtitle: "Notez les conclusions de la réunion : anomalies identifiées, justifications obtenues ou non, décision motivée.",
            action: {
              kind: "note",
              placeholder: noteDeliberation,
              cta: "Enregistrer la délibération",
            },
          },
          {
            title: "Décider de la suite",
            subtitle: "À choisir selon les conclusions. Le niveau du dossier sera mis à jour automatiquement.",
            action: {
              kind: "branch",
              options: [
                {
                  label: "Lever le doute — repasser en vigilance renforcée",
                  tone: "warn",
                  transitionTo: "vigilance_renforcee",
                  successMessage: "Dossier rebasculé en vigilance renforcée. Continuez la marche à suivre.",
                },
                {
                  label: "Doutes persistants — escalader vers déclaration TRACFIN",
                  tone: "crit",
                  transitionTo: "interdiction",
                  externalUrl: "https://tracfin.finances.gouv.fr/",
                  successMessage: "Dossier passé en interdiction. ERMES s'ouvre dans un nouvel onglet.",
                },
              ],
            },
          },
        ],
      };

    case "interdiction":
      return {
        tone: "crit",
        icon: ShieldOff,
        headline: "Interdiction & déclaration TRACFIN",
        intro: `Le dossier de ${safeName} présente une suspicion sérieuse de blanchiment ou financement du terrorisme. Refus immédiat de la relation et déclaration à TRACFIN avant l'exécution de l'opération, ou sans délai si elle a déjà été réalisée.`,
        cmfRef: "CMF L.562-4 (gel des avoirs) · L.561-8 · déclaration : L.561-15, L.561-16",
        steps: [
          {
            title: "Refuser la relation d'affaires (sans en révéler la raison)",
            subtitle: "Ne dites jamais au client que vous le déclarez à Tracfin : c'est interdit (L.561-18) et puni de 22 500 € d'amende (L.574-1). Klaris prépare un e-mail neutre.",
            action: { kind: "mail", mail: "refus", cta: "Préparer l'e-mail au client" },
          },
          {
            title: "Préparer le brouillon de déclaration",
            subtitle: "Plus bas, dans « Déclaration de soupçon » : Klaris pré-remplit les faits à partir du dossier. Relisez-les, puis voyez ou téléchargez le brouillon à reporter dans ERMES.",
            action: {
              kind: "link",
              href: "#declaration",
              cta: "Aller au brouillon de déclaration",
            },
          },
          {
            title: "Aussi : télécharger les pièces (ZIP) pour les joindre",
            subtitle: "ERMES vous demandera de joindre les pièces justificatives. Le ZIP contient tout, prêt à l'upload.",
            action: {
              kind: "download",
              href: `/api/dossiers/${dossierId}/zip`,
              filename: `dossier-klaris-${dossierId.slice(0, 8)}.zip`,
              cta: "Télécharger les pièces (ZIP)",
            },
          },
          {
            title: "Ouvrir ERMES et faire la déclaration",
            subtitle: "Authentifiez-vous avec votre carte professionnelle. Reportez les éléments du brouillon dans le formulaire « Déclaration de Soupçon ». Joignez le ZIP. Validez.",
            action: {
              kind: "link",
              href: "https://tracfin.finances.gouv.fr/",
              external: true,
              cta: "Ouvrir ERMES dans un nouvel onglet",
            },
          },
          {
            title: "Confirmer la déclaration faite",
            subtitle: "Notez le numéro de DS reçu en accusé de réception. À conserver 5 ans. Vous êtes protégé contre toute action en responsabilité (L.561-22).",
            action: {
              kind: "note",
              placeholder: "Numéro de DS TRACFIN reçu : DS-2026-XXXXX · Date : JJ/MM/AAAA",
              cta: "Enregistrer le numéro",
            },
          },
        ],
      };
  }
}

/* ════════════════════════════════════════════════════════════════════
   STYLES PAR TONALITÉ
   ════════════════════════════════════════════════════════════════════ */

function tones(tone: Wizard["tone"]) {
  switch (tone) {
    case "ok":
      return { fg: "#0F7A4F", bgSoft: "rgba(30,158,106,0.06)", border: "rgba(30,158,106,0.30)", iconBg: "rgba(30,158,106,0.12)", accent: "#16A06A" };
    case "warn":
      return { fg: "#8F5A00", bgSoft: "rgba(227,160,8,0.06)", border: "rgba(227,160,8,0.30)", iconBg: "rgba(227,160,8,0.12)", accent: "#D9980A" };
    case "danger":
      return { fg: "#B3322D", bgSoft: "rgba(197,48,44,0.06)", border: "rgba(197,48,44,0.30)", iconBg: "rgba(197,48,44,0.12)", accent: "#C23630" };
    case "crit":
      return { fg: "#7c2d12", bgSoft: "rgba(124,45,18,0.07)", border: "rgba(124,45,18,0.30)", iconBg: "rgba(124,45,18,0.14)", accent: "#9a3412" };
  }
}

/* ════════════════════════════════════════════════════════════════════
   ÉTAT PERSISTANT (localStorage)
   ════════════════════════════════════════════════════════════════════ */

interface PersistState {
  doneSteps: number[];
  notes: Record<number, string>;
}

/** Clé localStorage par dossier ET par niveau (évite la pollution lors d'une transition). */
function storageKey(dossierId: string, niveau: Niveau): string {
  return `klaris-marche-${dossierId}-${niveau}`;
}

function loadState(dossierId: string, niveau: Niveau): PersistState {
  const empty: PersistState = { doneSteps: [], notes: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(storageKey(dossierId, niveau));
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    // Validation de la structure (anciens formats = ignorés et nettoyés)
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as PersistState).doneSteps) &&
      (parsed as PersistState).notes &&
      typeof (parsed as PersistState).notes === "object"
    ) {
      return parsed as PersistState;
    }
    // Format inconnu (ex: ancien composant) → on purge et on repart à zéro
    localStorage.removeItem(storageKey(dossierId, niveau));
    return empty;
  } catch { return empty; }
}

function saveState(dossierId: string, niveau: Niveau, state: PersistState) {
  try {
    localStorage.setItem(storageKey(dossierId, niveau), JSON.stringify(state));
    // Notifie les autres composants (dashboard alerts, etc.) de la mise à jour
    window.dispatchEvent(new CustomEvent("klaris:marche-updated", { detail: { dossierId } }));
  } catch { /* noop */ }
}

/* ─── Helpers exportés (utilisés par DashboardClient pour filtrer les alertes) ─── */

/** Nombre total d'étapes du wizard pour un niveau donné */
const MARCHE_STEPS_COUNT: Record<Niveau, number> = {
  vigilance_standard: 1,
  vigilance_renforcee: 4,
  examen_renforce: 4,
  interdiction: 5,
};

/** Vrai si la marche à suivre de ce dossier est entièrement complétée. */
export function isMarcheTerminee(dossierId: string, niveau: Niveau): boolean {
  if (typeof window === "undefined") return false;
  const target = MARCHE_STEPS_COUNT[niveau];
  if (!target) return false;
  const s = loadState(dossierId, niveau);
  return s.doneSteps.length >= target;
}

/** Où en est la marche à suivre d'un dossier (lu dans le navigateur) :
 *  l'étape en cours (null si tout est fait), le nombre d'étapes faites et le total. */
export function marcheProgress(
  dossierId: string,
  niveau: Niveau,
  clientName: string,
  partie: "vendeur" | "acquereur" = "acquereur",
): { current: string | null; done: number; total: number } {
  const w = buildWizard(niveau, clientName, dossierId, partie);
  const s = loadState(dossierId, niveau);
  const idx = w.steps.findIndex((_, i) => !s.doneSteps.includes(i));
  return { current: idx === -1 ? null : w.steps[idx].title, done: Math.min(s.doneSteps.length, w.steps.length), total: w.steps.length };
}

/** Clé localStorage pour mémoriser le niveau d'origine avant transition manuelle. */
function prevNiveauKey(dossierId: string): string {
  return `klaris-prev-niveau-${dossierId}`;
}

function getPrevNiveau(dossierId: string): Niveau | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(prevNiveauKey(dossierId));
    if (!v) return null;
    if (["vigilance_standard", "vigilance_renforcee", "examen_renforce", "interdiction"].includes(v)) {
      return v as Niveau;
    }
    return null;
  } catch { return null; }
}

function setPrevNiveau(dossierId: string, niveau: Niveau | null) {
  try {
    if (niveau === null) localStorage.removeItem(prevNiveauKey(dossierId));
    else localStorage.setItem(prevNiveauKey(dossierId), niveau);
  } catch { /* noop */ }
}

const NIVEAU_LABEL: Record<Niveau, string> = {
  vigilance_standard: "Vigilance standard",
  vigilance_renforcee: "Vigilance renforcée",
  examen_renforce: "Examen renforcé",
  interdiction: "Interdiction & déclaration",
};

/* ════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════════════ */

export default function MarcheASuivre({ niveau, dossierId, clientName, partie = "acquereur", mode = "compact", contact }: Props) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const mailCtx = useMemo<MailCtx>(() => ({
    clientName: clientName || "Madame, Monsieur",
    partie,
    email: contact?.email ?? null,
    lieuBien: contact?.lieuBien ?? null,
    agent: user?.fullName ?? null,
    agency: organization?.name ?? null,
  }), [clientName, partie, contact?.email, contact?.lieuBien, user?.fullName, organization?.name]);
  const wizard = useMemo(
    () => buildWizard(niveau, clientName, dossierId, partie),
    [niveau, clientName, dossierId, partie],
  );
  const c = tones(wizard.tone);

  // ─── État persistant ─────────────────────────────────────────────
  const [state, setState] = useState<PersistState>({ doneSteps: [], notes: {} });
  useEffect(() => { setState(loadState(dossierId, niveau)); }, [dossierId, niveau]);

  const markDone = (idx: number) => {
    const next: PersistState = {
      ...state,
      doneSteps: state.doneSteps.includes(idx) ? state.doneSteps : [...state.doneSteps, idx],
    };
    setState(next);
    saveState(dossierId, niveau, next);
  };

  const undoDone = (idx: number) => {
    const next: PersistState = {
      ...state,
      doneSteps: state.doneSteps.filter((i) => i !== idx),
    };
    setState(next);
    saveState(dossierId, niveau, next);
  };

  const setNote = (idx: number, text: string) => {
    const next: PersistState = { ...state, notes: { ...state.notes, [idx]: text } };
    setState(next);
    saveState(dossierId, niveau, next);
  };

  // Étape courante = première non-faite
  const currentIdx = useMemo(() => {
    for (let i = 0; i < wizard.steps.length; i++) {
      if (!state.doneSteps.includes(i)) return i;
    }
    return wizard.steps.length; // toutes faites
  }, [state.doneSteps, wizard.steps.length]);

  const allDone = currentIdx >= wizard.steps.length;

  // ─── Mode compact (preview dashboard) ─────────────────────────────
  if (mode === "compact") {
    return (
      <CompactView
        wizard={wizard}
        c={c}
        currentIdx={currentIdx}
        allDone={allDone}
        dossierId={dossierId}
      />
    );
  }

  // ─── Mode full (page détail) ──────────────────────────────────────
  return (
    <MailCtxC.Provider value={mailCtx}>
    <FullView
      wizard={wizard}
      c={c}
      state={state}
      currentIdx={currentIdx}
      allDone={allDone}
      onDone={markDone}
      onUndo={undoDone}
      onNote={setNote}
      clientName={clientName}
      dossierId={dossierId}
    />
    </MailCtxC.Provider>
  );
}

/* ─── Mode compact ────────────────────────────────────────────────── */

function CompactView({
  wizard, c, currentIdx, allDone, dossierId,
}: {
  wizard: Wizard;
  c: ReturnType<typeof tones>;
  currentIdx: number;
  allDone: boolean;
  dossierId: string;
}) {
  const total = wizard.steps.length;
  const Icon = wizard.icon;

  return (
    <Link
      href={`/dashboard/${dossierId}`}
      className="block rounded-[22px] p-4 transition-transform hover:-translate-y-0.5"
      style={{
        background: c.bgSoft,
        border: `1px solid ${c.border}`,
        textDecoration: "none",
        boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 14px rgba(11,20,53,0.04)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: c.iconBg, border: `1px solid ${c.border}` }}
        >
          {allDone ? (
            <CheckCircle2 width={18} height={18} style={{ color: c.fg }} />
          ) : (
            <Icon width={17} height={17} style={{ color: c.fg }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold mb-0.5" style={{ color: c.fg, opacity: 0.7 }}>
            {allDone ? "✓ Marche à suivre terminée" : `Étape ${currentIdx + 1} sur ${total}`}
          </div>
          <div className="text-[14px] font-semibold leading-tight" style={{ color: c.fg }}>
            {allDone ? wizard.headline : wizard.steps[currentIdx].title}
          </div>
          {!allDone && (
            <div className="text-[12px] mt-1 leading-snug" style={{ color: c.fg, opacity: 0.85 }}>
              {wizard.steps[currentIdx].subtitle.slice(0, 95)}{wizard.steps[currentIdx].subtitle.length > 95 ? "…" : ""}
            </div>
          )}
        </div>
        <ArrowRight width={15} height={15} className="shrink-0 mt-1" style={{ color: c.fg, opacity: 0.55 }} />
      </div>

      {/* Mini stepper en bas */}
      <div className="mt-3 flex items-center gap-1">
        {wizard.steps.map((_, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx && !allDone;
          return (
            <span
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{
                background: done || allDone ? c.accent : current ? c.fg : "rgba(0,0,0,0.08)",
                opacity: done || allDone ? 1 : current ? 0.85 : 1,
              }}
            />
          );
        })}
      </div>
    </Link>
  );
}

/* ─── Mode full (wizard) ──────────────────────────────────────────── */

function FullView({
  wizard, c, state, currentIdx, allDone, onDone, onUndo, onNote, clientName, dossierId,
}: {
  wizard: Wizard;
  c: ReturnType<typeof tones>;
  state: PersistState;
  currentIdx: number;
  allDone: boolean;
  onDone: (i: number) => void;
  onUndo: (i: number) => void;
  onNote: (i: number, t: string) => void;
  clientName: string;
  dossierId: string;
}) {
  const total = wizard.steps.length;
  const Icon = wizard.icon;
  const progress = allDone ? 100 : Math.round((currentIdx / total) * 100);
  const router = useRouter();

  // ─── Annulation d'une transition précédente ─────────────────────
  const [prevNiveau, setPrevNiveauState] = useState<Niveau | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    setPrevNiveauState(getPrevNiveau(dossierId));
  }, [dossierId]);

  const undoTransition = async () => {
    if (!prevNiveau || undoing) return;
    if (!confirm(`Revenir au niveau « ${NIVEAU_LABEL[prevNiveau]} » ?\n\nLa progression de la marche à suivre actuelle sera perdue.`)) return;
    setUndoing(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niveau: prevNiveau }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Annulation refusée");
      }
      setPrevNiveau(dossierId, null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'annulation");
      setUndoing(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "white",
        border: `1px solid ${c.border}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 38px rgba(11,20,53,0.06)`,
      }}
    >
      {/* Bandeau d'annulation si une transition manuelle a été faite récemment */}
      {prevNiveau && (
        <div
          className="px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap text-[12.5px]"
          style={{ background: "rgba(11,20,53,0.04)", borderBottom: "1px dashed rgba(11,20,53,0.10)" }}
        >
          <span style={{ color: "#47507A" }}>
            <RotateCw width={11} height={11} className="inline mr-1 -mt-0.5" />
            Vous avez basculé ce dossier manuellement. Cliqué par erreur&nbsp;?
          </span>
          <button
            type="button"
            onClick={undoTransition}
            disabled={undoing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-[12px] transition border"
            style={{
              background: "white",
              borderColor: "rgba(11,20,53,0.15)",
              color: "#0B1435",
              opacity: undoing ? 0.6 : 1,
              cursor: undoing ? "wait" : "pointer",
            }}
          >
            {undoing ? <Loader2 width={11} height={11} className="animate-spin" /> : <RotateCw width={11} height={11} />}
            Revenir à « {NIVEAU_LABEL[prevNiveau]} »
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-5 sm:p-6" style={{ background: c.bgSoft, borderBottom: `1px solid ${c.border}` }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
            style={{ background: "white", border: `1px solid ${c.border}` }}
          >
            {allDone ? (
              <CheckCircle2 width={24} height={24} style={{ color: c.fg }} />
            ) : (
              <Icon width={22} height={22} style={{ color: c.fg }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold mb-1" style={{ color: c.fg, opacity: 0.7 }}>
              Marche à suivre · {clientName}
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-bold leading-tight" style={{ color: c.fg }}>
              {allDone ? "Toutes les actions sont terminées" : wizard.headline}
            </h2>
            <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: c.fg, opacity: 0.85 }}>
              {allDone
                ? "Toutes les actions de la marche à suivre sont faites. Klaris conserve les preuves cinq ans."
                : wizard.intro}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold" style={{ color: c.fg, opacity: 0.75 }}>
              <span>{wizard.cmfRef}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{allDone ? `${total} / ${total}` : `Étape ${currentIdx + 1} / ${total}`}</span>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${c.accent}, ${c.fg})`,
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-5 sm:p-6">
        {allDone ? (
          <DoneView wizard={wizard} c={c} state={state} onUndo={onUndo} />
        ) : (
          <div className="space-y-3">
            {wizard.steps.map((step, i) => {
              const done = state.doneSteps.includes(i);
              const isCurrent = i === currentIdx;
              const isFuture = i > currentIdx;
              return (
                <StepCard
                  key={i}
                  index={i}
                  total={total}
                  step={step}
                  c={c}
                  state={done ? "done" : isCurrent ? "current" : "future"}
                  noteValue={state.notes[i] ?? ""}
                  onDone={() => onDone(i)}
                  onUndo={() => onUndo(i)}
                  onNote={(t) => onNote(i, t)}
                  isFuture={isFuture}
                  dossierId={dossierId}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Card d'une étape ─────────────────────────────────────────────── */

function StepCard({
  index, total, step, c, state, noteValue, onDone, onUndo, onNote, isFuture, dossierId,
}: {
  index: number;
  total: number;
  step: Step;
  c: ReturnType<typeof tones>;
  state: "done" | "current" | "future";
  noteValue: string;
  onDone: () => void;
  onUndo: () => void;
  onNote: (t: string) => void;
  isFuture: boolean;
  dossierId: string;
}) {
  if (state === "done") {
    return (
      <div
        className="rounded-xl p-3.5 flex items-start gap-3"
        style={{ background: "rgba(30,158,106,0.04)", border: "1px solid rgba(30,158,106,0.25)" }}
      >
        <CheckCircle2 width={20} height={20} style={{ color: "#16A06A" }} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-700 line-through opacity-60">{step.title}</div>
        </div>
        <button
          type="button"
          onClick={onUndo}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 shrink-0"
          title="Annuler"
        >
          <RotateCw width={11} height={11} />
          Annuler
        </button>
      </div>
    );
  }

  if (isFuture) {
    return (
      <div
        className="rounded-xl p-3.5 flex items-start gap-3"
        style={{ background: "rgba(11,20,53,0.02)", border: "1px solid rgba(11,20,53,0.06)" }}
      >
        <div
          className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5 text-[10px] font-bold"
          style={{ background: "white", border: "1px solid rgba(11,20,53,0.10)", color: "#98A0BD" }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-slate-400">{step.title}</div>
        </div>
      </div>
    );
  }

  // current
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "white",
        border: `2px solid ${c.accent}`,
        boxShadow: `0 0 0 4px ${c.bgSoft}, 0 6px 18px rgba(11,20,53,0.06)`,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-7 h-7 rounded-full grid place-items-center shrink-0 text-[12px] font-bold text-white"
          style={{ background: c.accent }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-semibold mb-0.5" style={{ color: c.fg, opacity: 0.7 }}>
            Action en cours · Étape {index + 1} sur {total}
          </div>
          <h3 className="text-[16px] font-bold leading-tight" style={{ color: "#0B1435" }}>
            {step.title}
          </h3>
        </div>
      </div>
      <p className="text-[13px] text-slate-600 leading-relaxed mb-4 ml-10">{step.subtitle}</p>

      <div className="ml-10">
        <StepAction step={step} c={c} noteValue={noteValue} onDone={onDone} onNote={onNote} dossierId={dossierId} />
      </div>
    </div>
  );
}

/* ─── Bloc d'action selon le type ─────────────────────────────────── */

function StepAction({
  step, c, noteValue, onDone, onNote, dossierId,
}: {
  step: Step;
  c: ReturnType<typeof tones>;
  noteValue: string;
  onDone: () => void;
  onNote: (t: string) => void;
  dossierId: string;
}) {
  const a = step.action;
  const router = useRouter();
  const [branchState, setBranchState] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false,
    error: null,
    success: null,
  });

  if (a.kind === "done") {
    return (
      <button
        type="button"
        onClick={onDone}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`,
          boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}`,
        }}
      >
        <Check width={14} height={14} />
        {a.cta}
      </button>
    );
  }

  if (a.kind === "mail" || a.kind === "decision") {
    return <MailStep a={a} c={c} onDone={onDone} />;
  }

  if (a.kind === "download") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <DownloadButton
          url={a.href}
          filename={a.filename}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`, boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}` }}
        >
          <Package width={14} height={14} />
          {a.cta}
        </DownloadButton>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition"
        >
          <Check width={13} height={13} />
          C&apos;est fait
        </button>
      </div>
    );
  }

  if (a.kind === "mailto") {
    const mailto = `mailto:?subject=${encodeURIComponent(a.subject)}&body=${encodeURIComponent(a.body)}`;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={mailto}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`,
            boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}`,
          }}
        >
          <Mail width={14} height={14} />
          {a.cta}
        </a>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition"
        >
          <Check width={13} height={13} />
          J'ai envoyé l'email
        </button>
      </div>
    );
  }

  if (a.kind === "link") {
    const Icon = a.external ? ExternalLink : a.href.endsWith(".zip") || a.href.includes("/zip") ? Package : FileDown;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={a.href}
          target={a.external ? "_blank" : undefined}
          rel={a.external ? "noreferrer noopener" : undefined}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`,
            boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}`,
          }}
        >
          <Icon width={14} height={14} />
          {a.cta}
        </a>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition"
        >
          <Check width={13} height={13} />
          C'est fait
        </button>
      </div>
    );
  }

  if (a.kind === "note") {
    return (
      <div className="space-y-2.5">
        <textarea
          value={noteValue}
          onChange={(e) => onNote(e.target.value)}
          placeholder={a.placeholder}
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border text-[13px] text-slate-800 leading-relaxed outline-none focus:ring-4 focus:ring-violet-500/15 resize-y"
          style={{ borderColor: "rgba(11,20,53,0.12)", background: "white" }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDone}
            disabled={!noteValue.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`,
              boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}`,
            }}
          >
            <Check width={14} height={14} />
            {a.cta}
          </button>
          <span className="text-[11.5px] text-slate-400">Auto-sauvegardé localement</span>
        </div>
      </div>
    );
  }

  if (a.kind === "branch") {
    const handleChoice = async (opt: typeof a.options[number]) => {
      if (branchState.loading) return;
      setBranchState({ loading: true, error: null, success: null });

      try {
        // 1) Transition du niveau du dossier en DB (si applicable)
        if (opt.transitionTo) {
          // Récupère le niveau actuel pour pouvoir l'annuler ensuite
          const fromNiveau = step.action.kind === "branch" ? "examen_renforce" : null;

          const res = await fetch(`/api/dossiers/${dossierId}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ niveau: opt.transitionTo }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Transition refusée");
          }

          // Mémorise le niveau d'origine pour permettre un retour en arrière
          if (fromNiveau) setPrevNiveau(dossierId, fromNiveau);
        }

        // 2) Marque l'étape comme faite
        onDone();

        // 3) Ouvre l'URL externe si fournie (ERMES)
        if (opt.externalUrl) {
          window.open(opt.externalUrl, "_blank", "noopener,noreferrer");
        }

        // 4) Affiche un message succès et rafraîchit la page (server re-rend avec le nouveau niveau)
        setBranchState({ loading: false, error: null, success: opt.successMessage ?? "Action enregistrée." });

        // Refresh après un court délai pour laisser le user voir le message
        setTimeout(() => router.refresh(), 600);
      } catch (e) {
        setBranchState({
          loading: false,
          error: e instanceof Error ? e.message : "Erreur lors de la transition",
          success: null,
        });
      }
    };

    return (
      <div className="flex flex-col gap-2">
        {a.options.map((opt) => {
          const isCrit = opt.tone === "crit";
          const isWarn = opt.tone === "warn";
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleChoice(opt)}
              disabled={branchState.loading}
              className="text-left inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-[13.5px] font-semibold border transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                borderColor: isCrit ? "rgba(11,20,53,0.40)" : isWarn ? "rgba(227,160,8,0.40)" : "rgba(11,20,53,0.12)",
                color: isCrit ? "#ffffff" : isWarn ? "#8F5A00" : "#0B1435",
                background: isCrit
                  ? "linear-gradient(135deg, #0B1435 0%, #1C2650 100%)"
                  : isWarn
                  ? "rgba(227,160,8,0.06)"
                  : "white",
                boxShadow: isCrit ? "0 0 0 1px rgba(197,48,44,0.30), 0 6px 18px rgba(11,20,53,0.20)" : "none",
              }}
            >
              <span className="flex-1">{opt.label}</span>
              {branchState.loading ? (
                <Loader2 width={14} height={14} className="animate-spin shrink-0" />
              ) : opt.externalUrl ? (
                <ExternalLink width={14} height={14} className="shrink-0" style={{ opacity: 0.85 }} />
              ) : (
                <ArrowRight width={14} height={14} className="shrink-0" style={{ opacity: 0.85 }} />
              )}
            </button>
          );
        })}

        {branchState.error && (
          <p className="text-[12px] text-rose-600 font-medium mt-1">⚠ {branchState.error}</p>
        )}
        {branchState.success && (
          <p className="text-[12px] text-emerald-700 font-medium mt-1">✓ {branchState.success}</p>
        )}
      </div>
    );
  }

  return null;
}

/* ─── Vue "tout est fait" ──────────────────────────────────────────── */

function DoneView({
  wizard, c, state, onUndo,
}: {
  wizard: Wizard;
  c: ReturnType<typeof tones>;
  state: PersistState;
  onUndo: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5 flex items-start gap-3"
        style={{ background: "rgba(30,158,106,0.06)", border: "1px solid rgba(30,158,106,0.30)" }}
      >
        <Sparkles width={20} height={20} style={{ color: "#16A06A" }} className="shrink-0 mt-0.5" />
        <div>
          <div className="text-[14px] font-bold text-emerald-800 mb-1">Toutes les étapes sont validées</div>
          <p className="text-[12.5px] text-emerald-900/85 leading-relaxed">
            Les actions et les notes sont conservées dans Klaris. En cas de contrôle, vous retrouvez
            l'historique complet de votre démarche depuis ce dossier.
          </p>
        </div>
      </div>

      {/* Récap notes saisies */}
      {Object.keys(state.notes).length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-semibold text-slate-500">
            Notes enregistrées
          </div>
          {wizard.steps.map((step, i) => {
            const note = state.notes[i];
            if (!note?.trim()) return null;
            return (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: "rgba(11,20,53,0.02)", border: "1px solid rgba(11,20,53,0.08)" }}
              >
                <div className="text-[11.5px] font-semibold text-slate-500 mb-1">{step.title}</div>
                <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{note}</div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => onUndo(wizard.steps.length - 1)}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-700"
      >
        <RotateCw width={11} height={11} />
        Revenir à la dernière étape pour la modifier
      </button>
    </div>
  );
}


/* ─── E-mail préparé (et décision ouvrir / refuser) ───────────────── */

function MailStep({
  a, c, onDone,
}: {
  a: Extract<ActionKind, { kind: "mail" } | { kind: "decision" }>;
  c: ReturnType<typeof tones>;
  onDone: () => void;
}) {
  const ctx = useContext(MailCtxC);
  const [open, setOpen] = useState(false);
  const mail: MailId = a.kind === "mail" ? a.mail : "refus";
  const btn = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5";
  const solid = { background: `linear-gradient(135deg, ${c.accent}, ${c.fg})`, color: "#fff", boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 18px ${c.bgSoft}` };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {a.kind === "mail" ? (
        <>
          <button type="button" onClick={() => setOpen(true)} className={btn} style={solid}>
            <Mail width={14} height={14} />
            {a.cta}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition"
          >
            <Check width={13} height={13} />
            Déjà envoyé
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={onDone} className={btn} style={solid}>
            <Check width={14} height={14} />
            {a.okLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${btn} border`}
            style={{ background: "#fff", color: "#A3241F", borderColor: "rgba(197,48,44,0.35)" }}
          >
            <Mail width={14} height={14} />
            {a.refuseLabel}
          </button>
        </>
      )}
      {open && ctx && <MailComposer id={mail} ctx={ctx} onClose={() => setOpen(false)} onSent={onDone} />}
    </div>
  );
}
