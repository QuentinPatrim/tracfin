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
        background: "#07080F",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
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
            color: "white",
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, rgba(99,102,241,0.20), rgba(168,85,247,0.10))",
              border: "1px solid rgba(168,85,247,0.35)",
              display: "grid", placeItems: "center",
              color: "#C4B5FD",
            }}
          >
            <FileBox width={15} height={15} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "white" }}>
              Pièces justificatives reçues
              <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 6, fontWeight: 400 }}>
                · {files.length} fichier{files.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
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
              background: "linear-gradient(135deg, #6366F1, #A855F7, #EC4899)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(168,85,247,0.40), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
          >
            <Package width={12} height={12} />
            Télécharger le dossier complet
          </a>
          <ChevronDown
            width={16}
            height={16}
            style={{
              color: "rgba(255,255,255,0.5)",
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
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {files.length === 0 ? (
              <div style={{ padding: 12, textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12.5 }}>
                Aucune pièce justificative reçue.
              </div>
            ) : (
              <DossierPiecesDark files={files} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Variante "dark" du listing pour matcher le fond sombre du TracfinForm */
function DossierPiecesDark({ files }: { files: DossierFile[] }) {
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
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            textDecoration: "none",
            transition: "background .12s, border-color .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(168,85,247,0.08)";
            e.currentTarget.style.borderColor = "rgba(168,85,247,0.30)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <div
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(168,85,247,0.15)",
              color: "#C4B5FD",
              display: "grid", placeItems: "center",
              flexShrink: 0,
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            {f.ext.slice(0, 3)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {f.label}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              Cliquer pour ouvrir
            </div>
          </div>
          <FileDown width={12} height={12} style={{ color: "rgba(255,255,255,0.40)", flexShrink: 0 }} />
        </a>
      ))}
    </div>
  );
}
