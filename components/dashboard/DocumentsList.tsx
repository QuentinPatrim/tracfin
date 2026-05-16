// components/dashboard/DocumentsList.tsx — Liste des pièces justificatives (compact ou étendu)

import { FileText, Image as ImageIcon, FileDown, ExternalLink, FileX } from "lucide-react";
import type { DossierFile } from "@/lib/dossier-files";

interface Props {
  files: DossierFile[];
  mode?: "compact" | "expanded";
}

function iconFor(ext: string) {
  const e = ext.toLowerCase();
  if (e === "pdf") return FileText;
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(e)) return ImageIcon;
  return FileX;
}

export default function DocumentsList({ files, mode = "compact" }: Props) {
  if (files.length === 0) {
    return (
      <div
        style={{
          padding: 14,
          background: "rgba(124,58,237,0.04)",
          border: "1px dashed rgba(124,58,237,0.20)",
          borderRadius: 10,
          color: "#64748b",
          fontSize: 12.5,
          textAlign: "center",
        }}
      >
        Aucune pièce justificative reçue pour ce dossier.
      </div>
    );
  }

  if (mode === "compact") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {files.map((f) => {
          const Icon = iconFor(f.ext);
          return (
            <a
              key={f.key}
              href={f.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 9,
                border: "1px solid rgba(124,58,237,0.10)",
                background: "rgba(255,255,255,0.6)",
                textDecoration: "none",
                color: "inherit",
                transition: "background .12s, border-color .12s, transform .12s",
                fontSize: 12.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,58,237,0.06)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.10)";
              }}
            >
              <div
                style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: "rgba(124,58,237,0.10)",
                  color: "#7c3aed",
                  display: "grid", placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon width={13} height={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>{f.ext}</div>
              </div>
              <ExternalLink width={12} height={12} style={{ color: "#94a3b8" }} />
            </a>
          );
        })}
      </div>
    );
  }

  // ─── Mode étendu : cards avec icône grande + actions ──
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
      {files.map((f) => {
        const Icon = iconFor(f.ext);
        return (
          <div
            key={f.key}
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(124,58,237,0.10)",
              background: "rgba(255,255,255,0.7)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 12px -6px rgba(124,58,237,0.10)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: "rgba(124,58,237,0.10)",
                  color: "#7c3aed",
                  display: "grid", placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon width={17} height={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>{f.label}</div>
                <div style={{ fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                  Fichier .{f.ext}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  flex: 1, textAlign: "center",
                  padding: "7px 10px", borderRadius: 8,
                  background: "rgba(124,58,237,0.08)",
                  color: "#7c3aed",
                  fontWeight: 600, fontSize: 11.5,
                  textDecoration: "none",
                  border: "1px solid rgba(124,58,237,0.18)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <ExternalLink width={11} height={11} />
                Ouvrir
              </a>
              <a
                href={f.url}
                download={f.filename}
                style={{
                  flex: 1, textAlign: "center",
                  padding: "7px 10px", borderRadius: 8,
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600, fontSize: 11.5,
                  textDecoration: "none",
                  border: "1px solid #ebebf2",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <FileDown width={11} height={11} />
                Télécharger
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
