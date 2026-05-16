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
        background: "rgba(15,23,42,0.45)",
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
          border: "1px solid rgba(15,23,42,0.10)",
          color: "#334155",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
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
          border: "1px solid rgba(124,58,237,0.18)",
          overflow: "hidden",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 80px -20px rgba(124,58,237,0.40), 0 12px 40px -8px rgba(15,23,42,0.12)",
        }}
      >
        {/* halos ambient */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 20 }}>
          <div style={{ position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.20), transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)", filter: "blur(60px)" }} />
        </div>

        {/* Top accent bar gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, #7C3AED, #A855F7, #EC4899)",
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
            borderTop: "1px solid rgba(124,58,237,0.10)",
            background: "rgba(250,250,255,0.6)",
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
                    ? "linear-gradient(90deg, #7C3AED, #EC4899)"
                    : i < step
                      ? "rgba(124,58,237,0.45)"
                      : "rgba(15,23,42,0.10)",
                  cursor: "pointer",
                  transition: "width 0.25s, background 0.25s",
                }}
              />
            ))}
            <span style={{ marginLeft: 12, fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
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
    background: "linear-gradient(135deg, #7C3AED, #A855F7, #EC4899)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px rgba(124,58,237,0.30)",
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.10)",
    color: "#334155",
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
      <div style={iconCircle("#7C3AED")}>
        <BookOpen width={28} height={28} color="white" />
      </div>
      <Eyebrow color="#7C3AED">Bienvenue dans Klaris</Eyebrow>
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
      <Eyebrow color="#7C3AED">Module 01 · Contexte</Eyebrow>
      <H1>D'où vient la LCB-FT ?</H1>
      <P>
        La lutte contre le blanchiment est un effort <strong>mondial</strong>, coordonné depuis 35 ans.
        Les agents immobiliers y sont intégrés en France depuis 2004.
      </P>
      <Timeline items={[
        { year: "1989", color: "#7C3AED", title: "Création du GAFI", desc: "Groupe d'Action Financière, organisme international piloté par le G7 pour fixer les standards anti-blanchiment." },
        { year: "1991", color: "#7C3AED", title: "1ʳᵉ directive UE", desc: "Premier cadre européen contre l'utilisation du système financier aux fins de blanchiment." },
        { year: "2001", color: "#A855F7", title: "Post 11-Septembre", desc: "Renforcement mondial pour lutter contre le financement du terrorisme (CFT)." },
        { year: "2004", color: "#A855F7", title: "Agents immobiliers assujettis", desc: "Article L.561-2 17° du Code monétaire et financier : vous êtes intégré au dispositif." },
        { year: "2018", color: "#EC4899", title: "5ᵉ directive UE", desc: "Registre des bénéficiaires effectifs (RBE), PPE étendue à l'entourage." },
        { year: "2020", color: "#EC4899", title: "6ᵉ directive UE", desc: "Harmonisation des sanctions pénales contre le blanchiment dans toute l'UE." },
        { year: "2024", color: "#F43F5E", title: "Paquet AML 2024", desc: "Règlement (UE) 2024/1624 + création de l'AMLA (autorité européenne unique). Application progressive jusqu'en 2027." },
      ]} />
    </div>
  ),

  // ─── 3) POURQUOI VOUS ─────────────────────────────────────────────────
  (
    <div key="why-you">
      <Eyebrow color="#7C3AED">Module 02 · Votre rôle</Eyebrow>
      <H1>Pourquoi êtes-vous concerné ?</H1>
      <P>
        L'immobilier est un véhicule privilégié de blanchiment : montants élevés, opacité possible des
        montages, biens facilement revendables. Vous êtes en <strong>première ligne</strong>.
      </P>
      <Stats items={[
        { value: "15%", label: "des sommes blanchies en France passent par l'immobilier", src: "Rapport TRACFIN 2023" },
        { value: "2004", label: "année où vous êtes devenus assujettis", src: "Art. L.561-2 17° CMF" },
        { value: "5 ans", label: "obligation de conservation des dossiers KYC", src: "Art. L.561-12-1 CMF" },
      ]} />
      <Callout color="#7C3AED" icon={<ShieldCheck width={18} height={18} />}>
        <strong>Votre mission :</strong> être les « yeux et oreilles » de Bercy <em>avant</em> que l'argent
        douteux ne soit lessivé via la pierre. Identifier, vérifier, signaler.
      </Callout>
    </div>
  ),

  // ─── 4) 5 OBLIGATIONS ─────────────────────────────────────────────────
  (
    <div key="obligations">
      <Eyebrow color="#7C3AED">Module 03 · Vos obligations</Eyebrow>
      <H1>Vos 5 obligations clés</H1>
      <P>
        Tout est codifié dans le Code monétaire et financier, articles L.561-1 à L.561-50.
        Voici l'essentiel :
      </P>
      <CardsGrid items={[
        {
          n: "01",
          color: "#7C3AED",
          icon: <CheckCircle2 width={18} height={18} />,
          title: "Identifier votre client",
          desc: "Pièce d'identité + justif de domicile (PP) ou Kbis + statuts + bénéficiaire effectif (PM ≥ 25 % capital).",
          ref: "L.561-5",
        },
        {
          n: "02",
          color: "#A855F7",
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
          ref: "L.561-12-1",
        },
        {
          n: "04",
          color: "#F43F5E",
          icon: <Scale width={18} height={18} />,
          title: "Désigner un déclarant",
          desc: "Nommer un correspondant et un déclarant TRACFIN pour votre agence, et les enregistrer auprès du service TRACFIN.",
          ref: "L.561-30",
        },
        {
          n: "05",
          color: "#7C3AED",
          icon: <BookOpen width={18} height={18} />,
          title: "Former vos équipes",
          desc: "Procédures internes écrites + sensibilisation régulière des collaborateurs aux risques LCB-FT.",
          ref: "L.561-32",
        },
      ]} />
    </div>
  ),

  // ─── 5) 4 NIVEAUX KLARIS — QUE FAIRE ? ────────────────────────────────
  (
    <div key="levels">
      <Eyebrow color="#7C3AED">Module 04 · Réflexes</Eyebrow>
      <H1>Les 4 niveaux Klaris : que faire ?</H1>
      <P>
        Klaris analyse chaque dossier sur 13 critères réglementaires et vous indique le niveau de
        vigilance à appliquer. Voici les actions concrètes pour chaque cas :
      </P>
      <LevelRows items={[
        {
          color: "#059669", bgColor: "#ecfdf5", bdColor: "#a7f3d0",
          dot: "🟢",
          name: "Vigilance standard",
          ref: "CMF L.561-5 à L.561-8",
          action: "Traiter normalement. Conserver le dossier complet pendant 5 ans.",
        },
        {
          color: "#d97706", bgColor: "#fffbeb", bdColor: "#fde68a",
          dot: "🟠",
          name: "Vigilance renforcée",
          ref: "CMF L.561-10",
          action: "Collecter des justificatifs additionnels (origine fonds, RBE détaillé). Faire valider par le correspondant LCB-FT avant signature.",
        },
        {
          color: "#dc2626", bgColor: "#fef2f2", bdColor: "#fecaca",
          dot: "🔴",
          name: "Examen renforcé",
          ref: "CMF L.561-10-2",
          action: "Suspendre immédiatement la transaction. Délibération formalisée avec votre responsable LCB-FT. Décision motivée avant toute reprise.",
        },
        {
          color: "#0f172a", bgColor: "#f3f4f6", bdColor: "#9ca3af",
          dot: "⚫",
          name: "Interdiction & déclaration",
          ref: "CMF L.561-15 + Règl. (UE) 2024/1624",
          action: "Refus de relation d'affaires. Déclaration de soupçon TRACFIN obligatoire via ERMES sous 48 h.",
        },
      ]} />
    </div>
  ),

  // ─── 6) SANCTIONS ─────────────────────────────────────────────────────
  (
    <div key="sanctions">
      <Eyebrow color="#DC2626">Module 05 · Risques</Eyebrow>
      <H1>Sanctions en cas de manquement</H1>
      <P>
        L'autorité de contrôle pour les agents immobiliers est la <strong>DGCCRF</strong>
        (Direction générale de la concurrence, consommation et répression des fraudes).
        Les manquements peuvent cumuler sanctions disciplinaires, pécuniaires et pénales.
      </P>
      <SanctionCards items={[
        {
          color: "#d97706", icon: <FileWarning width={18} height={18} />,
          title: "Disciplinaire",
          items: ["Avertissement", "Blâme", "Mise sous astreinte"],
          ref: "Art. L.561-36 CMF",
        },
        {
          color: "#dc2626", icon: <Scale width={18} height={18} />,
          title: "Pécuniaire",
          items: [
            "Jusqu'à 1 M€ (personne physique)",
            "Jusqu'à 5 M€ ou 10 % du CA annuel (personne morale)",
            "Interdiction temporaire d'exercer",
          ],
          ref: "Art. L.561-36-3 CMF",
        },
        {
          color: "#0f172a", icon: <Gavel width={18} height={18} />,
          title: "Pénale",
          items: [
            "Jusqu'à 5 ans de prison",
            "Jusqu'à 375 000 € d'amende",
            "Confiscation des biens",
          ],
          ref: "Art. 324-1 Code pénal",
        },
      ]} />
      <Callout color="#DC2626" icon={<AlertTriangle width={18} height={18} />}>
        <strong>La bonne foi ne suffit pas.</strong> En cas de contrôle DGCCRF, vous devez pouvoir produire votre cartographie des risques, vos procédures internes, la traçabilité de la vigilance, et les justificatifs de chaque dossier — sur 5 ans.
      </Callout>
    </div>
  ),

  // ─── 7) KLARIS VOUS AIDE ─────────────────────────────────────────────
  (
    <div key="klaris-helps" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
      <div style={iconCircle("#10B981")}>
        <Sparkles width={28} height={28} color="white" />
      </div>
      <Eyebrow color="#10B981">Vous êtes prêt</Eyebrow>
      <H1>Klaris fait le gros du travail pour vous</H1>
      <P>
        À chaque dossier, l'application applique automatiquement les bons réflexes réglementaires.
      </P>
      <FeaturesList items={[
        { icon: "🔍", text: "Scoring automatique sur 13 critères CMF v2 (algorithme reproductible et auditable)" },
        { icon: "🔒", text: "Pièces conservées 5 ans, chiffrées (TLS 1.3 + AES-256), hébergées en France (Scaleway Paris)" },
        { icon: "📄", text: "PDF Attestation + Fiche KYC signés avec hash SHA-256, prêts à archiver" },
        { icon: "🌍", text: "Liens directs vers les outils officiels : Open Sanctions + ERMES TRACFIN" },
        { icon: "⚖️", text: "Mentions légales (L.561-1+, L.561-10, L.561-12-1, L.561-15) automatiquement intégrées aux PDFs" },
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
      margin: "0 0 16px 0", color: "#0f172a",
      backgroundImage: "linear-gradient(90deg, #0f172a 0%, #4c1d95 60%, #7c3aed 100%)",
      WebkitBackgroundClip: "text", backgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}>{children}</h1>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 14.5, lineHeight: 1.6, color: "#334155",
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
      background: "rgba(124,58,237,0.06)",
      border: "1px solid rgba(124,58,237,0.18)",
      color: "#5b21b6", fontSize: 12.5, lineHeight: 1.5,
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
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#334155" }}>{children}</div>
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
            <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{it.title}</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
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
          background: "linear-gradient(180deg, rgba(124,58,237,0.06), rgba(236,72,153,0.03))",
          border: "1px solid rgba(124,58,237,0.15)",
        }}>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1,
            backgroundImage: "linear-gradient(135deg, #7c3aed, #ec4899)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 6, fontVariantNumeric: "tabular-nums",
          }}>{s.value}</div>
          <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.45 }}>{s.label}</div>
          <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>{s.src}</div>
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
          border: "1px solid rgba(124,58,237,0.10)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 12px -6px rgba(124,58,237,0.10)",
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
          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5, marginBottom: 4 }}>{c.title}</div>
          <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, marginBottom: 8 }}>{c.desc}</div>
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
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{l.action}</div>
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
              <li key={j} style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.5, paddingLeft: 14, position: "relative" }}>
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
          border: "1px solid rgba(124,58,237,0.10)",
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
          <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.5 }}>{f.text}</div>
        </div>
      ))}
    </div>
  );
}
