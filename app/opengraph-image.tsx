// app/opengraph-image.tsx — Carte de partage social (générée à la volée, next/og)

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Klaris — Conformité LCB-FT, sans stress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: "72px 80px",
          backgroundColor: "#0A0712",
          backgroundImage:
            "radial-gradient(1100px 500px at 12% -10%, rgba(109,94,246,0.45), transparent), radial-gradient(900px 500px at 110% 120%, rgba(236,72,153,0.32), transparent)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #7C3AED, #EC4899)",
              color: "#fff",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>
            Klaris
          </div>
        </div>

        {/* Titre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: "#F8FAFC" }}>
            Tracez vos dossiers KYC&nbsp;
            <span style={{ color: "#C4B5FD" }}>comme l'exige la loi.</span>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.66)" }}>
            Conformité LCB-FT · Souveraineté UE · Attestations opposables
          </div>
        </div>

        {/* Pied : 3 accents */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { t: "Scoring LCB-FT v2", c: "#A78BFA" },
            { t: "KYC sans friction", c: "#F9A8D4" },
            { t: "100% hébergé UE", c: "#5EEAD4" },
          ].map((chip) => (
            <div
              key={chip.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
                fontSize: 24,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: chip.c, display: "flex" }} />
              {chip.t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
