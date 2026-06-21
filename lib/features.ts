// lib/features.ts — Feature flags pilotés par la présence des clés API
//
// Chaque intégration tierce ne s'active QUE si sa clé est configurée en
// variable d'environnement. Tant qu'aucune clé n'est posée, la fonctionnalité
// reste masquée côté UI (pas de bouton qui planterait) et inerte côté serveur.
//
// ⚠️ À n'utiliser que dans des composants/route SERVEUR : les variables sans
// préfixe NEXT_PUBLIC_ ne sont pas disponibles côté client. Les composants
// client reçoivent ces booléens via props depuis une page serveur.

export const FEATURES = {
  /** Pré-remplissage INPI via Pappers (KYC personne morale). */
  pappers: !!process.env.PAPPERS_API_KEY,
  /** Criblage sanctions automatique via OpenSanctions. */
  screening: !!process.env.OPENSANCTIONS_API_KEY,
  /** Signature électronique eIDAS via Yousign. */
  signature: !!process.env.YOUSIGN_API_KEY,
} as const;
