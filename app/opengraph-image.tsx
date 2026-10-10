// app/opengraph-image.tsx — Carte de partage social (générée à la volée, next/og)
// Identité « Papier & encre » : champ d'encre, logo en aplat, échelle de vigilance.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Klaris : vos dossiers LCB-FT en ordre, sans stress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { n: "1", label: "Vigilance standard", c: "#1E9E6A", w: 300, fg: "#fff" },
  { n: "2", label: "Vigilance renforcée", c: "#E3A008", w: 350, fg: "#2A1D00" },
  { n: "3", label: "Examen renforcé", c: "#DD6B20", w: 400, fg: "#fff" },
  { n: "4", label: "Interdiction", c: "#C5302C", w: 450, fg: "#fff" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          backgroundColor: "#1E1657",
          fontFamily: "sans-serif",
        }}
      >
        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#5B46E0",
              color: "#fff",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", color: "#F4F2FF", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>
            Klaris
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          {/* Titre */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 600 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.03, color: "#F4F2FF" }}>
              Vos dossiers LCB-FT en ordre, sans stress.
            </div>
            <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, color: "rgba(244,242,255,0.76)" }}>
              Pour les agences immobilières. 14 jours gratuits.
            </div>
          </div>

          {/* Échelle de vigilance */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BARS.map((b) => (
              <div
                key={b.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: b.w,
                  height: 58,
                  padding: "0 20px",
                  backgroundColor: b.c,
                  color: b.fg,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                <div style={{ display: "flex" }}>{b.label}</div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>{b.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
