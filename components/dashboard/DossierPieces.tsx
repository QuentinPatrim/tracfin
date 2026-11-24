// components/dashboard/DossierPieces.tsx — Carte « Pièces reçues » de la fiche dossier
// Liste des pièces transmises par le client + lien vers l'archive complète (ZIP).

"use client";

import { ArrowUpRight, Package } from "lucide-react";
import type { DossierFile } from "@/lib/dossier-files";

interface Props {
  dossierId: string;
  files: DossierFile[];
}

export default function DossierPieces({ dossierId, files }: Props) {
  return (
    <div className="kd-card">
      {files.length === 0 ? (
        <div className="kd-empty">Aucune pièce justificative reçue.</div>
      ) : (
        <div className="kd-files">
          {files.map((f) => (
            <a key={f.key} href={f.url} target="_blank" rel="noreferrer noopener" className="kd-file">
              <span className="kd-ext">{f.ext.slice(0, 4)}</span>
              <span><b>{f.label}</b><small>Ouvrir dans un nouvel onglet</small></span>
              <ArrowUpRight width={16} height={16} />
            </a>
          ))}
        </div>
      )}
      <a href={`/api/dossiers/${dossierId}/zip`} className="kd-zip">
        <Package width={16} height={16} />
        <span>Tout télécharger en .zip<small style={{ display: "block", fontWeight: 600, color: "#8C7FC0" }}>Fiche, pièces et attestation</small></span>
      </a>
    </div>
  );
}
