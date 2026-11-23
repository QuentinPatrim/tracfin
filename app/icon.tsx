// app/icon.tsx — Favicon généré : le monogramme Klaris « Étiquette »

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="18" height="80" rx="9" fill="#0B1435" />
        <rect x="58" y="10.0" width="32" height="14" rx="7" fill="#2F5BFF" /><rect x="46" y="26.5" width="32" height="14" rx="7" fill="#5468FF" /><rect x="33" y="43.0" width="32" height="14" rx="7" fill="#9A6BEB" /><rect x="46" y="59.5" width="32" height="14" rx="7" fill="#EC6A93" /><rect x="58" y="76.0" width="32" height="14" rx="7" fill="#FF6A4D" />
      </svg>
    ),
    { ...size },
  );
}
