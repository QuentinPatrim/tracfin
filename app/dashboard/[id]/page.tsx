// app/dashboard/[id]/page.tsx — Édition Tracfin (uniquement si KYC reçu)

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import TracfinForm from "@/components/tracfin/TracfinForm";
import type { Dossier } from "@/types/dossier";
import { V1_TO_NIVEAU, type DossierForm, type Niveau } from "@/lib/tracfin";
import { rowToForm as dossierRowToForm } from "@/lib/dossier";
import { listDossierFiles, type KycFilesRow } from "@/lib/dossier-files";
import DossierPieces from "@/components/dashboard/DossierPieces";
import MarcheASuivre from "@/components/dashboard/MarcheASuivre";
import KycClientSummary, { type KycSummaryData } from "@/components/dashboard/KycClientSummary";
import type { BeneficiaireEffectif } from "@/lib/kyc";

function toDateInput(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return "";
}

interface KycRow {
  kyc_version: "v1" | "v2";
  email_contact: string | null;
  telephone: string | null;                 // v2
  type_client: string | null;
  nom_prenom: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  pays_nationalite: string | null;          // v2
  adresse: string | null;
  profession: string | null;
  secteur_activite: string | null;          // v2
  ppe: boolean | null;
  ppe_proche_detecte: boolean | null;       // v2
  ppe_precisions: string | null;            // v2
  ppe_proche_precisions: string | null;     // v2
  // Pièce d'identité (Arrêté 6 janvier 2021) — v2
  piece_identite_type: string | null;
  piece_identite_numero: string | null;
  piece_identite_expiration: string | null;
  piece_identite_autorite: string | null;
  // Personne morale — v2
  forme_juridique: string | null;
  siren: string | null;
  date_constitution: string | null;
  activite_principale: string | null;
  nom_gerant: string | null;
  beneficiaires_effectifs_json: BeneficiaireEffectif[] | string | null;
  // Données financières / opération
  pays_residence_fiscale: string | null;
  origine_fonds: string | null;
  origine_fonds_precisions: string | null;
  origine_fonds_vente_adresse: string | null; // v2
  origine_fonds_donateur: string | null;      // v2
  origine_fonds_lien_defunt: string | null;   // v2
  mode_financement: string | null;
  mode_paiement: string | null;             // v2
  type_bien: string | null;                 // v2
  lieu_bien: string | null;                 // v2 (adresse, libre)
  montant_operation: string | null;         // v2
  url_piece_identite: string | null;
  url_justif_domicile: string | null;
  url_kbis: string | null;
  url_statuts: string | null;
  url_cni_gerant: string | null;
  // Méta
  consentement_rgpd_at: string | null;
  submitted_at: string | null;
}

// Mapping KYC.origineFonds (libellé client) → tracfin.origineFonds (value scoring)
const KYC_TO_TRACFIN_ORIGINE: Record<string, string> = {
  epargne: "green_epargne",
  revenus: "green_revenus",
  heritage: "green_heritage",
  donation: "orange_donation",
  vente: "orange_vente",
  pret_familial: "orange_pret_fam",
  pret_bancaire: "green_epargne",
  autre: "",
};

const KYC_TO_TRACFIN_MONTAGE: Record<string, string> = {
  pret_bancaire: "green_pret",
  comptant: "orange_comptant",
  mixte: "green_pret",
  autre: "",
};

