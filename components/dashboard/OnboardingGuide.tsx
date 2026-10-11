// components/dashboard/OnboardingGuide.tsx — Guide pédagogique LCB-FT (modale 7 slides)

"use client";

import { useEffect, useState } from "react";
import {
  X, ArrowRight, ArrowLeft, ShieldCheck, Clock, Scale, AlertTriangle,
  CheckCircle2, FileWarning, Gavel, BookOpen, Sparkles,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;        // ferme sans marquer comme vu (fermeture passive)
  onComplete: () => void;     // marque comme vu (skip ou fin)
}

const N_SLIDES = 7;

export default function OnboardingGuide({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setCompleting(false);
  }, [open]);

  // ESC + flèches clavier
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && step < N_SLIDES - 1) setStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && step > 0) setStep((s) => s - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await fetch("/api/onboarding/seen", { method: "POST" });
    } catch { /* on ferme quand même */ }
    onComplete();
    setCompleting(false);
  };

  if (!open) return null;

  const isLast = step === N_SLIDES - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(23,18,58,0.45)",
        backdropFilter: "blur(14px) saturate(180%)",
        WebkitBackdropFilter: "blur(14px) saturate(180%)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Bouton "Passer" en haut à droite, hors de la modale */}
      <button
        onClick={handleComplete}
        disabled={completing}
        style={{
          position: "absolute",
          top: 20, right: 20,
          padding: "8px 14px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(23,18,58,0.10)",
          color: "#3B3560",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(23,18,58,0.08)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Passer le guide
        <X width={13} height={13} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(960px, 100%)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderRadius: 20,
          border: "1px solid rgba(109,94,246,0.18)",
          overflow: "hidden",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 80px -20px rgba(109,94,246,0.40), 0 12px 40px -8px rgba(23,18,58,0.12)",
        }}
      >
        {/* halos ambient */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 20 }}>
        </div>

        {/* Top accent bar gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, #6D5EF6, #A548D8 55%, #DB2777)",
        }} />

        {/* Contenu (scroll si besoin) */}
        <div style={{ position: "relative", flex: 1, overflowY: "auto", padding: "48px 56px 24px 56px" }}>
          {SLIDES[step]}
        </div>

        {/* Footer : progress + navigation */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
            borderTop: "1px solid rgba(109,94,246,0.10)",
            background: "rgba(246,245,250,0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {Array.from({ length: N_SLIDES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  height: 6,
                  width: i === step ? 28 : 6,
                  borderRadius: 999,
                  border: 0,
                  background: i === step
                    ? "linear-gradient(90deg, #6D5EF6, #A548D8 55%, #DB2777)"
                    : i < step
                      ? "rgba(109,94,246,0.45)"
                      : "rgba(23,18,58,0.10)",
                  cursor: "pointer",
                  transition: "width 0.25s, background 0.25s",
                }}
              />
            ))}
            <span style={{ marginLeft: 12, fontSize: 11.5, color: "#6F6A8A", fontWeight: 500 }}>
              {step + 1} / {N_SLIDES}
            </span>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={navBtnStyle.secondary}
              >
                <ArrowLeft width={14} height={14} />
                Précédent
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                style={navBtnStyle.primary}
              >
                Continuer
                <ArrowRight width={14} height={14} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{ ...navBtnStyle.primary, opacity: completing ? 0.7 : 1 }}
              >
                {completing ? "Validation…" : "C'est parti"}
                <Sparkles width={14} height={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  primary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 7,
    padding: "9px 18px",
    borderRadius: 10,
    border: 0,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
    background: "linear-gradient(135deg, #6D5EF6, #A548D8 55%, #DB2777)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px rgba(109,94,246,0.30)",
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid rgba(23,18,58,0.10)",
    color: "#3B3560",
    fontWeight: 500,
    fontSize: 13,
    background: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },
};

/* ════════════════════════════════════════════════════════════════════════ */
/*                       LES 7 SLIDES PÉDAGOGIQUES                          */
/* ════════════════════════════════════════════════════════════════════════ */

