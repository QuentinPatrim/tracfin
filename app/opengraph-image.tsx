// app/opengraph-image.tsx — Carte de partage (lien envoyé par SMS, WhatsApp, LinkedIn…)
// Identité « Étiquette » (voir DESIGN.md) : fond clair, Plus Jakarta Sans 800, le K
// et ses cinq barres = les cinq obligations, dans l'ordre.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Klaris : chaque client identifié, chaque dossier prêt. LCB-FT pour les agences immobilières.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0B1435";
const BARS = [
  { off: 30, c: "#2F5BFF", ct: "#1F45E0", label: "Identifier le client" },
  { off: 18, c: "#5468FF", ct: "#3F50E6", label: "Évaluer le risque" },
  { off: 5, c: "#9A6BEB", ct: "#7B4FD6", label: "Conserver cinq ans" },
  { off: 18, c: "#EC6A93", ct: "#D2457A", label: "Déclarer un soupçon" },
  { off: 30, c: "#FF6A4D", ct: "#E5502F", label: "Justifier au contrôle" },
];
const LOGO_X = [58, 46, 33, 46, 58];

function Logo({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <rect x="10" y="10" width="18" height="80" rx="9" fill={INK} />
      {BARS.map((b, i) => (
        <rect key={i} x={LOGO_X[i]} y={10 + i * 16.5} width="32" height="14" rx="7" fill={b.c} />
      ))}
    </svg>
  );
}

export default async function OpengraphImage() {
  const [x800, x600] = await Promise.all([
    fetch(new URL("./_og/PlusJakartaSans-800.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./_og/PlusJakartaSans-600.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "58px 64px 56px 72px",
          backgroundColor: "#F5F7FF",
          backgroundImage:
            "radial-gradient(760px 520px at 100% 0%, rgba(47,91,255,0.16), rgba(47,91,255,0) 70%), radial-gradient(640px 440px at 0% 100%, rgba(255,106,77,0.13), rgba(255,106,77,0) 70%)",
          fontFamily: "Jakarta",
          color: INK,
        }}
      >
        {/* Colonne texte */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo s={58} />
            <div style={{ display: "flex", fontSize: 46, fontWeight: 800, letterSpacing: -2 }}>klaris</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>Chaque client</div>
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>identifié.</div>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 800,
                letterSpacing: -3,
                whiteSpace: "nowrap",
                lineHeight: 1.08,
                backgroundImage: "linear-gradient(100deg, #2F5BFF 0%, #7B63F2 42%, #EC6A93 72%, #FF6A4D 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Chaque dossier prêt.
            </div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 26, fontWeight: 600, color: "#47507A", lineHeight: 1.35 }}>
              LCB-FT pour les agences immobilières.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", height: 50, padding: "0 22px", borderRadius: 999, backgroundColor: "#2F5BFF", color: "#fff", fontSize: 23, fontWeight: 800 }}>
              klaris-app.fr
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "#6C7596" }}>14 jours d’essai, sans engagement</div>
          </div>
        </div>

        {/* Le K : les cinq obligations, une barre chacune, dans l'ordre */}
        <div
          style={{
            width: 432,
            display: "flex",
            position: "relative",
            borderRadius: 40,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 30px 60px -30px rgba(11,20,53,0.35)",
          }}
        >
          <div style={{ position: "absolute", left: 34, top: 92, width: 40, height: 332, borderRadius: 999, backgroundColor: INK, display: "flex" }} />
          {BARS.map((b, i) => {
            const top = 92 + i * 72;
            const left = 34 + 40 + 10 + b.off * 1.1;
            return (
              <div key={i} style={{ position: "absolute", top, left, height: 44, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 66, height: 44, borderRadius: 999, backgroundColor: b.c }} />
                <div style={{ display: "flex", fontSize: 24, fontWeight: 800, color: b.ct, letterSpacing: -0.6 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: x800, weight: 800, style: "normal" },
        { name: "Jakarta", data: x600, weight: 600, style: "normal" },
      ],
    },
  );
}