function rowToForm(row: Dossier, kyc: KycRow): Partial<DossierForm> {
  // ⚠️ Source unique de vérité du mapping DB → DossierForm : lib/dossier.ts.
  // Toute nouvelle colonne ajoutée doit être mappée là, pas ici. Cette fonction
  // ne fait QUE le pré-remplissage différentiel depuis la dernière réponse KYC.
  const base: Partial<DossierForm> = dossierRowToForm(row);
  const isMorale = kyc.type_client === "morale";

  // Pré-remplit depuis le KYC (préserve les valeurs déjà saisies par l'agent).
  // Pour une personne morale, le KYC v2 collecte des champs spécifiques
  // (date_constitution, activite_principale, nom_gerant, siren) qu'il faut
  // mapper sur les champs visuellement équivalents du DossierForm (dont
  // les libellés s'adaptent déjà via `isMorale` dans Step1).
  if (!base.nomPrenom?.trim() && kyc.nom_prenom) base.nomPrenom = kyc.nom_prenom;

  // dateNaissance ↔ date_constitution (morale) / date_naissance (physique)
  if (!base.dateNaissance) {
    const src = isMorale ? kyc.date_constitution : kyc.date_naissance;
    if (src) base.dateNaissance = toDateInput(src);
  }

  // lieuNaissance ↔ ville d'immatriculation (morale, via siren) / lieu_naissance (physique)
  // Le KYC v2 morale ne collecte pas un lieu d'immat distinct ; on n'a que le SIREN
  // qu'on n'utilise pas ici (visible dans KycClientSummary). On laisse vide pour morale.
  if (!base.lieuNaissance && !isMorale && kyc.lieu_naissance) {
    base.lieuNaissance = kyc.lieu_naissance;
  }

  // nationalite (libellé libre) : pour morale le KYC v2 stocke le pays comme value
  // catégorique dans pays_nationalite (ex: "green_fr"). On ne peut pas la remettre
  // telle quelle dans un input texte ; on laisse vide pour morale (la donnée
  // catégorique se retrouve dans paysNationalite ci-dessous, qui est un select).
  if (!base.nationalite && !isMorale && kyc.nationalite) {
    base.nationalite = kyc.nationalite;
  }

  if (!base.adresse && kyc.adresse) base.adresse = kyc.adresse;

  // profession ↔ activite_principale (morale) / profession (physique)
  if (!base.profession) {
    const src = isMorale ? kyc.activite_principale : kyc.profession;
    if (src) base.profession = src;
  }

  // PPE — propage le statut client + entourage (les 2 questions du KYC v2)
  if (base.ppe === null && kyc.ppe !== null) base.ppe = kyc.ppe;
  if (base.ppeProcheDetecte === null && kyc.ppe_proche_detecte !== null) {
    base.ppeProcheDetecte = kyc.ppe_proche_detecte;
  }

  // Pièces : si une URL est présente, la case agent est cochée
  if (kyc.url_piece_identite) base.pieceIdentite = true;
  if (kyc.url_justif_domicile) base.justifDomicile = true;
  if (kyc.url_kbis) base.kbis = true;
  if (kyc.url_statuts) base.statuts = true;
  if (kyc.url_cni_gerant) base.cniGerant = true;

  // Mappings catégoriques (KYC libellé client → scoring agent)
  if (!base.origineFonds && kyc.origine_fonds && KYC_TO_TRACFIN_ORIGINE[kyc.origine_fonds]) {
    base.origineFonds = KYC_TO_TRACFIN_ORIGINE[kyc.origine_fonds];
  }
  if (!base.montageFinancier && kyc.mode_financement && KYC_TO_TRACFIN_MONTAGE[kyc.mode_financement]) {
    base.montageFinancier = KYC_TO_TRACFIN_MONTAGE[kyc.mode_financement];
  }
  if (!base.justifFonds && kyc.origine_fonds_precisions) {
    base.justifFonds = kyc.origine_fonds_precisions;
  }

  // Champs v2 — values directement compatibles (mêmes énumérations dans kyc.ts et tracfin.ts)
  if (!base.paysNationalite && kyc.pays_nationalite) base.paysNationalite = kyc.pays_nationalite;
  if (!base.residenceFiscale && kyc.pays_residence_fiscale) {
    base.residenceFiscale = kyc.pays_residence_fiscale;
  }
  if (!base.secteurActivite && kyc.secteur_activite) base.secteurActivite = kyc.secteur_activite;
  if (!base.modePaiement && kyc.mode_paiement) base.modePaiement = kyc.mode_paiement;
  if (!base.typeBien && kyc.type_bien) base.typeBien = kyc.type_bien;
  if (!base.montantTransaction && kyc.montant_operation) {
    base.montantTransaction = kyc.montant_operation;
  }
  // lieu_bien (KYC v2) = adresse libre. L'agent doit choisir la catégorie GAFI dans Step2.
  // On ne l'auto-mappe pas : trop risqué de se tromper.

  return base;
}

