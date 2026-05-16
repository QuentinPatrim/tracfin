// lib/dossier-files.ts — Helper pour lister les pièces justificatives d'un dossier
// Source : kyc_responses (URLs Cloudinary legacy ou storage_keys Scaleway)

export interface KycFilesRow {
  url_piece_identite: string | null;
  url_justif_domicile: string | null;
  url_avis_imposition: string | null;
  url_justif_revenus: string | null;
  url_justif_origine_fonds: string | null;
  url_kbis: string | null;
  url_statuts: string | null;
  url_cni_gerant: string | null;
  url_bilans: string | null;
  url_rbe: string | null;
}

export interface DossierFile {
  /** Identifiant logique (PIECE_IDENTITE, JUSTIF_DOMICILE…) */
  key: string;
  /** Libellé lisible affiché à l'utilisateur */
  label: string;
  /** URL d'accès final (route Next /api/files/... pour Scaleway, ou URL Cloudinary legacy) */
  url: string;
  /** Storage key Scaleway si applicable (null pour les URLs legacy) */
  storageKey: string | null;
  /** Extension détectée (pdf / jpg / png / …) */
  ext: string;
  /** Nom de fichier souhaité dans un download/zip */
  filename: string;
}

const FIELDS: Array<{ col: keyof KycFilesRow; key: string; label: string }> = [
  { col: "url_piece_identite",       key: "PIECE_IDENTITE",       label: "Pièce d'identité" },
  { col: "url_justif_domicile",      key: "JUSTIF_DOMICILE",      label: "Justificatif de domicile" },
  { col: "url_avis_imposition",      key: "AVIS_IMPOSITION",      label: "Avis d'imposition" },
  { col: "url_justif_revenus",       key: "JUSTIF_REVENUS",       label: "Justificatifs de revenus" },
  { col: "url_justif_origine_fonds", key: "JUSTIF_ORIGINE_FONDS", label: "Justificatif d'origine des fonds" },
  { col: "url_kbis",                 key: "KBIS",                 label: "Extrait Kbis" },
  { col: "url_statuts",              key: "STATUTS",              label: "Statuts de la société" },
  { col: "url_cni_gerant",           key: "CNI_GERANT",           label: "CNI du gérant" },
  { col: "url_bilans",               key: "BILANS",               label: "Bilans / liasses fiscales" },
  { col: "url_rbe",                  key: "RBE",                  label: "Registre des bénéficiaires effectifs (RBE)" },
];

function isLegacyUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function detectExt(value: string): string {
  // Storage key Scaleway : `<dossierId>/<timestamp>-<uuid>.<ext>`
  // URL Cloudinary : `https://.../upload/.../filename.pdf`
  const match = value.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return match?.[1] ?? "bin";
}

function fileLabel(key: string): string {
  return key.toLowerCase().replace(/_/g, "-");
}

/**
 * Construit la liste des pièces non-vides depuis une ligne kyc_responses.
 */
export function listDossierFiles(row: KycFilesRow): DossierFile[] {
  const out: DossierFile[] = [];
  for (const f of FIELDS) {
    const value = row[f.col];
    if (!value || !value.trim()) continue;
    const legacy = isLegacyUrl(value);
    const ext = detectExt(value);
    out.push({
      key: f.key,
      label: f.label,
      url: legacy ? value : `/api/files/${value}`,
      storageKey: legacy ? null : value,
      ext,
      filename: `${fileLabel(f.key)}.${ext}`,
    });
  }
  return out;
}
