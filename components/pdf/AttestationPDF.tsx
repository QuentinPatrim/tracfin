// components/pdf/AttestationPDF.tsx — Attestation LCB-FT Klaris (design v2, Inter, 2 pages, hash SHA-256)

import {
  Document, Page, Text, View, StyleSheet, Svg, Rect, Circle, Defs, LinearGradient, Stop, renderToBuffer,
} from "@react-pdf/renderer";
import {
  OPTIONS, RISK_LABELS, NIVEAU_CFG,
  type DossierForm, type ScoreResult, type Niveau,
} from "@/lib/tracfin";
import { ensureFonts } from "@/lib/pdf-fonts";
import {
  computeContentHash, shortHash, formatDateLong, shortDossierRef,
  initials, formatMontant,
} from "@/lib/pdf-helpers";

interface Props {
  form: DossierForm;
  score: ScoreResult;
  dossierId: string;
}

// ─── Palette (refs maquette Klaris) ─────────────────────────────────────
const C = {
  ink: "#0F172A",
  ink2: "#1F2937",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  border: "#E5E7EB",
  borderSoft: "#F1F5F9",
  bgSoft: "#F8FAFC",
  violet: "#8B5CF6",
  violetSoft: "#EDE9FE",
  violetText: "#6D28D9",
  // Niveaux
  green: "#10B981", greenSoft: "#ECFDF5", greenBorder: "#A7F3D0",
  orange: "#F59E0B", orangeSoft: "#FFFBEB", orangeBorder: "#FCD34D",
  red: "#DC2626", redSoft: "#FEF2F2", redBorder: "#FECACA",
  black: "#111827", blackSoft: "#F3F4F6", blackBorder: "#9CA3AF",
};

const NIVEAU_PAINT: Record<Niveau, { color: string; soft: string; border: string }> = {
  vigilance_standard: { color: C.green, soft: C.greenSoft, border: C.greenBorder },
  vigilance_renforcee: { color: C.orange, soft: C.orangeSoft, border: C.orangeBorder },
  examen_renforce: { color: C.red, soft: C.redSoft, border: C.redBorder },
  interdiction: { color: C.black, soft: C.blackSoft, border: C.blackBorder },
};

const RISK_PAINT = {
  green: { color: C.green, soft: C.greenSoft, border: C.greenBorder, label: "CONFORME" },
  orange: { color: C.orange, soft: C.orangeSoft, border: C.orangeBorder, label: "VIGILANCE" },
  red: { color: C.red, soft: C.redSoft, border: C.redBorder, label: "CRITIQUE" },
};

