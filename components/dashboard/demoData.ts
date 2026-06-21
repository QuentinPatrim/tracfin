// components/dashboard/demoData.ts — Données fictives pour le mode tutoriel
//
// Affichées uniquement pendant la visite guidée (clairement étiquetées
// « Mode démonstration »). Permettent à un nouvel utilisateur — qui n'a encore
// aucun dossier — de voir l'app « en situation » : KPIs remplis, dossiers de
// tous niveaux, pièces, etc. Aucune donnée réelle, rien en base.

import type { DossierItem } from "./DashboardClient";
import type { DossierFile } from "@/lib/dossier-files";

const now = "2026-05-20T10:00:00.000Z";

export const DEMO_DOSSIERS: DossierItem[] = [
  {
    id: "demo-1", nom_prenom: "Camille Rousseau", type_client: "physique", partie: "acquereur",
    algo_version: "v2", niveau: "vigilance_standard", statut: null, score_pct: 92,
    created_at: now, updated_at: now, kyc_status: "received",
  },
  {
    id: "demo-2", nom_prenom: "SCI Les Tilleuls", type_client: "morale", partie: "acquereur",
    algo_version: "v2", niveau: "vigilance_renforcee", statut: null, score_pct: 64,
    created_at: now, updated_at: now, kyc_status: "received",
  },
  {
    id: "demo-3", nom_prenom: "Marc Lefèvre", type_client: "physique", partie: "vendeur",
    algo_version: "v2", niveau: "vigilance_standard", statut: null, score_pct: 88,
    created_at: now, updated_at: now, kyc_status: "received",
  },
  {
    id: "demo-4", nom_prenom: "Nadia Benali", type_client: "physique", partie: "acquereur",
    algo_version: "v2", niveau: "examen_renforce", statut: null, score_pct: 38,
    created_at: now, updated_at: now, kyc_status: "received",
  },
  {
    id: "demo-5", nom_prenom: "Holding Varteg Ltd", type_client: "morale", partie: "acquereur",
    algo_version: "v2", niveau: "interdiction", statut: null, score_pct: 12,
    created_at: now, updated_at: now, kyc_status: "received",
  },
  {
    id: "demo-6", nom_prenom: "Julien Mercier", type_client: "physique", partie: "acquereur",
    algo_version: "v2", niveau: null, statut: null, score_pct: 0,
    created_at: now, updated_at: now, kyc_status: "sent",
  },
];

export const DEMO_COUNTS = {
  total: DEMO_DOSSIERS.length,
  conformes: 2,   // Camille + Marc
  vigilance: 1,   // SCI Les Tilleuls
  critique: 2,    // Nadia (examen) + Holding (interdiction)
};

function file(key: string, label: string, ext: string): DossierFile {
  return { key, label, url: "#", storageKey: null, ext, filename: `${key.toLowerCase()}.${ext}` };
}

// Pièces fictives par dossier (le panneau de droite les affiche).
export const DEMO_FILES: Record<string, DossierFile[]> = {
  "demo-1": [file("PIECE_IDENTITE", "Pièce d'identité", "jpg"), file("JUSTIF_DOMICILE", "Justificatif de domicile", "pdf")],
  "demo-2": [file("KBIS", "Extrait Kbis", "pdf"), file("STATUTS", "Statuts de la société", "pdf"), file("RBE", "Registre des bénéficiaires effectifs", "pdf")],
  "demo-3": [file("PIECE_IDENTITE", "Pièce d'identité", "jpg"), file("JUSTIF_DOMICILE", "Justificatif de domicile", "pdf")],
  "demo-4": [file("PIECE_IDENTITE", "Pièce d'identité", "jpg"), file("JUSTIF_ORIGINE_FONDS", "Justificatif d'origine des fonds", "pdf")],
  "demo-5": [file("KBIS", "Extrait Kbis", "pdf"), file("CNI_GERANT", "CNI du gérant", "jpg")],
  "demo-6": [],
};

/** ID du dossier sélectionné par défaut au lancement du tuto (un cas conforme). */
export const DEMO_DEFAULT_SELECTED = "demo-1";
