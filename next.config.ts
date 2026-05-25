import type { NextConfig } from "next";

// ─── Content-Security-Policy ────────────────────────────────────────────────
// On autorise explicitement :
//  - Clerk (auth) : *.clerk.accounts.dev, *.clerk.com, frontend api
//  - Stripe (checkout / portail / JS) : js.stripe.com, m.stripe.network, api.stripe.com
//  - Scaleway S3 (pièces) : *.s3.fr-par.scw.cloud
//  - Vercel : *.vercel-insights.com (web analytics)
//  - data: pour les SVG inline du logo + images base64
//
// 'unsafe-inline' sur style-src est tolérée car Tailwind 4 + components inline
// styles (gradient orbs, dashboard) en dépendent. 'unsafe-eval' sur script-src
// est requise par Clerk JS en dev/prod selon les version. À durcir progressivement.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com https://*.s3.fr-par.scw.cloud https://*.scw.cloud https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com https://*.s3.fr-par.scw.cloud https://*.scw.cloud https://*.vercel-insights.com",
  "frame-src 'self' https://*.clerk.com https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS — appliqué par Vercel en prod aussi, on durcit ici.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Permissions-Policy minimaliste : on n'utilise ni géoloc, ni micro, ni caméra,
  // ni paiement (Stripe est en iframe sandbox, pas via l'API Payment Request).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