// ─── Styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontFamily: "Inter",
    color: C.ink,
    fontSize: 10,
    lineHeight: 1.45,
  },

  topGradient: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 5,
  },

  // Header (logo + brand + meta)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 32,
    paddingBottom: 16,
    marginBottom: 22,
    borderBottomWidth: 1.5,
    borderBottomColor: C.ink,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandText: { fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: C.ink },
  brandPill: {
    marginLeft: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    backgroundColor: C.violetSoft,
    color: C.violetText,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.5,
  },
  metaBlock: { alignItems: "flex-end" },
  metaLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 1.4, fontWeight: 500, marginBottom: 1 },
  metaValue: { fontSize: 10.5, fontWeight: 700, color: C.ink, marginBottom: 6 },

  // Title
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  title: {
    fontSize: 23,
    fontWeight: 800,
    letterSpacing: -0.6,
    lineHeight: 1.18,
    color: C.ink,
    maxWidth: 360,
  },
  subtitle: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 22,
    lineHeight: 1.5,
    maxWidth: 460,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.violetSoft,
    backgroundColor: "#FAF5FF",
  },
  trustDot: { width: 5, height: 5, borderRadius: 100, backgroundColor: C.violet },
  trustText: { fontSize: 7.5, color: C.violetText, fontWeight: 700, letterSpacing: 1.2 },

  // Verdict box
  verdict: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 22,
    marginBottom: 26,
  },
  verdictHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  verdictHeadDot: { width: 8, height: 8, borderRadius: 100, borderWidth: 1.5 },
  verdictHeadLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 1.6 },
  verdictTitle: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 },
  verdictDesc: { fontSize: 10, color: C.ink2, marginBottom: 16, lineHeight: 1.5, maxWidth: 410 },
  verdictBarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  verdictBarTrack: { flex: 1, height: 5, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 100 },
  verdictBarFill: { height: 5, borderRadius: 100 },
  verdictPct: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    fontSize: 8,
    color: C.muted,
    fontWeight: 500,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 0.5,
    borderColor: C.border,
  },
  pillBold: { color: C.ink, fontWeight: 700 },

  // Section
  section: { marginBottom: 22 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  sectionNumber: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: C.violetSoft,
    color: C.violetText,
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  sectionLabel: { fontSize: 9, color: C.violetText, fontWeight: 700, letterSpacing: 1.6 },

  // Info cells (identification)
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", paddingVertical: 6, paddingRight: 12 },
  infoCellFull: { width: "100%", paddingVertical: 6 },
  infoLabel: { fontSize: 7.5, color: C.mutedLight, letterSpacing: 1.2, fontWeight: 600, marginBottom: 3 },
  infoValue: { fontSize: 10.5, color: C.ink, fontWeight: 500 },

  // Critère row
  critereRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderSoft,
  },
  critereNum: {
    width: 28,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: C.border,
    color: C.muted,
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    marginRight: 12,
  },
  critereTexts: { flex: 1 },
  critereName: { fontSize: 10.5, fontWeight: 600, color: C.ink },
  critereSub: { fontSize: 8.5, color: C.muted, marginTop: 1.5 },
  critereBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 100,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    borderWidth: 0.5,
  },

  // Cards (page 2 — analyse transaction)
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  card: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  cardInner: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#FAF5FF",
    borderWidth: 0.5,
    borderColor: C.violetSoft,
  },
  cardLabel: {
    fontSize: 7.5,
    color: C.muted,
    letterSpacing: 1.2,
    fontWeight: 600,
    marginBottom: 5,
  },
  cardValue: { fontSize: 12, color: C.ink, fontWeight: 700, lineHeight: 1.3 },
  cardValueDim: { fontWeight: 500, color: C.muted, fontSize: 11 },

  // Recommandation box
  recoBox: {
    borderRadius: 12,
    padding: 18,
    backgroundColor: C.violetSoft,
    borderWidth: 0.5,
    borderColor: "#DDD6FE",
  },
  recoLabel: {
    fontSize: 8,
    color: C.violetText,
    fontWeight: 800,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  recoText: { fontSize: 10.5, color: C.ink, lineHeight: 1.55, marginBottom: 12 },

  // Signatures
  sigGrid: { flexDirection: "row", gap: 12 },
  sigCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: C.bgSoft,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  sigLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 8 },
  sigRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  sigName: { fontSize: 11, fontWeight: 700, color: C.ink },
  sigRole: { fontSize: 8.5, color: C.muted, marginTop: 1 },
  sigMeta: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigMetaText: { fontSize: 7.5, color: C.muted, fontWeight: 500 },

  // Footer fixe
  footer: {
    position: "absolute",
    bottom: 24, left: 50, right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  footerStamp: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.bgSoft,
    color: C.muted,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    borderRadius: 6,
  },
  footerText: { fontSize: 7.5, color: C.muted, letterSpacing: 0.5 },
  footerKlaris: { color: C.violetText, fontWeight: 700 },
});

// ─── SVG Klaris ─────────────────────────────────────────────────────────
const KlarisLogo = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="kl-grad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#6366F1" />
        <Stop offset="0.5" stopColor="#8B5CF6" />
        <Stop offset="1" stopColor="#EC4899" />
      </LinearGradient>
    </Defs>
    <Circle cx={20} cy={20} r={11.5} fill="none" stroke="url(#kl-grad)" strokeWidth={2.5} />
    <Circle cx={20} cy={20} r={4.5} fill="url(#kl-grad)" />
  </Svg>
);

const TopGradient = () => (
  <Svg style={s.topGradient} viewBox="0 0 600 5" preserveAspectRatio="none">
    <Defs>
      <LinearGradient id="topg" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#6366F1" />
        <Stop offset="0.5" stopColor="#8B5CF6" />
        <Stop offset="1" stopColor="#EC4899" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={600} height={5} fill="url(#topg)" />
  </Svg>
);

