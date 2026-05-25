// proxy.ts — Middleware Clerk + canonisation du domaine
//
// Deux responsabilités :
// 1. Rediriger toute requête arrivant sur l'URL Vercel auto-générée
//    (ex: tracfin-mu.vercel.app) vers le domaine canonique klaris-app.fr.
//    Sans ça : les cookies Clerk sont posés sur klaris-app.fr → les pages
//    sur le domaine *.vercel.app ne trouvent jamais la session → boucle infinie
//    /sign-in?redirect_url=… (ERR_TOO_MANY_REDIRECTS).
// 2. Filtrer les routes publiques (pas d'auth requise) avant que Clerk
//    n'impose `auth.protect()`.

import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Domaine canonique du service (production). Source : lib/legal.ts (EDITEUR.siteUrl).
// ⚠️ Doit correspondre EXACTEMENT au "Primary Domain" configuré côté Vercel,
// sinon le 308 ci-dessous est suivi d'un 307 Vercel et la chaîne est plus longue.
const CANONICAL_HOST = "www.klaris-app.fr";

// Hôtes considérés comme non canoniques en production. On les redirige tous vers
// CANONICAL_HOST pour qu'il n'existe qu'un seul lieu où les cookies Clerk vivent.
function isNonCanonicalHost(host: string): boolean {
  if (host === CANONICAL_HOST) return false;
  // URL Vercel auto-générée (ex: tracfin-mu.vercel.app, branches preview…)
  if (host.endsWith(".vercel.app")) return true;
  // Apex sans www (klaris-app.fr → www.klaris-app.fr)
  if (host === "klaris-app.fr") return true;
  return false;
}

const isPublicRoute = createRouteMatcher([
  // Landing & pages publiques
  "/",
  "/tarifs",
  "/abonnement",
  "/confiance",
  "/securite",
  "/legal/(.*)",
  // Auth Clerk (sign-in / sign-up hébergés par Clerk via routes catch-all)
  "/sign-in(.*)",
  "/sign-up(.*)",
  // API publiques nécessaires sans auth
  "/api/checkout",
  "/api/webhooks/(.*)",
  // Routes KYC publiques (accessibles sans authentification, token signé en URL)
  "/kyc/(.*)",
  "/api/kyc/(.*)",
  // Upload / download de pièces : auth gérée dans la route (Clerk OU token KYC)
  "/api/upload",
  "/api/files/(.*)",
  // Lookup Pappers : auth gérée dans la route (Clerk OU token KYC pour le
  // pré-remplissage côté client public)
  "/api/pappers/(.*)",
  // Endpoints cron Vercel : protégés par CRON_SECRET dans la route
  "/api/cron/(.*)",
  // Rendu HTML interne pour Puppeteer (protégé par PDF_RENDER_SECRET dans la route)
  "/pdf-render/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // ─── 1. Canonisation du domaine ──────────────────────────────────────
  // Toutes les requêtes arrivant sur un host non canonique en production
  // (URL Vercel auto-générée, apex sans www…) sont redirigées 308 vers
  // CANONICAL_HOST. Évite les boucles de cookies Clerk.
  const host = req.headers.get("host") ?? "";
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && isNonCanonicalHost(host)) {
    const url = new URL(req.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // ─── 2. Auth Clerk ───────────────────────────────────────────────────
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
