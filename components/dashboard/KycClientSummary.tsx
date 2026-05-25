// components/dashboard/KycClientSummary.tsx — Récap des données déclarées par le client
//
// Pourquoi : le DossierForm (côté agent) n'expose pas les champs spécifiques aux
// personnes morales (forme juridique, SIREN, BE structurés, activité principale,
// gérant), ni les détails fins de l'opération déclarée par le client (mode de
// financement, mode de paiement, origine des fonds + précisions, type pièce ID,
// numéro, expiration…). Ces données sont stockées dans `kyc_responses` et
// visibles dans la fiche KYC PDF, mais l'agent doit aussi pouvoir les consulter
// directement depuis la page détail du dossier pour vérifier les déclarations
// du client avant d'établir son analyse.
//
// Composant volontairement *read-only* : la source de vérité est la fiche KYC
// signée par le client, l'agent ne doit jamais la modifier après coup.

"use client";

import { useState } from "react";
import { ChevronDown, UserCheck, Building2, ScrollText, Wallet } from "lucide-react";
import {
  ORIGINE_FONDS_OPTIONS,
  MODE_FINANCEMENT_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
  TYPE_BIEN_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PAYS_OPTIONS,
  FORME_JURIDIQUE_OPTIONS,
  PIECE_IDENTITE_TYPES,
  TYPE_CONTROLE_BE_OPTIONS,
  type BeneficiaireEffectif,
} from "@/lib/kyc";

export interface KycSummaryData {
  typeClient: "physique" | "morale";
  partie: "vendeur" | "acquereur";

  // Contact
  emailContact: string | null;
  telephone: string | null;

  // Identité commune
  nomPrenom: string | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  nationalite: string | null;
  paysNationalite: string | null;
  adresse: string | null;
  profession: string | null;
  secteurActivite: string | null;
  paysResidenceFiscale: string | null;

  // Pièce d'identité (Arrêté 6 janvier 2021)
  pieceIdentiteType: string | null;
  pieceIdentiteNumero: string | null;
  pieceIdentiteExpiration: string | null;
  pieceIdentiteAutorite: string | null;

  // PPE étendue
  ppe: boolean | null;
  ppePrecisions: string | null;
  ppeProcheDetecte: boolean | null;
  ppeProchePrecisions: string | null;

  // Personne morale
  formeJuridique: string | null;
  siren: string | null;
  dateConstitution: string | null;
  activitePrincipale: string | null;
  nomGerant: string | null;
  beneficiairesEffectifs: BeneficiaireEffectif[];

  // Opération
  typeBien: string | null;
  lieuBien: string | null;
  montantOperation: string | null;
  origineFonds: string | null;
  origineFondsPrecisions: string | null;
  origineFondsVenteAdresse: string | null;
  origineFondsDonateur: string | null;
  origineFondsLienDefunt: string | null;
  modeFinancement: string | null;
  modePaiement: string | null;

  // Méta
  consentementRgpdAt: string | null;
  submittedAt: string | null;
}

