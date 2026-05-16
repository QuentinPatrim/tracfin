// components/dashboard/MarcheASuivre.tsx — Guide actionnable par niveau de vigilance
// Affiche les actions concrètes à mener selon le verdict CMF.
// Mode "compact" pour le preview dashboard, mode "full" pour la page détail dossier.

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, Circle, AlertTriangle, ShieldOff, FileDown, ExternalLink,
  Mail, Clock, Lock, Package, ChevronDown, ChevronUp, Send,
} from "lucide-react";
import type { Niveau } from "@/lib/tracfin";

interface Props {
  niveau: Niveau;
  dossierId: string;
  clientName: string;
  mode?: "compact" | "full";
}

interface ChecklistItem {
  label: string;
  detail?: string;
  ref?: string;
}

interface GuideContent {
  toneClass: "ok" | "warn" | "danger" | "crit";
  icon: React.ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  title: string;
  intro: string;
  cmfRef: string;
  deadline?: string;
  sections: Array<{
    title: string;
    items: ChecklistItem[];
    warning?: string;
  }>;
}

/* ════════════════════════════════════════════════════════════════════
   CONTENU DU GUIDE PAR NIVEAU
   ════════════════════════════════════════════════════════════════════ */

function getGuide(niveau: Niveau): GuideContent {
  switch (niveau) {
    case "vigilance_standard":
      return {
        toneClass: "ok",
        icon: CheckCircle2,
        title: "Aucune action additionnelle requise",
        intro:
          "Le dossier est conforme aux obligations LCB-FT standards. Vous pouvez traiter la relation d'affaires normalement, en respectant les bonnes pratiques.",
        cmfRef: "CMF L.561-5 à L.561-8",
        sections: [
          {
            title: "Vos obligations courantes",
            items: [
              { label: "Identification du client effectuée", ref: "L.561-5" },
              { label: "Vigilance constante pendant toute la relation d'affaires", ref: "L.561-6" },
              { label: "Mise à jour des informations en cas de changement substantiel", ref: "L.561-5-1" },
              { label: "Conservation des pièces pendant 5 ans après la fin de la relation", ref: "L.561-12-1" },
            ],
          },
        ],
      };

    case "vigilance_renforcee":
      return {
        toneClass: "warn",
        icon: AlertTriangle,
        title: "Vigilance renforcée requise",
        intro:
          "Le dossier présente un ou plusieurs indicateurs nécessitant une analyse approfondie avant ou pendant la relation d'affaires. Vous devez recueillir des informations complémentaires et formaliser votre analyse.",
        cmfRef: "CMF L.561-10",
        sections: [
          {
            title: "1. Recueillir des justificatifs additionnels",
            items: [
              { label: "Justificatif détaillé de l'origine des fonds", detail: "Relevé bancaire des 3 derniers mois, acte notarié de vente, attestation héritage, contrat de prêt familial avec montants et dates." },
              { label: "Justificatif d'activité professionnelle / source de revenus", detail: "Avis d'imposition récent, bulletins de salaire, K-bis si auto-entrepreneur." },
              { label: "Si PPE détectée : déclaration sur l'honneur précisant la fonction et la durée d'exercice", ref: "L.561-10 1°" },
              { label: "Si pays à risque (GAFI grise/noire) : explication écrite des liens du client avec ce pays" },
            ],
          },
          {
            title: "2. Faire valider par le correspondant LCB-FT",
            items: [
              { label: "Présenter le dossier au correspondant LCB-FT de votre cabinet" },
              { label: "Obtenir son accord écrit (ou daté + signé) pour entrer en relation" },
              { label: "Si pas de correspondant : votre supérieur hiérarchique direct", ref: "L.561-32" },
            ],
          },
          {
            title: "3. Formaliser par écrit",
            items: [
              { label: "Rédiger un mémo d'analyse du risque, joint au dossier (champs « Commentaires » dans Klaris)" },
              { label: "Tracer toutes les démarches effectuées (date, contact, résultat)" },
              { label: "Conserver ces traces 5 ans après fin de relation", ref: "L.561-12-1" },
            ],
          },
          {
            title: "4. Mettre en place une surveillance renforcée",
            items: [
              { label: "Examiner systématiquement toutes les opérations futures du client (pas seulement la transaction en cours)" },
              { label: "Re-déclencher l'analyse Klaris à chaque modification (situation, montant, financement)" },
            ],
          },
        ],
      };

    case "examen_renforce":
      return {
        toneClass: "danger",
        icon: AlertTriangle,
        title: "Examen renforcé immédiat",
        intro:
          "Une anomalie significative a été détectée. La loi impose la suspension de l'opération et un examen approfondi formalisé par écrit avant toute décision.",
        cmfRef: "CMF L.561-10-2",
        deadline: "Examen à conduire sans délai",
        sections: [
          {
            title: "1. Suspendez immédiatement",
            warning: "Toute poursuite de l'opération sans examen préalable engage votre responsabilité personnelle et celle de votre cabinet.",
            items: [
              { label: "Stoppez toute correspondance commerciale sur la transaction en cours" },
              { label: "N'informez pas le client du motif réel de la suspension (vague : « vérifications réglementaires »)" },
              { label: "Si fonds déjà séquestrés / acompte versé : ne pas restituer sans avis du correspondant LCB-FT" },
            ],
          },
          {
            title: "2. Convoquez le correspondant LCB-FT",
            items: [
              { label: "Réunion formalisée (compte-rendu écrit, daté, signé)" },
              { label: "Présentez l'attestation Klaris (toutes les pièces) + vos observations" },
              { label: "Décision collégiale documentée : levée du doute, demande de pièces, ou déclaration TRACFIN" },
            ],
          },
          {
            title: "3. Documentez l'analyse approfondie",
            items: [
              { label: "Origine précise de l'anomalie (quel critère, quelle valeur déclenche)" },
              { label: "Démarches complémentaires : pièces demandées, sources consultées (Open Sanctions, Pappers, etc.)" },
              { label: "Justifications obtenues ou non" },
              { label: "Décision motivée et signée du correspondant LCB-FT", ref: "L.561-32" },
            ],
          },
          {
            title: "4. Conclusion",
            items: [
              { label: "✓ Si l'examen lève les doutes : tracez la levée par écrit, reprenez avec vigilance renforcée (cf. niveau ci-dessus)" },
              { label: "⚠ Si les doutes persistent ou se confirment : passez en interdiction + déclaration TRACFIN", ref: "L.561-15" },
            ],
          },
        ],
      };

    case "interdiction":
      return {
        toneClass: "crit",
        icon: ShieldOff,
        title: "Interdiction de traiter & déclaration TRACFIN",
        intro:
          "Suspicion de blanchiment de capitaux ou de financement du terrorisme. La loi vous impose de refuser la relation d'affaires et de déclarer le soupçon à TRACFIN dans un délai très court.",
        cmfRef: "CMF L.561-15, L.561-19, L.561-22 + Règl. (UE) 2024/1624",
        deadline: "Déclaration TRACFIN sous 48h max",
        sections: [
          {
            title: "1. Refus de la relation d'affaires",
            warning: "Il est INTERDIT d'informer le client de la déclaration TRACFIN. Le faire constitue un délit de divulgation (L.561-19 CMF) — jusqu'à 22 500 € d'amende.",
            items: [
              { label: "Cessez immédiatement toute correspondance commerciale" },
              { label: "Restituez les fonds déjà perçus (acompte, etc.) SAUF si vous suspectez qu'ils sont issus de blanchiment — auquel cas, conservez et signalez", ref: "L.561-15-1" },
              { label: "Justification au client : invoquez une raison commerciale neutre, jamais le soupçon" },
              { label: "Conservez TOUTES les pièces du dossier (5 ans après refus)", ref: "L.561-12-1" },
            ],
          },
          {
            title: "2. Déclaration de soupçon à TRACFIN via ERMES",
            items: [
              { label: "Connectez-vous à ERMES : ouvrir https://tracfin.finances.gouv.fr/" },
              { label: "Authentification : carte professionnelle (carte T pour agent immo, certificat OCAA pour expert-comptable, etc.)" },
              { label: "Sélectionnez le formulaire de Déclaration de Soupçon (DS)" },
              {
                label: "Renseignez les sections obligatoires (voir détail ci-dessous)",
                detail: "Identité du client, opération suspecte, motifs du soupçon, pièces justificatives.",
              },
              { label: "Joignez les PDF Klaris (téléchargeables depuis ce dashboard)" },
              { label: "Validez et conservez le numéro de DS reçu en accusé de réception" },
            ],
          },
          {
            title: "3. Contenu détaillé attendu par TRACFIN",
            items: [
              { label: "Identification précise du client (toutes les données KYC : nom, naissance, adresse, profession, nationalité, pièces d'identité)" },
              { label: "Description factuelle de l'opération (date, montant, type, modalités de paiement, identité contrepartie si connue)" },
              { label: "Motifs du soupçon (factuels et précis) : ce que vous avez observé, pourquoi cela vous semble anormal, quelles vérifications vous avez menées" },
              { label: "Pièces jointes : fiche KYC PDF, attestation Klaris PDF, copies des pièces d'identité, justificatifs, échanges email" },
              { label: "Si urgence (transaction imminente) : cocher la case « DS urgente »" },
            ],
          },
          {
            title: "4. Après la déclaration",
            items: [
              { label: "TRACFIN traite de façon strictement confidentielle, vous n'avez pas de retour systématique" },
              { label: "Vous êtes protégé : aucune action en responsabilité civile, pénale ou disciplinaire ne peut être engagée pour avoir fait une DS de bonne foi", ref: "L.561-22" },
              { label: "Conservez le numéro de DS, le PDF de la déclaration et l'accusé de réception (5 ans)" },
              { label: "Si convocation comme témoin lors d'une instruction : vous y êtes obligé, c'est votre rôle légal" },
            ],
          },
        ],
      };
  }
}

