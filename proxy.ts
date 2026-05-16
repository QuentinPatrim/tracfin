// proxy.ts — Middleware Clerk avec routes KYC publiques

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/tarifs",
  "/api/checkout",
  "/api/webhooks/stripe",
  // Routes KYC publiques (accessibles sans authentification)
  "/kyc/(.*)",
  "/api/kyc/(.*)",
  // Upload / download de pièces : auth gérée dans la route (Clerk OU token KYC)
  "/api/upload",
  "/api/files/(.*)",
  // Rendu HTML interne pour Puppeteer (protégé par PDF_RENDER_SECRET dans la route)
  "/pdf-render/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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