interface Props {
  data: KycSummaryData;
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtMontant = (s: string | null): string => {
  if (!s) return "—";
  const n = Number(s);
  return isNaN(n) ? s : `${n.toLocaleString("fr-FR")} €`;
};

const has = (s: string | null | undefined): s is string => !!(s && s.trim());

function optLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | null,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function KycClientSummary({ data }: Props) {
  const [open, setOpen] = useState(false);
  const isMorale = data.typeClient === "morale";
  const isVendeur = data.partie === "vendeur";
  const roleLabel = isVendeur ? "Vendeur" : "Acquéreur";

  return (
    <div
      style={{
        maxWidth: 768,
        margin: "16px auto 0",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          borderRadius: 14,
          background: "white",
          border: "1px solid rgba(124,58,237,0.18)",
          boxShadow: "0 6px 18px rgba(124,58,237,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Header cliquable */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "14px 18px",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(236,72,153,0.10))",
              border: "1px solid rgba(124,58,237,0.30)",
              display: "grid", placeItems: "center",
              color: "#6d28d9",
              flexShrink: 0,
            }}
          >
            {isMorale ? <Building2 width={16} height={16} /> : <UserCheck width={16} height={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              Données déclarées par le client
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: isVendeur ? "rgba(124,58,237,0.10)" : "rgba(236,72,153,0.10)",
                  color: isVendeur ? "#6d28d9" : "#be185d",
                  border: `1px solid ${isVendeur ? "rgba(124,58,237,0.30)" : "rgba(236,72,153,0.30)"}`,
                }}
              >
                {roleLabel}
              </span>
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.04)",
                  color: "#64748b",
                  border: "1px solid rgba(15,23,42,0.10)",
                }}
              >
                {isMorale ? "Personne morale" : "Personne physique"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 3 }}>
              Source : fiche KYC signée le {fmtDate(data.consentementRgpdAt ?? data.submittedAt)} · lecture seule
            </div>
          </div>
          <ChevronDown
            width={16}
            height={16}
            style={{
              color: "#94a3b8",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}
          />
        </button>

        {open && (
          <div
            style={{
              borderTop: "1px solid rgba(124,58,237,0.10)",
              padding: 18,
              background: "rgba(250,250,255,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Identité */}
            <SummaryBlock
              icon={isMorale ? <Building2 width={13} height={13} /> : <UserCheck width={13} height={13} />}
              title={isMorale ? "Identité de la société" : "Identité du client"}
              items={
                isMorale
                  ? [
                      { k: "Dénomination", v: data.nomPrenom },
                      { k: "Forme juridique", v: optLabel(FORME_JURIDIQUE_OPTIONS, data.formeJuridique) },
                      { k: "SIREN", v: data.siren, mono: true },
                      { k: "Date de constitution", v: fmtDate(data.dateConstitution), mono: true },
                      { k: "Pays d'immatriculation", v: optLabel(PAYS_OPTIONS, data.paysNationalite) },
                      { k: "Activité principale", v: data.activitePrincipale, full: true },
                      { k: "Gérant / représentant légal", v: data.nomGerant, full: true },
                      { k: "Adresse du siège", v: data.adresse, full: true },
                      { k: "Email contact", v: data.emailContact, mono: true },
                      { k: "Téléphone", v: data.telephone, mono: true },
                    ]
                  : [
                      { k: "Nom et prénom", v: data.nomPrenom },
                      { k: "Date de naissance", v: fmtDate(data.dateNaissance), mono: true },
                      { k: "Lieu de naissance", v: data.lieuNaissance },
                      { k: "Nationalité", v: data.nationalite },
                      { k: "Pays (catégorie GAFI)", v: optLabel(PAYS_OPTIONS, data.paysNationalite) },
                      { k: "Profession", v: data.profession },
                      { k: "Secteur d'activité", v: optLabel(SECTEUR_ACTIVITE_OPTIONS, data.secteurActivite) },
                      { k: "Résidence fiscale", v: optLabel(PAYS_OPTIONS, data.paysResidenceFiscale) },
                      { k: "Adresse complète", v: data.adresse, full: true },
                      { k: "Email contact", v: data.emailContact, mono: true },
                      { k: "Téléphone", v: data.telephone, mono: true },
                    ]
              }
            />

            {/* Pièce d'identité */}
            {(has(data.pieceIdentiteType) || has(data.pieceIdentiteNumero)) && (
              <SummaryBlock
                icon={<ScrollText width={13} height={13} />}
                title="Pièce d'identité"
                items={[
                  { k: "Type", v: optLabel(PIECE_IDENTITE_TYPES, data.pieceIdentiteType) },
                  { k: "Numéro", v: data.pieceIdentiteNumero, mono: true },
                  { k: "Expiration", v: fmtDate(data.pieceIdentiteExpiration), mono: true },
                  ...(has(data.pieceIdentiteAutorite)
                    ? [{ k: "Autorité de délivrance", v: data.pieceIdentiteAutorite }]
                    : []),
                ]}
              />
            )}

            {/* Bénéficiaires effectifs (morale uniquement) */}
            {isMorale && data.beneficiairesEffectifs.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(124,58,237,0.15)",
                  background: "white",
                  borderRadius: 11,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 width={13} height={13} />
                  Bénéficiaires effectifs ({data.beneficiairesEffectifs.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.beneficiairesEffectifs.map((be, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 9,
                        background: "rgba(124,58,237,0.04)",
                        border: "1px solid rgba(124,58,237,0.12)",
                      }}
                    >
                      <div
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          background: "white",
                          border: "1px solid rgba(124,58,237,0.20)",
                          display: "grid", placeItems: "center",
                          color: "#6d28d9", fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                          {be.nom || "—"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>
                          {has(be.pctDetention) ? `${be.pctDetention}% du capital` : ""}
                          {has(be.pctDetention) && has(be.typeControle) ? " · " : ""}
                          {has(be.typeControle) ? optLabel(TYPE_CONTROLE_BE_OPTIONS, be.typeControle) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PPE */}
            {(data.ppe !== null || data.ppeProcheDetecte !== null) && (
              <SummaryBlock
                icon={<UserCheck width={13} height={13} />}
                title="Personne politiquement exposée (PPE)"
                items={[
                  {
                    k: isMorale ? "Représentant PPE ?" : "Client PPE ?",
                    v: data.ppe === null ? "Non renseigné" : data.ppe ? "Oui — vigilance renforcée" : "Non",
                  },
                  {
                    k: "Proche d'une PPE ?",
                    v: data.ppeProcheDetecte === null ? "Non renseigné" : data.ppeProcheDetecte ? "Oui — vigilance renforcée" : "Non",
                  },
                  ...(has(data.ppePrecisions)
                    ? [{ k: "Précisions sur la fonction", v: data.ppePrecisions, full: true }]
                    : []),
                  ...(has(data.ppeProchePrecisions)
                    ? [{ k: "Précisions sur le proche", v: data.ppeProchePrecisions, full: true }]
                    : []),
                ]}
              />
            )}

            {/* Opération */}
            <SummaryBlock
              icon={<Wallet width={13} height={13} />}
              title={isVendeur ? "Le bien vendu" : "L'opération immobilière"}
              items={[
                { k: "Type de bien", v: optLabel(TYPE_BIEN_OPTIONS, data.typeBien) },
                { k: "Adresse du bien", v: data.lieuBien, full: true },
                { k: isVendeur ? "Prix de vente" : "Montant", v: fmtMontant(data.montantOperation), mono: true },
                {
                  k: isVendeur ? "Origine du bien vendu" : "Origine principale des fonds",
                  v: optLabel(ORIGINE_FONDS_OPTIONS, data.origineFonds),
                },
                ...(!isVendeur
                  ? [
                      { k: "Mode de financement", v: optLabel(MODE_FINANCEMENT_OPTIONS, data.modeFinancement) },
                      { k: "Mode de paiement", v: optLabel(MODE_PAIEMENT_OPTIONS, data.modePaiement) },
                    ]
                  : []),
                ...(has(data.origineFondsPrecisions)
                  ? [{ k: "Précisions sur l'origine", v: data.origineFondsPrecisions, full: true }]
                  : []),
                ...(has(data.origineFondsVenteAdresse)
                  ? [{ k: isVendeur ? "Bien initial" : "Bien vendu (provenance des fonds)", v: data.origineFondsVenteAdresse, full: true }]
                  : []),
                ...(has(data.origineFondsDonateur)
                  ? [{ k: "Donateur", v: data.origineFondsDonateur, full: true }]
                  : []),
                ...(has(data.origineFondsLienDefunt)
                  ? [{ k: "Défunt (succession)", v: data.origineFondsLienDefunt, full: true }]
                  : []),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: Array<{ k: string; v: string | null; mono?: boolean; full?: boolean }>;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(124,58,237,0.15)",
        background: "white",
        borderRadius: 11,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#6d28d9",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon}
        {title}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px 18px",
        }}
      >
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              gridColumn: it.full ? "1 / -1" : undefined,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {it.k}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#0f172a",
                fontWeight: 500,
                wordBreak: "break-word",
                fontFamily: it.mono ? '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' : undefined,
              }}
            >
              {has(it.v ?? null) ? it.v : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