/* ════════════════════════════════════════════════════════════════════
   COULEURS PAR TONALITÉ
   ════════════════════════════════════════════════════════════════════ */

function toneColors(tone: GuideContent["toneClass"]) {
  switch (tone) {
    case "ok":     return { fg: "#047857", bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.30)",  glow: "rgba(16,185,129,0.18)", iconBg: "rgba(16,185,129,0.12)" };
    case "warn":   return { fg: "#b45309", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.30)",  glow: "rgba(245,158,11,0.18)", iconBg: "rgba(245,158,11,0.12)" };
    case "danger": return { fg: "#be123c", bg: "rgba(220,38,38,0.06)",   border: "rgba(220,38,38,0.30)",   glow: "rgba(220,38,38,0.18)",  iconBg: "rgba(220,38,38,0.12)" };
    case "crit":   return { fg: "#7c2d12", bg: "rgba(124,45,18,0.06)",   border: "rgba(124,45,18,0.30)",   glow: "rgba(124,45,18,0.18)",  iconBg: "rgba(124,45,18,0.12)" };
  }
}

/* ════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ════════════════════════════════════════════════════════════════════ */

export default function MarcheASuivre({ niveau, dossierId, clientName, mode = "compact" }: Props) {
  const guide = getGuide(niveau);
  const Icon = guide.icon;
  const c = toneColors(guide.toneClass);
  const totalItems = guide.sections.reduce((acc, s) => acc + s.items.length, 0);

  // ─── Mode compact (preview dashboard) ──────────────────────────────
  if (mode === "compact") {
    return <CompactView niveau={niveau} guide={guide} Icon={Icon} c={c} totalItems={totalItems} dossierId={dossierId} />;
  }

  // ─── Mode full (page détail) ───────────────────────────────────────
  return <FullView guide={guide} Icon={Icon} c={c} dossierId={dossierId} clientName={clientName} />;
}