const SLIDES = [
  // ─── 1) BIENVENUE ─────────────────────────────────────────────────────
  (
    <div key="welcome" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
      <div style={iconCircle("#6D5EF6")}>
        <BookOpen width={28} height={28} color="white" />
      </div>
      <Eyebrow color="#6D5EF6">Bienvenue dans Klaris</Eyebrow>
      <H1>En 5 minutes, comprenez vos obligations LCB-FT</H1>
      <P>
        Klaris a été conçu pour vous aider à être <strong>en règle</strong> avec vos obligations légales
        de Lutte contre le Blanchiment et le Financement du Terrorisme. Ce guide rapide vous explique
        l'essentiel : votre rôle, les bons réflexes, et ce que vous risquez en cas de manquement.
      </P>
      <Note>Vous pouvez le passer maintenant et le retrouver à tout moment via le bouton <strong>?</strong> dans la barre latérale.</Note>
    </div>
  ),

  // ─── 2) HISTORIQUE LCB-FT ────────────────────────────────────────────
  (
    <div key="history">
      <Eyebrow color="#6D5EF6">Module 01 · Contexte</Eyebrow>
      <H1>D'où vient la LCB-FT ?</H1>
      <P>
        La lutte contre le blanchiment est un effort <strong>mondial</strong>, coordonné depuis 1989.
        Les professionnels de l'immobilier y sont assujettis en France depuis 1998.
      </P>
      <Timeline items={[
        { year: "1989", color: "#6D5EF6", title: "Création du GAFI", desc: "Groupe d'Action Financière, organisme international piloté par le G7 pour fixer les standards anti-blanchiment." },
        { year: "1991", color: "#6D5EF6", title: "1ʳᵉ directive UE", desc: "Premier cadre européen contre l'utilisation du système financier aux fins de blanchiment." },
        { year: "1998", color: "#A548D8", title: "Professionnels de l'immobilier assujettis", desc: "Vous êtes intégré au dispositif. Aujourd'hui : article L.561-2 8° du Code monétaire et financier." },
        { year: "2001", color: "#A548D8", title: "Post 11-Septembre", desc: "Renforcement mondial pour lutter contre le financement du terrorisme (CFT)." },
        { year: "2018", color: "#EC4899", title: "5ᵉ directive UE", desc: "Directive (UE) 2018/843 : elle modifie la 4ᵉ directive (UE) 2015/849, qui a posé le principe des registres des bénéficiaires effectifs." },
        { year: "2020", color: "#EC4899", title: "Directive (UE) 2018/1673", desc: "Lutte contre le blanchiment au moyen du droit pénal, à transposer au plus tard le 3 décembre 2020." },
        { year: "2024", color: "#F43F5E", title: "Paquet AML 2024", desc: "Règlement (UE) 2024/1624, directive (UE) 2024/1640 et création de l'AMLA (autorité européenne). Le règlement est applicable à partir du 10 juillet 2027." },
      ]} />
    </div>
  ),

  // ─── 3) POURQUOI VOUS ─────────────────────────────────────────────────
  (
    <div key="why-you">
      <Eyebrow color="#6D5EF6">Module 02 · Votre rôle</Eyebrow>
      <H1>Pourquoi êtes-vous concerné ?</H1>
      <P>
        L'immobilier est un véhicule privilégié de blanchiment : montants élevés, opacité possible des
        montages, biens facilement revendables. Vous êtes en <strong>première ligne</strong>.
      </P>
      <Stats items={[
        { value: "1998", label: "année où vous êtes devenus assujettis", src: "Tracfin, brochure immobilier 2026 · Art. L.561-2 8° CMF" },
        { value: "5 ans", label: "obligation de conservation des dossiers KYC", src: "Art. L.561-12 CMF" },
      ]} />
      <Callout color="#6D5EF6" icon={<ShieldCheck width={18} height={18} />}>
        <strong>Votre mission :</strong> être les « yeux et oreilles » de Bercy <em>avant</em> que l'argent
        douteux ne soit lessivé via la pierre. Identifier, vérifier, signaler.
      </Callout>
    </div>
  ),

  // ─── 4) 5 OBLIGATIONS ─────────────────────────────────────────────────
  (
    <div key="obligations">
      <Eyebrow color="#6D5EF6">Module 03 · Vos obligations</Eyebrow>
      <H1>Vos 5 obligations clés</H1>
      <P>
        Tout est codifié dans le Code monétaire et financier, articles L.561-1 à L.561-50.
        Voici l'essentiel :
      </P>
      <CardsGrid items={[
        {
          n: "01",
          color: "#6D5EF6",
          icon: <CheckCircle2 width={18} height={18} />,
          title: "Identifier votre client",
          desc: "Pièce d'identité + justif de domicile (PP) ou Kbis + statuts + bénéficiaire effectif (PM : plus de 25 % du capital ou des droits de vote).",
          ref: "L.561-5",
        },
        {
          n: "02",
          color: "#A548D8",
          icon: <Clock width={18} height={18} />,
          title: "Vigilance constante",
          desc: "Réévaluer le risque tout au long de la relation : changement de situation, opération atypique, PPE détectée…",
          ref: "L.561-6",
        },
        {
          n: "03",
          color: "#EC4899",
          icon: <FileWarning width={18} height={18} />,
          title: "Conserver 5 ans",
          desc: "Tous les documents et pièces conservés 5 ans après la fin de la relation d'affaires. Klaris s'en charge automatiquement.",
          ref: "L.561-12",
        },
        {
          n: "04",
          color: "#F43F5E",
          icon: <Scale width={18} height={18} />,
          title: "Désigner un déclarant",
          desc: "Désigner un déclarant (R.561-23) et un correspondant (R.561-24) TRACFIN pour votre agence. Leur identité est communiquée à TRACFIN par un document joint à la première déclaration.",
          ref: "R.561-23 et R.561-24",
        },
        {
          n: "05",
          color: "#6D5EF6",
          icon: <BookOpen width={18} height={18} />,
          title: "Former vos équipes",
          desc: "Formation à l'embauche puis régulière des collaborateurs qui participent à la LCB-FT (D.561-38-1-1), en complément des procédures internes (L.561-32).",
          ref: "L.561-34",
        },
      ]} />
    </div>
  ),

  // ─── 5) 4 NIVEAUX KLARIS — QUE FAIRE ? ────────────────────────────────
  (
    <div key="levels">
      <Eyebrow color="#6D5EF6">Module 04 · Réflexes</Eyebrow>
      <H1>Les 4 niveaux Klaris : que faire ?</H1>
      <P>
        Klaris analyse chaque dossier sur 12 critères et vous indique le niveau de
        vigilance à appliquer. Voici les actions concrètes pour chaque cas :
      </P>
      <LevelRows items={[
        {
          color: "#177A52", bgColor: "#EDF8F3", bdColor: "#B5E6D2",
          dot: "🟢",
          name: "Vigilance standard",
          ref: "CMF L.561-5 à L.561-8",
          action: "Traiter normalement. Conserver le dossier complet pendant 5 ans.",
        },
        {
          color: "#B87A00", bgColor: "#FDF7E6", bdColor: "#F4DFA0",
          dot: "🟠",
          name: "Vigilance renforcée",
          ref: "CMF L.561-10 et L.561-10-1",
          action: "Collecter des justificatifs additionnels (origine fonds, RBE détaillé). Faire valider par le correspondant LCB-FT avant signature.",
        },
        {
          color: "#C5302C", bgColor: "#FCF1F0", bdColor: "#F3C9C6",
          dot: "🔴",
          name: "Examen renforcé",
          ref: "CMF L.561-10-2",
          action: "Suspendre immédiatement la transaction. Délibération formalisée avec votre responsable LCB-FT. Décision motivée avant toute reprise.",
        },
        {
          color: "#17123A", bgColor: "#F1EFF8", bdColor: "#9792B4",
          dot: "⚫",
          name: "Interdiction & déclaration",
          ref: "CMF L.562-4 (gel des avoirs) · L.561-8",
          action: "Refus de relation d'affaires. Déclaration de soupçon à TRACFIN via ERMES, avant l'exécution de l'opération ou sans délai si elle a déjà été réalisée (L.561-15, L.561-16).",
        },
      ]} />
    </div>
  ),

  // ─── 6) SANCTIONS ─────────────────────────────────────────────────────
  (
    <div key="sanctions">
      <Eyebrow color="#C5302C">Module 05 · Risques</Eyebrow>
      <H1>Sanctions en cas de manquement</H1>
      <P>
        L'autorité de contrôle pour les agents immobiliers est la <strong>DGCCRF</strong>
        (Direction générale de la concurrence, consommation et répression des fraudes).
        Les sanctions administratives sont prononcées par la <strong>Commission nationale des sanctions</strong>.
        Le blanchiment est par ailleurs une infraction pénale.
      </P>
      <SanctionCards items={[
        {
          color: "#B87A00", icon: <FileWarning width={18} height={18} />,
          title: "Administrative",
          items: ["Avertissement", "Blâme", "Interdiction temporaire d'exercice (5 ans au plus)", "Retrait de la carte professionnelle"],
          ref: "Art. L.561-40 CMF",
        },
        {
          color: "#C5302C", icon: <Scale width={18} height={18} />,
          title: "Pécuniaire",
          items: [
            "Jusqu'à 5 M€, ou le double de l'avantage retiré du manquement",
            "À la place ou en plus des sanctions administratives",
            "Dirigeants et salariés impliqués peuvent aussi être sanctionnés",
          ],
          ref: "Art. L.561-40 CMF",
        },
        {
          color: "#17123A", icon: <Gavel width={18} height={18} />,
          title: "Pénale",
          items: [
            "Jusqu'à 5 ans de prison",
            "Jusqu'à 375 000 € d'amende",
            "Confiscation des biens",
          ],
          ref: "Art. 324-1 Code pénal",
        },
      ]} />
      <Callout color="#C5302C" icon={<AlertTriangle width={18} height={18} />}>
        <strong>La bonne foi ne suffit pas.</strong> En cas de contrôle DGCCRF, vous devez pouvoir produire votre cartographie des risques, vos procédures internes, la traçabilité de la vigilance, et les justificatifs de chaque dossier — sur 5 ans.
      </Callout>
    </div>
  ),

  // ─── 7) KLARIS VOUS AIDE ─────────────────────────────────────────────
  (
    <div key="klaris-helps" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
      <div style={iconCircle("#1E9E6A")}>
        <Sparkles width={28} height={28} color="white" />
      </div>
      <Eyebrow color="#1E9E6A">Vous êtes prêt</Eyebrow>
      <H1>Klaris fait le gros du travail pour vous</H1>
      <P>
        À chaque dossier, l'application applique automatiquement les bons réflexes réglementaires.
      </P>
      <FeaturesList items={[
        { icon: "🔍", text: "Scoring automatique sur 12 critères (moteur Klaris v2, reproductible et auditable)" },
        { icon: "🔒", text: "Pièces conservées 5 ans, chiffrées (TLS 1.3 + AES-256), hébergées en France (Scaleway Paris)" },
        { icon: "📄", text: "PDF Attestation + Fiche KYC avec empreinte SHA-256, prêts à archiver" },
        { icon: "🌍", text: "Liens directs vers ERMES (plateforme de TRACFIN) et vers Open Sanctions (outil de criblage)" },
        { icon: "⚖️", text: "Mentions légales (L.561-1+, L.561-10, L.561-12, L.561-15) automatiquement intégrées aux PDFs" },
      ]} />
      <Note style={{ marginTop: 28 }}>
        Vous pouvez relancer ce guide à tout moment via le bouton <strong>?</strong> en bas de la barre latérale.
      </Note>
    </div>
  ),
];

