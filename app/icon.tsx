// app/icon.tsx — Favicon généré : le monogramme Klaris (voir components/ui/KlarisLogo)

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="k" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7B6CFF" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="46" height="46" rx="11" fill="#121118" />
        <rect x="12.5" y="11.5" width="5.2" height="25" rx="1.2" fill="#FFFFFF" />
        <path d="M32.6 11.5H38.6L26.1 24L38.6 36.5H32.6L20.1 24Z" fill="#FFFFFF" />
        <rect x="18.35" y="21.75" width="4.5" height="4.5" rx="0.6" transform="rotate(45 20.6 24)" fill="url(#k)" />
      </svg>
    ),
    { ...size },
  );
}
