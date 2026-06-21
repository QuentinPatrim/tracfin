import type { NextConfig } from "next";

// ─── Content-Security-Policy ────────────────────────────────────────────────
// On autorise explicitement les domaines de nos sous-traitants :
//
//  Clerk (auth) — variantes de domaines selon l'environnement et le setup :
//   - *.clerk.accounts.dev  : instance dev
//   - *.clerk.com           : prod CDN par défaut
//   - *.clerk.app           : prod hosted (autre format)
//   - *.lcl.dev             : dev tunneling Clerk
//   - clerk.klaris-app.fr   : custom CNAME prod si configuré (Frontend API)
//   - clerk-telemetry.com   : métriques Clerk
//
//  Stripe : js.stripe.com (JS), api.stripe.com (XHR), hooks.stripe.com (iframe),
//           checkout.stripe.com (form action), m.stripe.network (anti-fraude)
//
//  Scaleway S3 : *.s3.fr-par.scw.cloud + *.scw.cloud
//  Cloudinary (legacy uploads) : res.cloudinary.com
//  Vercel : *.vercel-insights.com
//
// 'unsafe-inline' sur style-src est tolérée car Tailwind 4 + components inline
// styles (gradient orbs, dashboard) en dépendent. 'unsafe-eval' sur script-src
// est requise par Clerk JS. À durcir progressivement (CSP nonces) en Vague 4.
const CLERK_DOMAINS = [
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://*.clerk.app",
  "https://*.lcl.dev",
  "https://clerk.klaris-app.fr",
  "https://clerk-telemetry.com",
  "https://*.clerk-telemetry.com",
].join(" ");

const STRIPE_DOMAINS = [
  "https://js.stripe.com",
  "https://api.stripe.com",
  "https://hooks.stripe.com",
  "https://m.stripe.network",
  "https://m.stripe.com",
].join(" ");

const STORAGE_DOMAINS = [
  "https://*.s3.fr-par.scw.cloud",
  "https://*.scw.cloud",
  "https://res.cloudinary.com",
].join(" ");

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${CLERK_DOMAINS} ${STRIPE_DOMAINS} https://challenges.cloudflare.com https://*.vercel-insights.com`,
  // fonts.googleapis.com : feuille @import des polices Inter/JetBrains utilisée par
  // l'APERÇU des PDF (routes /pdf-render/*/demo) — rendu fidèle au vrai document.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' data: blob: ${CLERK_DOMAINS} ${STORAGE_DOMAINS} https://img.clerk.com https://www.gravatar.com`,
  // fonts.gstatic.com : fichiers de polices chargés par l'aperçu PDF.
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${CLERK_DOMAINS} ${STRIPE_DOMAINS} ${STORAGE_DOMAINS} https://*.vercel-insights.com wss://*.clerk.com wss://*.clerk.accounts.dev`,
  `frame-src 'self' ${CLERK_DOMAINS} ${STRIPE_DOMAINS} https://challenges.cloudflare.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  // 'self' (et non 'none') pour autoriser notre propre iframe (tutoriel : aperçu
  // du parcours client via /kyc/demo). Le cross-origin reste bloqué (clickjacking).
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