/* ──────────────────────────────────────────────────────────────────────── */
/*                          PRIMITIVES DE LAYOUT                            */
/* ──────────────────────────────────────────────────────────────────────── */

function iconCircle(color: string): React.CSSProperties {
  return {
    width: 64, height: 64, borderRadius: 18,
    background: `linear-gradient(135deg, ${color}, ${color}99)`,
    display: "grid", placeItems: "center",
    margin: "0 auto 24px",
    boxShadow: `0 1px 0 rgba(255,255,255,0.30) inset, 0 12px 32px ${color}55`,
  };
}

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
      color, marginBottom: 8,
    }}>{children}</div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.2,
      margin: "0 0 16px 0", color: "#17123A",
    }}>{children}</h1>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 14.5, lineHeight: 1.6, color: "#3B3560",
      margin: "0 0 22px 0", maxWidth: 720,
    }}>{children}</p>
  );
}

function Note({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: "inline-block",
      marginTop: 12,
      padding: "10px 16px",
      borderRadius: 10,
      background: "rgba(109,94,246,0.06)",
      border: "1px solid rgba(109,94,246,0.18)",
      color: "#4A38C8", fontSize: 12.5, lineHeight: 1.5,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Callout({ color, icon, children }: { color: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: 16, borderRadius: 12,
      background: `${color}0C`,
      border: `1px solid ${color}33`,
      marginTop: 20,
    }}>
      <div style={{ color, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3B3560" }}>{children}</div>
    </div>
  );
}

function Timeline({ items }: { items: Array<{ year: string; color: string; title: string; desc: string }> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{
            flexShrink: 0, width: 56, textAlign: "right",
            fontSize: 14, fontWeight: 700, color: it.color, fontVariantNumeric: "tabular-nums",
            paddingTop: 2,
          }}>
            {it.year}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: it.color, marginTop: 8, flexShrink: 0, boxShadow: `0 0 0 4px ${it.color}22` }} />
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontWeight: 600, color: "#17123A", fontSize: 14 }}>{it.title}</div>
            <div style={{ fontSize: 12.5, color: "#6F6A8A", marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stats({ items }: { items: Array<{ value: string; label: string; src: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{
          padding: 16, borderRadius: 12,
          background: "linear-gradient(180deg, rgba(109,94,246,0.06), rgba(236,72,153,0.03))",
          border: "1px solid rgba(109,94,246,0.15)",
        }}>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1,
            color: "#5B46E0",
            marginBottom: 6, fontVariantNumeric: "tabular-nums",
          }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "#3B3560", lineHeight: 1.45 }}>{s.label}</div>
          <div style={{ fontSize: 10.5, color: "#9792B4", marginTop: 6, fontStyle: "italic" }}>{s.src}</div>
        </div>
      ))}
    </div>
  );
}

