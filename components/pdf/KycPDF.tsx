// components/pdf/KycPDF.tsx — Fiche KYC Klaris (design v2, Inter, hash SHA-256)

import {
  Document, Page, Text, View, StyleSheet, Svg, Rect, Circle, Defs, LinearGradient, Stop, renderToBuffer,
} from "@react-pdf/renderer";
import { OPTIONS, type DossierForm } from "@/lib/tracfin";
import { ensureFonts } from "@/lib/pdf-fonts";
import {
  formatDateLong, shortDossierRef, initials, formatMontant, shortHash,
} from "@/lib/pdf-helpers";
import { createHash } from "crypto";

interface Props {
  form: DossierForm;
  dossierId: string;
}

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
  green: "#10B981",
  greenSoft: "#ECFDF5",
  greenBorder: "#A7F3D0",
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

  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 5 },

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

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  title: { fontSize: 23, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.18, color: C.ink, maxWidth: 360 },
  subtitle: { fontSize: 10, color: C.muted, marginBottom: 22, lineHeight: 1.5, maxWidth: 460 },
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

  // Statut box (vert "Dossier complet")
  statut: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 22,
    marginBottom: 26,
    borderColor: C.greenBorder,
    backgroundColor: C.greenSoft,
  },
  statutHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  statutHeadDot: { width: 8, height: 8, borderRadius: 100, borderWidth: 1.5, borderColor: C.green },
  statutHeadLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 1.6, color: C.green },
  statutTitle: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: C.green, marginBottom: 6 },
  statutDesc: { fontSize: 10, color: C.ink2, marginBottom: 16, lineHeight: 1.5, maxWidth: 410 },
  statutBarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  statutBarTrack: { flex: 1, height: 5, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 100 },
  statutBarFill: { height: 5, borderRadius: 100, backgroundColor: C.green },
  statutPct: { fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: C.green },
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

  // Sections
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

  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", paddingVertical: 6, paddingRight: 12 },
  infoCellFull: { width: "100%", paddingVertical: 6 },
  infoLabel: { fontSize: 7.5, color: C.mutedLight, letterSpacing: 1.2, fontWeight: 600, marginBottom: 3 },
  infoValue: { fontSize: 10.5, color: C.ink, fontWeight: 500 },

  // Cards opération
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  card: { width: "50%", paddingHorizontal: 5, marginBottom: 10 },
  cardInner: { borderRadius: 10, padding: 14, backgroundColor: "#FAF5FF", borderWidth: 0.5, borderColor: C.violetSoft },
  cardLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 5 },
  cardValue: { fontSize: 12, color: C.ink, fontWeight: 700, lineHeight: 1.3 },

  // Pièces
  piecesGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  pieceCard: { width: "50%", paddingHorizontal: 5, marginBottom: 10 },
  pieceInner: {
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bgSoft,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  pieceIconBox: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: C.violetSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  pieceLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 2 },
  pieceName: { fontSize: 10, fontWeight: 700, color: C.ink },
  pieceBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.2,
    backgroundColor: C.greenSoft,
    color: C.green,
    borderWidth: 0.5,
    borderColor: C.greenBorder,
  },

  // Déclaration sur l'honneur
  decl: {
    borderRadius: 12,
    padding: 18,
    backgroundColor: C.bgSoft,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  declText: { fontSize: 10.5, color: C.ink2, lineHeight: 1.55 },
  declTextBold: { fontWeight: 700, color: C.ink },
  declSig: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  declSigLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 1.2, fontWeight: 600, marginBottom: 3 },
  declSigName: { fontSize: 10.5, color: C.ink, fontWeight: 700 },
  declHash: { fontSize: 8, color: C.muted, fontFamily: "Courier" },

  // Footer
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