/* ─── Mode compact ─────────────────────────────────────────────────── */

function CompactView({
  niveau, guide, Icon, c, totalItems, dossierId,
}: {
  niveau: Niveau;
  guide: GuideContent;
  Icon: React.ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  c: ReturnType<typeof toneColors>;
  totalItems: number;
  dossierId: string;
}) {
  const [expanded, setExpanded] = useState(niveau !== "vigilance_standard");

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 6px 18px ${c.glow}`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 text-left"
      >
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: c.iconBg, border: `1px solid ${c.border}` }}
        >
          <Icon width={17} height={17} style={{ color: c.fg }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-widest font-semibold mb-1" style={{ color: c.fg, opacity: 0.7 }}>
            Marche à suivre
          </div>
          <div className="text-[14px] font-semibold leading-tight" style={{ color: c.fg }}>
            {guide.title}
          </div>
          {guide.deadline && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: c.fg }}>
              <Clock width={11} height={11} />
              {guide.deadline}
            </div>
          )}
        </div>
        <span style={{ color: c.fg, opacity: 0.7 }}>
          {expanded ? <ChevronUp width={16} height={16} /> : <ChevronDown width={16} height={16} />}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
          <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: c.fg, opacity: 0.9 }}>
            {guide.intro}
          </p>
          <div className="text-[10.5px] uppercase tracking-widest font-semibold mb-2" style={{ color: c.fg, opacity: 0.6 }}>
            {guide.sections.length} étape{guide.sections.length > 1 ? "s" : ""} · {totalItems} action{totalItems > 1 ? "s" : ""}
          </div>
          <ul className="space-y-1.5">
            {guide.sections.slice(0, 3).map((s) => (
              <li key={s.title} className="flex items-start gap-2">
                <Circle width={9} height={9} className="shrink-0 mt-1" style={{ color: c.fg, opacity: 0.55 }} />
                <span className="text-[12.5px] font-medium" style={{ color: c.fg }}>
                  {s.title.replace(/^\d+\.\s*/, "")}
                </span>
              </li>
            ))}
            {guide.sections.length > 3 && (
              <li className="text-[12px] italic ml-4" style={{ color: c.fg, opacity: 0.7 }}>
                + {guide.sections.length - 3} étape{guide.sections.length - 3 > 1 ? "s" : ""} de plus…
              </li>
            )}
          </ul>

          <Link
            href={`/dashboard/${dossierId}`}
            className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 w-full"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: `1px solid ${c.border}`,
              color: c.fg,
              boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 10px ${c.glow}`,
            }}
          >
            Voir le guide complet et la checklist
            <ChevronDown width={13} height={13} style={{ transform: "rotate(-90deg)" }} />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Mode full ────────────────────────────────────────────────────── */