function CardsGrid({ items }: { items: Array<{ n: string; color: string; icon: React.ReactNode; title: string; desc: string; ref: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 8 }}>
      {items.map((c, i) => (
        <div key={i} style={{
          padding: 16, borderRadius: 14,
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(109,94,246,0.10)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 12px -6px rgba(109,94,246,0.10)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${c.color}1A`, color: c.color,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>{c.icon}</div>
            <div style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 11, fontWeight: 700, color: c.color,
              padding: "2px 7px", borderRadius: 5,
              background: `${c.color}10`, border: `1px solid ${c.color}22`,
            }}>{c.n}</div>
          </div>
          <div style={{ fontWeight: 600, color: "#17123A", fontSize: 13.5, marginBottom: 4 }}>{c.title}</div>
          <div style={{ fontSize: 12.5, color: "#6F6A8A", lineHeight: 1.5, marginBottom: 8 }}>{c.desc}</div>
          <div style={{ fontSize: 10.5, color: c.color, fontWeight: 600, letterSpacing: "0.04em" }}>CMF {c.ref}</div>
        </div>
      ))}
    </div>
  );
}

function LevelRows({ items }: { items: Array<{ color: string; bgColor: string; bdColor: string; dot: string; name: string; ref: string; action: string }> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {items.map((l, i) => (
        <div key={i} style={{
          padding: "14px 16px", borderRadius: 12,
          background: l.bgColor, border: `1px solid ${l.bdColor}`,
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{l.dot}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
              <div style={{ fontWeight: 700, color: l.color, fontSize: 14.5 }}>{l.name}</div>
              <div style={{ fontSize: 10.5, color: l.color, opacity: 0.8, fontWeight: 600, letterSpacing: "0.04em" }}>{l.ref}</div>
            </div>
            <div style={{ fontSize: 13, color: "#3B3560", lineHeight: 1.5 }}>{l.action}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SanctionCards({ items }: { items: Array<{ color: string; icon: React.ReactNode; title: string; items: string[]; ref: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{
          padding: 16, borderRadius: 14,
          background: `${s.color}08`, border: `1px solid ${s.color}33`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${s.color}1A`, color: s.color,
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>{s.icon}</div>
            <div style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.title}</div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px 0", display: "flex", flexDirection: "column", gap: 4 }}>
            {s.items.map((it, j) => (
              <li key={j} style={{ fontSize: 12.5, color: "#3B3560", lineHeight: 1.5, paddingLeft: 14, position: "relative" }}>
                <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, borderRadius: "50%", background: s.color }} />
                {it}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: 10.5, color: s.color, fontWeight: 600, letterSpacing: "0.04em", borderTop: `1px dashed ${s.color}33`, paddingTop: 8 }}>{s.ref}</div>
        </div>
      ))}
    </div>
  );
}

function FeaturesList({ items }: { items: Array<{ icon: string; text: string }> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, textAlign: "left" }}>
      {items.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "12px 16px", borderRadius: 12,
          background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(109,94,246,0.10)",
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
          <div style={{ fontSize: 13.5, color: "#3B3560", lineHeight: 1.5 }}>{f.text}</div>
        </div>
      ))}
    </div>
  );
}
