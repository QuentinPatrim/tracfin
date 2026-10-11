// components/dashboard/DossierPieces.tsx — Bandeau pliable en haut de la page détail dossier
// Affiche les pièces justificatives + bouton "Télécharger le dossier complet (ZIP)"

"use client";

import { useState } from "react";
import { ChevronDown, FileBox, Package, FileDown } from "lucide-react";
import DocumentsList from "./DocumentsList";
import type { DossierFile } from "@/lib/dossier-files";

interface Props {
  dossierId: string;
  files: DossierFile[];
}

export default function DossierPieces({ dossierId, files }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(246,245,250,0.92)",
        backdropFilter: "blur(18px) saturate(170%)",
        WebkitBackdropFilter: "blur(18px) saturate(170%)",
        borderBottom: "1px solid rgba(109,94,246,0.10)",
        padding: "12px 24px",
      }}
    >
      <div style={{ maxWidth: 768, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            background: "transparent",
            border: 0,
            color: "#17123A",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, rgba(109,94,246,0.14), rgba(236,72,153,0.08))",
              border: "1px solid rgba(109,94,246,0.30)",
              display: "grid", placeItems: "center",
              color: "#5B46E0",
            }}
          >
            <FileBox width={15} height={15} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#17123A" }}>
              Pièces justificatives reçues
              <span style={{ color: "#9792B4", marginLeft: 6, fontWeight: 400 }}>
                · {files.length} fichier{files.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "#9792B4", marginTop: 2 }}>
              Cliquer pour {open ? "réduire" : "afficher"}
            </div>
          </div>
          <a
            href={`/api/dossiers/${dossierId}/zip`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6D5EF6, #A548D8 55%, #DB2777)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 1px 0 rgba(255,255,255,0.20) inset, 0 6px 16px rgba(109,94,246,0.35)",
            }}
          >
            <Package width={12} height={12} />
            Télécharger le dossier complet
          </a>
          <ChevronDown
            width={16}
            height={16}
            style={{
              color: "#9792B4",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {open && (
          <div style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 12,
            background: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(109,94,246,0.10)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset",
          }}>
            {files.length === 0 ? (
              <div style={{ padding: 12, textAlign: "center", color: "#9792B4", fontSize: 12.5 }}>
                Aucune pièce justificative reçue.
              </div>
            ) : (
              <DossierPiecesLight files={files} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Liste light des pièces, cohérent avec le TracfinForm light */
function DossierPiecesLight({ files }: { files: DossierFile[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
      {files.map((f) => (
        <a
          key={f.key}
          href={f.url}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "white",
            border: "1px solid rgba(23,18,58,0.08)",
            color: "#17123A",
            textDecoration: "none",
            transition: "background .12s, border-color .12s, box-shadow .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(109,94,246,0.04)";
            e.currentTarget.style.borderColor = "rgba(109,94,246,0.25)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(109,94,246,0.10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "rgba(23,18,58,0.08)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(109,94,246,0.10)",
              color: "#5B46E0",
              display: "grid", placeItems: "center",
              flexShrink: 0,
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            {f.ext.slice(0, 3)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#17123A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {f.label}
            </div>
            <div style={{ fontSize: 10, color: "#9792B4", marginTop: 1 }}>
              Cliquer pour ouvrir
            </div>
          </div>
          <FileDown width={12} height={12} style={{ color: "#9792B4", flexShrink: 0 }} />
        </a>
      ))}
    </div>
  );
}