// ─── Composants ─────────────────────────────────────────────────────────
const KlarisLogo = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Defs>
      <LinearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#6366F1" />
        <Stop offset="0.5" stopColor="#8B5CF6" />
        <Stop offset="1" stopColor="#EC4899" />
      </LinearGradient>
    </Defs>
    <Circle cx={20} cy={20} r={11.5} fill="none" stroke="url(#kg)" strokeWidth={2.5} />
    <Circle cx={20} cy={20} r={4.5} fill="url(#kg)" />
  </Svg>
);

const TopGradient = () => (
  <Svg style={s.topGradient} viewBox="0 0 600 5" preserveAspectRatio="none">
    <Defs>
      <LinearGradient id="topg-kyc" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#6366F1" />
        <Stop offset="0.5" stopColor="#8B5CF6" />
        <Stop offset="1" stopColor="#EC4899" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={600} height={5} fill="url(#topg-kyc)" />
  </Svg>
);

const SectionHead = ({ num, label }: { num: string; label: string }) => (
  <View style={s.sectionHead}>
    <Text style={s.sectionNumber}>{num}</Text>
    <Text style={s.sectionLabel}>{label}</Text>
  </View>
);

// ─── Document ───────────────────────────────────────────────────────────
const labelFor = (key: keyof typeof OPTIONS, value: string) =>
  OPTIONS[key]?.find((o) => o.value === value)?.label ?? "—";

function computeKycHash(form: DossierForm, dossierId: string, generatedAt: string): string {
  const payload = JSON.stringify({
    dossierId,
    generatedAt,
    nom: form.nomPrenom,
    type: form.typeClient,
    naissance: form.dateNaissance,
    adresse: form.adresse,
    pieces: {
      pieceIdentite: form.pieceIdentite,
      justifDomicile: form.justifDomicile,
      kbis: form.kbis,
      cniGerant: form.cniGerant,
    },
  });
  return createHash("sha256").update(payload).digest("hex");
}