function FullView({
  guide, Icon, c, dossierId, clientName,
}: {
  guide: GuideContent;
  Icon: React.ComponentType<{ width?: number; height?: number; className?: string; style?: React.CSSProperties }>;
  c: ReturnType<typeof toneColors>;
  dossierId: string;
  clientName: string;
}) {
  // Checklist interactive : on stocke localement quelles cases ont été cochées
  const storageKey = `klaris-marche-${dossierId}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    try { localStorage.setItem(storageKey, JSON.stringify(Array.from(next))); } catch { /* noop */ }
  };

  const totalItems = guide.sections.reduce((acc, s) => acc + s.items.length, 0);
  const doneItems = guide.sections.reduce(
    (acc, s, i) => acc + s.items.filter((_, j) => checked.has(`${i}-${j}`)).length,
    0,
  );

  const isInterdiction = guide.toneClass === "crit";

  return (
    <div
      className="rounded-2xl p-6 sm:p-7"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 14px 38px ${c.glow}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
          style={{
            background: c.iconBg,
            border: `1px solid ${c.border}`,
            boxShadow: `0 4px 14px ${c.glow}`,
          }}
        >
          <Icon width={22} height={22} style={{ color: c.fg }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: c.fg, opacity: 0.7 }}>
            Marche à suivre · {clientName}
          </div>
          <h2 className="text-[20px] sm:text-[22px] font-bold leading-tight" style={{ color: c.fg }}>
            {guide.title}
          </h2>
          <div className="mt-1 flex items-center gap-3 flex-wrap text-[11.5px]" style={{ color: c.fg, opacity: 0.85 }}>
            <span className="font-semibold">{guide.cmfRef}</span>
            {guide.deadline && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Clock width={11} height={11} />
                {guide.deadline}
              </span>
            )}
            <span>
              <b>{doneItems} / {totalItems}</b> action{totalItems > 1 ? "s" : ""} cochée{doneItems > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[14px] leading-relaxed mb-5" style={{ color: c.fg, opacity: 0.92 }}>
        {guide.intro}
      </p>

      {/* CTA rapide pour interdiction : accéder à ERMES + télécharger les pièces */}
      {isInterdiction && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
          <a
            href="https://tracfin.finances.gouv.fr/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #dc2626, #f43f5e)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 20px rgba(220,38,38,0.35)",
            }}
          >
            <Send width={13} height={13} />
            Ouvrir ERMES
            <ExternalLink width={11} height={11} style={{ opacity: 0.85 }} />
          </a>
          <a
            href={`/api/dossiers/${dossierId}/zip`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition"
            style={{
              background: "white",
              color: c.fg,
              border: `1px solid ${c.border}`,
            }}
          >
            <Package width={13} height={13} />
            Pièces (ZIP)
          </a>
          <a
            href={`/api/dossiers/${dossierId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition"
            style={{
              background: "white",
              color: c.fg,
              border: `1px solid ${c.border}`,
            }}
          >
            <FileDown width={13} height={13} />
            Attestation PDF
          </a>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {guide.sections.map((section, si) => (
          <section
            key={section.title}
            className="rounded-xl p-4"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: `1px solid ${c.border}`,
            }}
          >
            <h3 className="text-[14.5px] font-bold mb-2.5" style={{ color: c.fg }}>
              {section.title}
            </h3>

            {section.warning && (
              <div
                className="rounded-lg px-3 py-2 mb-3 flex items-start gap-2 text-[12.5px] font-medium"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.30)",
                  color: "#991b1b",
                }}
              >
                <Lock width={13} height={13} className="shrink-0 mt-0.5" />
                <span>{section.warning}</span>
              </div>
            )}

            <ul className="space-y-2.5">
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const isDone = checked.has(key);
                return (
                  <li key={key} className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                      aria-label={isDone ? "Décocher" : "Cocher comme fait"}
                    >
                      {isDone ? (
                        <CheckCircle2 width={18} height={18} style={{ color: c.fg }} fill={c.iconBg} />
                      ) : (
                        <Circle width={18} height={18} style={{ color: c.fg, opacity: 0.45 }} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13.5px] font-medium leading-snug"
                        style={{
                          color: c.fg,
                          opacity: isDone ? 0.5 : 1,
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="text-[12px] mt-1 leading-relaxed" style={{ color: c.fg, opacity: 0.7 }}>
                          {item.detail}
                        </div>
                      )}
                      {item.ref && (
                        <div className="text-[10.5px] mt-1 uppercase tracking-widest font-semibold" style={{ color: c.fg, opacity: 0.55 }}>
                          {item.ref}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Footer info */}
      <div
        className="mt-5 rounded-lg px-3 py-2.5 flex items-start gap-2 text-[11.5px]"
        style={{
          background: "rgba(255,255,255,0.50)",
          border: `1px dashed ${c.border}`,
          color: c.fg,
          opacity: 0.85,
        }}
      >
        <Mail width={12} height={12} className="shrink-0 mt-0.5" />
        <span>
          Ce guide est généré automatiquement par Klaris à partir du verdict CMF. Il ne se substitue pas
          à l'analyse personnelle du correspondant LCB-FT, qui reste seul responsable des décisions
          d'entrée en relation d'affaires.
        </span>
      </div>
    </div>
  );
}
