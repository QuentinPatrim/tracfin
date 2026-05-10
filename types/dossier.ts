// types/dossier.ts — Shape Postgres de la table `dossiers` (snake_case)

import type { StatutKeyV1, Niveau, PpeProche, AlgoLogEntry } from "@/lib/tracfin";

export interface Dossier {
  id: string;
  user_id: string;
  type_client: "physique" | "morale";
  nom_prenom: string;
  email_contact: string | null;

  // Identité
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  pays_nationalite: string | null;     // v2
  adresse: string | null;
  profession: string | null;
  comportement: string | null;
  secteur_activite: string | null;     // v2

  // Métadonnées dossier
  date_detection: string | null;
  lien_kyc: string | null;

  // Pièces
  piece_identite: boolean;
  justif_domicile: boolean;
  kbis: boolean;
  statuts: boolean;
  cni_gerant: boolean;

  // Sanctions / gates
  gel_avoirs: boolean | null;
  gel_date: string | null;
  sanctions_liste: boolean | null;     // v2 (colonne future si ajoutée)
  gel_avoirs_verifie_at: string | null;
  sanctions_check_at: string | null;

  // PPE
  ppe: boolean | null;
  ppe_proche_detecte: boolean | null;  // v2 — gate déclarative agent
  ppe_entourage: PpeProche[] | null;   // v2 — liste structurée (vide si juste boolean)

  // Risque géographique
  residence_fiscale: string | null;
  lieu_bien: string | null;            // v2

  // Risque transactionnel
  origine_fonds: string | null;
  justif_fonds: string | null;
  montage_financier: string | null;
  mode_paiement: string | null;        // v2
  coherence_prix: string | null;
  justif_prix: string | null;
  type_bien: string | null;            // v2
  montant_transaction: string | null;  // numeric → string en JS

  // Bénéficiaires effectifs
  rbe: string | null;

  // Conformité interne
  nom_employe: string | null;
  formation: string | null;
  responsable_lcbft: string | null;

  // Verdict
  algo_version: "v1" | "v2";           // v2 par défaut, v1 pour les anciens
  statut: StatutKeyV1 | null;          // legacy v1
  niveau: Niveau | null;               // v2
  score_pct: number | null;            // legacy v1
  algo_log: { triggers: AlgoLogEntry[] } | null;

  // KYC workflow
  kyc_status: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}