export default async function EditDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return notFound();

  if (id === "nouveau" || !/^[0-9a-f-]{36}$/i.test(id)) return notFound();

  const rows = (await sql`
    SELECT * FROM dossiers WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `) as unknown as Dossier[];

  if (rows.length === 0) return notFound();
  const dossier = rows[0];

  // 🔒 Si KYC pas encore reçu → redirige vers la page d'attente
  if (dossier.kyc_status !== "received") {
    redirect(`/dashboard/${id}/wait`);
  }

  // Récupère la dernière réponse KYC (avec TOUTES les pièces pour DocumentsList étendu
  // + tous les champs morale / pièce identité / opération pour KycClientSummary).
  const kycRows = (await sql`
    SELECT kyc_version, email_contact, telephone, type_client, nom_prenom,
           date_naissance, lieu_naissance, nationalite, pays_nationalite,
           adresse, profession, secteur_activite,
           ppe, ppe_proche_detecte, ppe_precisions, ppe_proche_precisions,
           piece_identite_type, piece_identite_numero, piece_identite_expiration,
           piece_identite_autorite,
           forme_juridique, siren, date_constitution, activite_principale, nom_gerant,
           beneficiaires_effectifs_json,
           pays_residence_fiscale, origine_fonds, origine_fonds_precisions,
           origine_fonds_vente_adresse, origine_fonds_donateur, origine_fonds_lien_defunt,
           mode_financement, mode_paiement, type_bien, lieu_bien, montant_operation,
           url_piece_identite, url_justif_domicile, url_avis_imposition,
           url_justif_revenus, url_justif_origine_fonds,
           url_kbis, url_statuts, url_cni_gerant, url_bilans, url_rbe,
           consentement_rgpd_at, submitted_at
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as Array<KycRow & KycFilesRow>;

  if (kycRows.length === 0) {
    // Edge case : kyc_status='received' mais pas de réponse → redirect wait
    redirect(`/dashboard/${id}/wait`);
  }

  const files = listDossierFiles(kycRows[0]);
  const kyc = kycRows[0];

  // Résolution du niveau effectif (v2 prioritaire, sinon mapping v1)
  const niveauEffectif: Niveau | null =
    dossier.algo_version === "v2"
      ? dossier.niveau
      : dossier.statut
      ? V1_TO_NIVEAU[dossier.statut]
      : null;

  // Bénéficiaires effectifs : la colonne peut renvoyer string JSON ou array selon le driver
  let beneficiairesEffectifs: BeneficiaireEffectif[] = [];
  const beRaw = kyc.beneficiaires_effectifs_json;
  if (beRaw) {
    try {
      const parsed = typeof beRaw === "string" ? JSON.parse(beRaw) : beRaw;
      if (Array.isArray(parsed)) beneficiairesEffectifs = parsed as BeneficiaireEffectif[];
    } catch { /* malformé → array vide */ }
  }

  const summary: KycSummaryData = {
    typeClient: kyc.type_client === "morale" ? "morale" : "physique",
    partie: dossier.partie === "vendeur" ? "vendeur" : "acquereur",
    emailContact: kyc.email_contact,
    telephone: kyc.telephone,
    nomPrenom: kyc.nom_prenom,
    dateNaissance: kyc.date_naissance,
    lieuNaissance: kyc.lieu_naissance,
    nationalite: kyc.nationalite,
    paysNationalite: kyc.pays_nationalite,
    adresse: kyc.adresse,
    profession: kyc.profession,
    secteurActivite: kyc.secteur_activite,
    paysResidenceFiscale: kyc.pays_residence_fiscale,
    pieceIdentiteType: kyc.piece_identite_type,
    pieceIdentiteNumero: kyc.piece_identite_numero,
    pieceIdentiteExpiration: kyc.piece_identite_expiration,
    pieceIdentiteAutorite: kyc.piece_identite_autorite,
    ppe: kyc.ppe,
    ppePrecisions: kyc.ppe_precisions,
    ppeProcheDetecte: kyc.ppe_proche_detecte,
    ppeProchePrecisions: kyc.ppe_proche_precisions,
    formeJuridique: kyc.forme_juridique,
    siren: kyc.siren,
    dateConstitution: kyc.date_constitution,
    activitePrincipale: kyc.activite_principale,
    nomGerant: kyc.nom_gerant,
    beneficiairesEffectifs,
    typeBien: kyc.type_bien,
    lieuBien: kyc.lieu_bien,
    montantOperation: kyc.montant_operation,
    origineFonds: kyc.origine_fonds,
    origineFondsPrecisions: kyc.origine_fonds_precisions,
    origineFondsVenteAdresse: kyc.origine_fonds_vente_adresse,
    origineFondsDonateur: kyc.origine_fonds_donateur,
    origineFondsLienDefunt: kyc.origine_fonds_lien_defunt,
    modeFinancement: kyc.mode_financement,
    modePaiement: kyc.mode_paiement,
    consentementRgpdAt: kyc.consentement_rgpd_at,
    submittedAt: kyc.submitted_at,
  };

  return (
    <div style={{ background: "#fafaff", minHeight: "100vh" }}>
      <DossierPieces dossierId={id} files={files} />
      <KycClientSummary data={summary} />
      {niveauEffectif && (
        <div style={{ maxWidth: 768, margin: "24px auto 0", padding: "0 24px" }}>
          <MarcheASuivre
            niveau={niveauEffectif}
            dossierId={id}
            clientName={dossier.nom_prenom}
            partie={dossier.partie === "vendeur" ? "vendeur" : "acquereur"}
            mode="full"
          />
        </div>
      )}
      <TracfinForm initialData={rowToForm(dossier, kyc)} dossierId={id} hasKyc />
    </div>
  );
}