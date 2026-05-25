// lib/org.ts — Synchronisation du cap utilisateurs côté Clerk en fonction du plan
//
// L'abonnement Agence est commercialisé pour 5 collaborateurs. Plutôt que
// d'enforcer côté code à chaque invitation, on règle directement
// `max_allowed_memberships` sur l'organisation Clerk → Clerk refusera les
// invitations supplémentaires automatiquement (UI propre + API guard natif).

import { clerkClient } from "@clerk/nextjs/server";
import { membershipCapForPlan, type Plan } from "@/lib/subscription";

/**
 * Met à jour le cap d'utilisateurs autorisés sur une organisation Clerk.
 * Best-effort : log l'erreur sans casser l'appelant (souscription Stripe valide
 * doit toujours aboutir même si la sync Clerk plante).
 */
export async function syncOrgMembershipCap(orgId: string, plan: Plan | null): Promise<void> {
  const cap = membershipCapForPlan(plan);
  try {
    const client = await clerkClient();
    await client.organizations.updateOrganization(orgId, {
      maxAllowedMemberships: cap,
    });
  } catch (e) {
    console.error("[org.ts] syncOrgMembershipCap a échoué :", e, { orgId, plan, cap });
  }
}
