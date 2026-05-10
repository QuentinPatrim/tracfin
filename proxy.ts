// proxy.ts — Middleware Clerk avec routes KYC publiques

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/tarifs",
  "/api/checkout",
  "/api/webhook/stripe",
  // Routes KYC publiques (accessibles sans authentification)
  "/kyc/(.*)",
  "/api/kyc/(.*)",
  // Upload / download de pièces : auth gérée dans la route (Clerk OU token KYC)
  "/api/upload",
  "/api/files/(.*)",
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