const Avatar = ({ name, size = 28 }: { name: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id={`av-${name}`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#8B5CF6" />
        <Stop offset="1" stopColor="#A855F7" />
      </LinearGradient>
    </Defs>
    <Circle cx={20} cy={20} r={20} fill={`url(#av-${name})`} />
  </Svg>
);

// ─── Composants de page ─────────────────────────────────────────────────
const Header = ({ subBadge, dossierId, generatedAt }: {
  subBadge: string;
  dossierId: string;
  generatedAt: string;
}) => (
  <View style={s.header} fixed>
    <View style={s.brandRow}>
      <KlarisLogo size={26} />
      <Text style={s.brandText}>Klaris</Text>
      <Text style={s.brandPill}>{subBadge.toUpperCase()}</Text>
    </View>
    <View style={s.metaBlock}>
      <Text style={s.metaLabel}>DOSSIER</Text>
      <Text style={s.metaValue}>{shortDossierRef(dossierId)}</Text>
      <Text style={s.metaLabel}>ÉMIS LE</Text>
      <Text style={s.metaValue}>{formatDateLong(generatedAt).toUpperCase()}</Text>
    </View>
  </View>
);

const SectionHead = ({ num, label }: { num: string; label: string }) => (
  <View style={s.sectionHead}>
    <Text style={s.sectionNumber}>{num}</Text>
    <Text style={s.sectionLabel}>{label}</Text>
  </View>
);

const Footer = ({ pageLabel, hash }: { pageLabel: string; hash: string }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerStamp}>● DOCUMENT CONFIDENTIEL · LCB-FT</Text>
    <Text style={s.footerText}>
      <Text style={{ fontFamily: "Courier" }}>SHA-256 {shortHash(hash)}</Text>
      <Text>  ·  Généré par </Text>
      <Text style={s.footerKlaris}>Klaris</Text>
      <Text>  ·  {pageLabel}</Text>
    </Text>
  </View>
);

// ─── Données dérivées du score / form ───────────────────────────────────
function critereRows(form: DossierForm, score: ScoreResult) {
  const order = [
    "rbe", "residenceFiscale", "paysNationalite", "lieuBien", "comportement",
    "origineFonds", "montageFinancier", "modePaiement", "coherencePrix",
    "typeBien", "secteurActivite", "formation",
  ] as const;

  const rows: Array<{ name: string; sub: string; risk: "green" | "orange" | "red" }> = [];
  for (const k of order) {
    const r = score.risks[k];
    if (!r) continue;
    const opt = OPTIONS[k]?.find((o) => o.value === form[k as keyof DossierForm]);
    rows.push({
      name: RISK_LABELS[k] ?? k,
      sub: opt?.label ?? "—",
      risk: r,
    });
  }

  // Gates sanctions / gel
  if (score.gelCritique) {
    rows.push({ name: "Gel des avoirs", sub: "Personne sous gel — Règl. (UE) 2580/2001", risk: "red" });
  }
  if (form.sanctionsListe === true) {
    rows.push({ name: "Sanctions internationales", sub: "Présence sur liste UE / ONU / Trésor", risk: "red" });
  }
  if (score.ppeVigilance) {
    rows.push({ name: "Personne politiquement exposée", sub: "Vigilance renforcée — L.561-10 1°", risk: "orange" });
  }

  return rows;
}

// ─── Document principal ─────────────────────────────────────────────────
export default function AttestationPDF({ form, score, dossierId }: Props) {
  const generatedAt = new Date().toISOString();
  const hash = computeContentHash(form, score, dossierId, generatedAt);
  const cfg = NIVEAU_CFG[score.niveau];
  const paint = NIVEAU_PAINT[score.niveau];
  const niveauIndex = (["vigilance_standard", "vigilance_renforcee", "examen_renforce", "interdiction"] as const).indexOf(score.niveau) + 1;
  const rows = critereRows(form, score);
  const critiques = rows.filter(r => r.risk === "red").length;

  return (
    <Document title={`Attestation LCB-FT ${shortDossierRef(dossierId)}`} author="Klaris" producer="Klaris">
      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 1 ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        <TopGradient />
        <Header subBadge="Attestation" dossierId={dossierId} generatedAt={generatedAt} />

        <View style={s.titleRow}>
          <Text style={s.title}>Attestation de Conformité LCB-FT</Text>
          <View style={s.trustBadge}>
            <View style={s.trustDot} />
            <Text style={s.trustText}>VÉRIFIÉ PAR KLARIS</Text>
          </View>
        </View>
        <Text style={s.subtitle}>
          Évaluation des risques de blanchiment de capitaux et de financement du terrorisme — analyse
          automatisée sur {Object.values(score.risks).filter(Boolean).length} critères réglementaires
          (CMF L.561-1 et suivants).
        </Text>

        {/* Verdict box */}
        <View style={[s.verdict, { borderColor: paint.color, backgroundColor: paint.soft }]}>
          <View style={s.verdictHead}>
            <View style={[s.verdictHeadDot, { borderColor: paint.color }]} />
            <Text style={[s.verdictHeadLabel, { color: paint.color }]}>
              VERDICT DE CONFORMITÉ · NIVEAU {niveauIndex} / 4
            </Text>
          </View>
          <Text style={[s.verdictTitle, { color: paint.color }]}>{cfg.label}</Text>
          <Text style={s.verdictDesc}>{cfg.action}</Text>

          <View style={s.verdictBarRow}>
            <View style={s.verdictBarTrack}>
              <View style={[s.verdictBarFill, { width: `${score.pct}%`, backgroundColor: paint.color }]} />
            </View>
            <Text style={[s.verdictPct, { color: paint.color }]}>{score.pct}%</Text>
          </View>

          <View style={s.pillRow}>
            <Text style={s.pill}>{rows.length} critères évalués · <Text style={s.pillBold}>{critiques} critique{critiques > 1 ? "s" : ""}</Text></Text>
            <Text style={s.pill}>Référence légale · <Text style={s.pillBold}>{cfg.ref}</Text></Text>
            <Text style={s.pill}>Algorithme · <Text style={s.pillBold}>Klaris {score.algoVersion.toUpperCase()}</Text></Text>
          </View>
        </View>

        {/* SECTION 01 — IDENTIFICATION */}
        <View style={s.section}>
          <SectionHead num="01" label="IDENTIFICATION DU CLIENT" />
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>TYPE DE CLIENT</Text>
              <Text style={s.infoValue}>{form.typeClient === "morale" ? "Personne Morale" : "Personne Physique"}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>{form.typeClient === "morale" ? "DÉNOMINATION" : "NOM ET PRÉNOM"}</Text>
              <Text style={s.infoValue}>{form.nomPrenom || "—"}</Text>
            </View>
            {form.dateNaissance && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>{form.typeClient === "morale" ? "DATE DE CONSTITUTION" : "DATE DE NAISSANCE"}</Text>
                <Text style={s.infoValue}>{formatDateLong(form.dateNaissance)}</Text>
              </View>
            )}
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>RÉFÉRENCE DOSSIER</Text>
              <Text style={s.infoValue}>{shortDossierRef(dossierId)}</Text>
            </View>
            {form.nationalite && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>{form.typeClient === "morale" ? "PAYS" : "NATIONALITÉ"}</Text>
                <Text style={s.infoValue}>{form.nationalite}</Text>
              </View>
            )}
            {form.profession && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>PROFESSION / ACTIVITÉ</Text>
                <Text style={s.infoValue}>{form.profession}</Text>
              </View>
            )}
            {form.adresse && (
              <View style={s.infoCellFull}>
                <Text style={s.infoLabel}>ADRESSE</Text>
                <Text style={s.infoValue}>{form.adresse}</Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 02 — DETAIL DES CRITERES */}
        <View style={s.section}>
          <SectionHead num="02" label="DETAIL DES CRITÈRES DE RISQUE" />
          {rows.map((r, i) => {
            const p = RISK_PAINT[r.risk];
            return (
              <View key={`${r.name}-${i}`} style={s.critereRow} wrap={false}>
                <Text style={s.critereNum}>{String(i + 1).padStart(2, "0")}</Text>
                <View style={s.critereTexts}>
                  <Text style={s.critereName}>{r.name}</Text>
                  <Text style={s.critereSub}>{r.sub}</Text>
                </View>
                <Text style={[s.critereBadge, { backgroundColor: p.soft, color: p.color, borderColor: p.border }]}>
                  ● {p.label}
                </Text>
              </View>
            );
          })}
        </View>

        <Footer pageLabel="Page 1 / 2" hash={hash} />
      </Page>

      {/* ━━━━━━━━━━━━━━━━━━━ PAGE 2 ━━━━━━━━━━━━━━━━━━━ */}
      <Page size="A4" style={s.page}>
        <TopGradient />
        <Header subBadge="Attestation · Suite" dossierId={dossierId} generatedAt={generatedAt} />

        {/* SECTION 03 — ANALYSE DE LA TRANSACTION */}
        <View style={s.section}>
          <SectionHead num="03" label="ANALYSE DE LA TRANSACTION" />
          <View style={s.cardsGrid}>
            <Card label="ORIGINE DES FONDS" value={labelOf(form, "origineFonds")} />
            <Card label="MONTAGE FINANCIER" value={labelOf(form, "montageFinancier")} />
            <Card label="MODE DE PAIEMENT" value={labelOf(form, "modePaiement")} />
            <Card label="COHÉRENCE DU PRIX" value={labelOf(form, "coherencePrix")} />
            <Card label="TYPE DE BIEN" value={labelOf(form, "typeBien")} />
            <Card
              label="MONTANT"
              value={form.montantTransaction ? `${formatMontant(form.montantTransaction)} €` : "—"}
            />
            <Card label="LIEU DU BIEN" value={form.lieuBien || "—"} dim />
            <Card label="BÉNÉFICIAIRES EFFECTIFS" value={labelOf(form, "rbe")} />
          </View>
        </View>

        {/* SECTION 04 — RECOMMANDATION */}
        <View style={s.section}>
          <SectionHead num="04" label="RECOMMANDATION DE L'ALGORITHME" />
          <View style={s.recoBox}>
            <Text style={s.recoLabel}>● ACTION REQUISE</Text>
            <Text style={s.recoText}>{cfg.action}</Text>
            <View style={s.pillRow}>
              <Text style={s.pill}>Niveau · <Text style={[s.pillBold, { color: paint.color }]}>{cfg.label}</Text></Text>
              <Text style={s.pill}>Référence · <Text style={s.pillBold}>{cfg.ref}</Text></Text>
              {(score.niveau === "examen_renforce" || score.niveau === "interdiction") && (
                <Text style={s.pill}>Délai légal · <Text style={s.pillBold}>48h (DS TRACFIN)</Text></Text>
              )}
            </View>
          </View>
        </View>

        {/* SECTION 05 — VALIDATION */}
        <View style={s.section}>
          <SectionHead num="05" label="VALIDATION" />
          <View style={s.sigGrid}>
            <View style={s.sigCard}>
              <Text style={s.sigLabel}>● VALIDÉ PAR</Text>
              <View style={s.sigRow}>
                <Avatar name={initials(form.nomEmploye)} size={32} />
                <View>
                  <Text style={s.sigName}>{form.nomEmploye || "—"}</Text>
                  <Text style={s.sigRole}>Agent en charge</Text>
                </View>
              </View>
              <View style={s.sigMeta}>
                <Text style={s.sigMetaText}>Signature électronique</Text>
                <Text style={s.sigMetaText}>{formatDateLong(generatedAt)}</Text>
              </View>
            </View>
            <View style={s.sigCard}>
              <Text style={s.sigLabel}>● RESPONSABLE LCB-FT</Text>
              <View style={s.sigRow}>
                <Avatar name={initials(form.responsableLCBFT)} size={32} />
                <View>
                  <Text style={s.sigName}>{form.responsableLCBFT || "—"}</Text>
                  <Text style={s.sigRole}>Compliance Officer</Text>
                </View>
              </View>
              <View style={s.sigMeta}>
                <Text style={s.sigMetaText}>Signature électronique</Text>
                <Text style={s.sigMetaText}>{formatDateLong(generatedAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        <Footer pageLabel="Page 2 / 2" hash={hash} />
      </Page>
    </Document>
  );
}

// ─── Helpers internes ───────────────────────────────────────────────────
function labelOf(form: DossierForm, key: keyof typeof OPTIONS): string {
  const v = form[key as keyof DossierForm] as string;
  return OPTIONS[key]?.find((o) => o.value === v)?.label ?? "—";
}

function Card({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  return (
    <View style={s.card}>
      <View style={s.cardInner}>
        <Text style={s.cardLabel}>{label}</Text>
        <Text style={dim ? [s.cardValue, s.cardValueDim] : s.cardValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Buffer generator (appelé depuis la route API) ──────────────────────
export async function generateAttestationPdfBuffer(
  form: DossierForm,
  score: ScoreResult,
  dossierId: string
) {
  ensureFonts();
  return await renderToBuffer(<AttestationPDF form={form} score={score} dossierId={dossierId} />);
}

/** Calcul autonome du hash sans générer le PDF (pour stockage en DB) */
export function computeAttestationHash(
  form: DossierForm,
  score: ScoreResult,
  dossierId: string,
  generatedAt: string = new Date().toISOString()
): string {
  return computeContentHash(form, score, dossierId, generatedAt);
}
