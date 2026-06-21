// app/icon.tsx — Favicon généré (glyphe K, dégradé Iris)

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #7C3AED, #EC4899)",
          color: "#fff",
          fontSize: 22,
          fontWeight: 800,
          borderRadius: 7,
          fontFamily: "sans-serif",
        }}
      >
        K
      </div>
    ),
    { ...size },
  );
}
