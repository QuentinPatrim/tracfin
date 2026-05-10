// app/dashboard/[id]/page.tsx — Édition Tracfin (uniquement si KYC reçu)

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import TracfinForm from "@/components/tracfin/TracfinForm";
import type { Dossier } from "@/types/dossier";
import type { DossierForm } from "@/lib/tracfin";
import { rowToForm as dossierRowToForm } from "@/lib/dossier";

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
  pays_residence_fiscale: string | null;
  origine_fonds: string | null;
  origine_fonds_precisions: string | null;
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

  // Pré-remplit depuis le KYC (préserve les valeurs déjà saisies par l'agent)
  if (!base.nomPrenom?.trim() && kyc.nom_prenom) base.nomPrenom = kyc.nom_prenom;
  if (!base.dateNaissance && kyc.date_naissance) base.dateNaissance = toDateInput(kyc.date_naissance);
  if (!base.lieuNaissance && kyc.lieu_naissance) base.lieuNaissance = kyc.lieu_naissance;
  if (!base.nationalite && kyc.nationalite) base.nationalite = kyc.nationalite;
  if (!base.adresse && kyc.adresse) base.adresse = kyc.adresse;
  if (!base.profession && kyc.profession) base.profession = kyc.profession;

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

  // Récupère la dernière réponse KYC
  const kycRows = (await sql`
    SELECT kyc_version, email_contact, type_client, nom_prenom, date_naissance, lieu_naissance,
           nationalite, pays_nationalite, adresse, profession, secteur_activite,
           ppe, ppe_proche_detecte, ppe_precisions, ppe_proche_precisions,
           pays_residence_fiscale, origine_fonds, origine_fonds_precisions,
           mode_financement, mode_paiement, type_bien, lieu_bien, montant_operation,
           url_piece_identite, url_justif_domicile, url_kbis, url_statuts, url_cni_gerant
    FROM kyc_responses
    WHERE dossier_id = ${id}
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as KycRow[];

  if (kycRows.length === 0) {
    // Edge case : kyc_status='received' mais pas de réponse → redirect wait
    redirect(`/dashboard/${id}/wait`);
  }

  return <TracfinForm initialData={rowToForm(dossier, kycRows[0])} dossierId={id} hasKyc />;
}