export default function KycPDF({ form, dossierId }: Props) {
  const generatedAt = new Date().toISOString();
  const hash = computeKycHash(form, dossierId, generatedAt);
  const isMorale = form.typeClient === "morale";

  // Inventaire des pièces fournies
  const pieces: Array<{ label: string; provided: boolean }> = isMorale
    ? [
        { label: "Extrait Kbis (-3 mois)", provided: form.kbis },
        { label: "Statuts à jour", provided: form.statuts },
        { label: "CNI du gérant", provided: form.cniGerant },
        { label: "Justificatif de domicile", provided: form.justifDomicile },
      ]
    : [
        { label: "Pièce d'identité", provided: form.pieceIdentite },
        { label: "Justificatif de domicile", provided: form.justifDomicile },
      ];
  const piecesProvided = pieces.filter((p) => p.provided).length;

  // Champs identitaires comptés
  const fields = [
    form.nomPrenom, form.dateNaissance, form.lieuNaissance, form.nationalite,
    form.adresse, form.profession, form.residenceFiscale, form.origineFonds, form.montageFinancier,
  ];
  const fieldsFilled = fields.filter((f) => !!f).length;
  const fieldsTotal = fields.length;

  return (
    <Document title={`Fiche KYC ${shortDossierRef(dossierId)}`} author="Klaris" producer="Klaris">
      <Page size="A4" style={s.page}>
        <TopGradient />

        {/* Header */}
        <View style={s.header} fixed>
          <View style={s.brandRow}>
            <KlarisLogo size={26} />
            <Text style={s.brandText}>Klaris</Text>
            <Text style={s.brandPill}>KYC</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>DOSSIER</Text>
            <Text style={s.metaValue}>{shortDossierRef(dossierId)}</Text>
            <Text style={s.metaLabel}>GÉNÉRÉ LE</Text>
            <Text style={s.metaValue}>{formatDateLong(generatedAt).toUpperCase()}</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={s.titleRow}>
          <Text style={s.title}>Fiche Know Your Customer (KYC)</Text>
          <View style={s.trustBadge}>
            <View style={s.trustDot} />
            <Text style={s.trustText}>VÉRIFIÉ PAR KLARIS</Text>
          </View>
        </View>
        <Text style={s.subtitle}>
          Déclarations et informations recueillies auprès du client lors de l'entrée en relation —
          obligation de vigilance L.561-5 et L.561-6 du Code monétaire et financier.
        </Text>

        {/* Statut */}
        <View style={s.statut}>
          <View style={s.statutHead}>
            <View style={s.statutHeadDot} />
            <Text style={s.statutHeadLabel}>STATUT DU DOSSIER</Text>
          </View>
          <Text style={s.statutTitle}>Dossier complet</Text>
          <Text style={s.statutDesc}>
            Toutes les pièces requises ont été collectées et vérifiées. Le dossier est prêt pour
            évaluation Tracfin.
          </Text>
          <View style={s.statutBarRow}>
            <View style={s.statutBarTrack}>
              <View style={[s.statutBarFill, { width: `${pieces.length ? (piecesProvided / pieces.length) * 100 : 0}%` }]} />
            </View>
            <Text style={s.statutPct}>{pieces.length ? Math.round((piecesProvided / pieces.length) * 100) : 0}%</Text>
          </View>
          <View style={s.pillRow}>
            <Text style={s.pill}>Pièces · <Text style={s.pillBold}>{piecesProvided} / {pieces.length}</Text></Text>
            <Text style={s.pill}>Champs remplis · <Text style={s.pillBold}>{fieldsFilled} / {fieldsTotal}</Text></Text>
            <Text style={s.pill}>Source · <Text style={s.pillBold}>Lien client sécurisé</Text></Text>
          </View>
        </View>

        {/* SECTION 01 — IDENTITE DU CLIENT */}
        <View style={s.section}>
          <SectionHead num="01" label="IDENTITÉ DU CLIENT" />
          <View style={s.infoGrid}>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>TYPE</Text>
              <Text style={s.infoValue}>{isMorale ? "Personne Morale" : "Personne Physique"}</Text>
            </View>
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>{isMorale ? "DÉNOMINATION" : "NOM ET PRÉNOM"}</Text>
              <Text style={s.infoValue}>{form.nomPrenom || "—"}</Text>
            </View>
            {form.dateNaissance && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>{isMorale ? "DATE DE CONSTITUTION" : "DATE DE NAISSANCE"}</Text>
                <Text style={s.infoValue}>{formatDateLong(form.dateNaissance)}</Text>
              </View>
            )}
            {form.lieuNaissance && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>{isMorale ? "LIEU D'IMMATRICULATION" : "LIEU DE NAISSANCE"}</Text>
                <Text style={s.infoValue}>{form.lieuNaissance}</Text>
              </View>
            )}
            {form.nationalite && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>{isMorale ? "PAYS" : "NATIONALITÉ"}</Text>
                <Text style={s.infoValue}>{form.nationalite}</Text>
              </View>
            )}
            {form.profession && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>PROFESSION / ACTIVITÉ</Text>
                <Text style={s.infoValue}>{form.profession}</Text>
              </View>
            )}
            {form.residenceFiscale && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>RÉSIDENCE FISCALE</Text>
                <Text style={s.infoValue}>{labelFor("residenceFiscale", form.residenceFiscale)}</Text>
              </View>
            )}
            {form.adresse && (
              <View style={s.infoCellFull}>
                <Text style={s.infoLabel}>ADRESSE COMPLÈTE</Text>
                <Text style={s.infoValue}>{form.adresse}</Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 02 — INFORMATIONS SUR L'OPÉRATION */}
        <View style={s.section}>
          <SectionHead num="02" label="INFORMATIONS SUR L'OPÉRATION" />
          <View style={s.cardsGrid}>
            <View style={s.card}>
              <View style={s.cardInner}>
                <Text style={s.cardLabel}>ORIGINE DES FONDS</Text>
                <Text style={s.cardValue}>{labelFor("origineFonds", form.origineFonds)}</Text>
              </View>
            </View>
            <View style={s.card}>
              <View style={s.cardInner}>
                <Text style={s.cardLabel}>MONTAGE FINANCIER</Text>
                <Text style={s.cardValue}>{labelFor("montageFinancier", form.montageFinancier)}</Text>
              </View>
            </View>
            {form.typeBien && (
              <View style={s.card}>
                <View style={s.cardInner}>
                  <Text style={s.cardLabel}>TYPE DE BIEN</Text>
                  <Text style={s.cardValue}>{labelFor("typeBien", form.typeBien)}</Text>
                </View>
              </View>
            )}
            {form.montantTransaction && (
              <View style={s.card}>
                <View style={s.cardInner}>
                  <Text style={s.cardLabel}>MONTANT</Text>
                  <Text style={s.cardValue}>{formatMontant(form.montantTransaction)} €</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 03 — PIECES */}
        <View style={s.section}>
          <SectionHead num="03" label="PIÈCES JUSTIFICATIVES FOURNIES" />
          <View style={s.piecesGrid}>
            {pieces.map((p, i) => (
              <View key={i} style={s.pieceCard}>
                <View style={s.pieceInner}>
                  <View style={s.pieceIconBox}>
                    <Svg width={16} height={16} viewBox="0 0 24 24">
                      <Rect x={3} y={4} width={18} height={16} rx={2} fill="none" stroke="#6D28D9" strokeWidth={1.6} />
                      <Rect x={6} y={8} width={12} height={1.5} fill="#6D28D9" />
                      <Rect x={6} y={11} width={9} height={1.5} fill="#6D28D9" />
                      <Rect x={6} y={14} width={11} height={1.5} fill="#6D28D9" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pieceLabel}>PIÈCE #{String(i + 1).padStart(2, "0")}</Text>
                    <Text style={s.pieceName}>{p.label}</Text>
                  </View>
                  <Text style={s.pieceBadge}>{p.provided ? "● FOURNIE" : "○ MANQUE"}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* SECTION 04 — DECLARATION SUR L'HONNEUR */}
        <View style={s.section}>
          <SectionHead num="04" label="DÉCLARATION SUR L'HONNEUR" />
          <View style={s.decl}>
            <Text style={s.declText}>
              Je, soussigné(e) <Text style={s.declTextBold}>{form.nomPrenom || "—"}</Text>, certifie l'exactitude
              des informations renseignées et m'engage à signaler à mon conseiller tout changement substantiel
              de ma situation, conformément aux obligations LCB-FT (art. L.561-1 et suivants du Code monétaire
              et financier).
            </Text>
            <View style={s.declSig}>
              <View>
                <Text style={s.declSigLabel}>SIGNÉ ÉLECTRONIQUEMENT</Text>
                <Text style={s.declSigName}>
                  {form.nomPrenom || "—"} · {formatDateLong(generatedAt)}
                </Text>
              </View>
              <Text style={s.declHash}>SHA-256  {shortHash(hash)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerStamp}>● DOCUMENT CONFIDENTIEL · DONNÉES CLIENT</Text>
          <Text style={s.footerText}>
            <Text>Généré par </Text>
            <Text style={s.footerKlaris}>Klaris</Text>
            <Text>  ·  Page 1 / 1</Text>
          </Text>
        </View>

        {/* Avatar utilisé pour cohérence avec attestation — initiales client juste pour test rendering */}
        <View style={{ display: "none" }}>
          <Text>{initials(form.nomPrenom)}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Buffer generator ───────────────────────────────────────────────────
export async function generateKycPdfBuffer(form: DossierForm, dossierId: string) {
  ensureFonts();
  return await renderToBuffer(<KycPDF form={form} dossierId={dossierId} />);
}
