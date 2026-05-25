// lib/legal.ts — Source unique de vérité pour toutes les infos légales / RGPD
// Modifier ces constantes met automatiquement à jour mentions légales, CGV, CGU,
// politique de confidentialité, page Confiance et footer.

/* ============================================================
   ÉDITEUR DU SERVICE (toi)
   ⚠️ À COMPLÉTER avec tes vraies infos avant mise en ligne
   ============================================================ */
export const EDITEUR = {
  // Marque commerciale
  marque: "Klaris",
  baseline: "Conformité LCB-FT pour les professionnels assujettis",

  // Identité juridique
  raisonSociale: "Quentin Delsol",        // pour une micro : ton prénom + nom
  statutJuridique: "Entreprise individuelle (micro-entrepreneur)",
  siret: "104908934",
  rne: "Inscrite au RNE (Registre National des Entreprises)",
  capital: null as string | null,                    // pas de capital pour une EI
  tvaIntra: "Non applicable — art. 293 B du CGI (franchise en base de TVA)",

  // Coordonnées
  adresse: "9, rue Tripière, 31000 Toulouse, France",
  telephone: "06.52.45.96.54",
  email: "contact@klaris.fr",
  emailRgpd: "contact@klaris.fr",

  // Web — URL canonique = celle marquée "Primary" dans Vercel
  // (apex `klaris-app.fr` fait un 307 vers `www.klaris-app.fr`).
  siteUrl: "https://www.klaris-app.fr",
  directeurPublication: "Quentin Delsol",
} as const;

/* ============================================================
   HÉBERGEUR DU SITE (code Next.js)
   ============================================================ */
export const HEBERGEUR_SITE = {
  raisonSociale: "Vercel Inc.",
  adresse: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  filialeEU: "Vercel B.V., Singel 542, 1017AZ Amsterdam, Pays-Bas",
  telephone: "+1 559 288 7060",
  site: "https://vercel.com",
  region: "Edge global — fonctions serveur exécutées en région Europe (cdg1 Paris)",
} as const;

/* ============================================================
   HÉBERGEURS DES DONNÉES (le cœur de la souveraineté Klaris)
   ============================================================ */
export const HEBERGEURS_DONNEES = [
  {
    nom: "Neon Inc.",
    role: "Base de données PostgreSQL (données structurées : comptes, dossiers, scoring)",
    region: "🇩🇪 Francfort, Allemagne (région eu-central-1)",
    adresse: "Neon Inc., 2261 Market Street #4099, San Francisco, CA 94114, États-Unis",
    filialeEU: "Données stockées exclusivement sur infrastructure AWS Frankfurt",
    site: "https://neon.tech",
    certifications: "SOC 2 Type II, ISO 27001, chiffrement AES-256 at-rest, TLS 1.3 in-transit",
  },
  {
    nom: "Scaleway S.A.S.",
    role: "Stockage objet S3-compatible (pièces justificatives KYC : CNI, justificatifs)",
    region: "🇫🇷 Paris, France (région fr-par)",
    adresse: "8 rue de la Ville l'Évêque, 75008 Paris, France",
    site: "https://www.scaleway.com",
    certifications: "ISO 27001, ISO 27017, ISO 27018, HDS, SOC 2, hébergeur français souverain",
  },
] as const;

/* ============================================================
   SOUS-TRAITANTS (art. 28 RGPD)
   Tous doivent avoir un DPA signé avec Klaris
   ============================================================ */
export const SOUS_TRAITANTS = [
  {
    nom: "Clerk Inc.",
    finalite: "Authentification et gestion des comptes professionnels",
    donnees: "Email, prénom, nom, mot de passe haché, métadonnées de session",
    localisation: "🇺🇸 États-Unis — DPA signé, clauses contractuelles types UE (SCC 2021/914), conformité Data Privacy Framework",
    duree: "Pendant toute la durée du compte + 30 jours après résiliation",
    site: "https://clerk.com",
  },
  {
    nom: "Neon Inc.",
    finalite: "Hébergement de la base de données PostgreSQL",
    donnees: "Toutes les données structurées du service (hors fichiers)",
    localisation: "🇩🇪 Francfort, Allemagne (UE)",
    duree: "Pendant toute la durée du compte + 5 ans après dernier dossier KYC (obligation L.561-12-1 CMF)",
    site: "https://neon.tech",
  },
  {
    nom: "Scaleway S.A.S.",
    finalite: "Stockage des pièces justificatives KYC (CNI, justificatifs de domicile, etc.)",
    donnees: "Fichiers téléversés par les clients finaux dans le formulaire KYC",
    localisation: "🇫🇷 Paris, France (UE)",
    duree: "5 ans après la fin de la relation d'affaires (obligation L.561-12-1 CMF)",
    site: "https://www.scaleway.com",
  },
  {
    nom: "Stripe Payments Europe Ltd.",
    finalite: "Traitement des paiements d'abonnement",
    donnees: "Email, nom, données de facturation. Aucune donnée de carte ne transite par Klaris.",
    localisation: "🇮🇪 Dublin, Irlande (UE)",
    duree: "Selon les obligations comptables (10 ans, art. L.123-22 Code de commerce)",
    site: "https://stripe.com",
  },
  {
    nom: "Vercel Inc.",
    finalite: "Hébergement du code applicatif (rendu des pages, exécution des API)",
    donnees: "Aucune donnée persistée — runtime uniquement. Logs techniques 7 jours.",
    localisation: "🇫🇷 Paris (cdg1) — runtime EU forcé",
    duree: "Logs techniques : 7 jours",
    site: "https://vercel.com",
  },
] as const;

/* ============================================================
   DURÉES DE CONSERVATION (art. 5.1.e RGPD)
   ============================================================ */
export interface ConservationEntry {
  categorie: string;
  duree: string;
  base: string;
  important?: boolean;
}

export const CONSERVATION: readonly ConservationEntry[] = [
  {
    categorie: "Compte professionnel utilisateur (toi, le pro assujetti)",
    duree: "Toute la durée du contrat + 30 jours après résiliation pour permettre l'export",
    base: "Exécution du contrat (art. 6.1.b RGPD)",
  },
  {
    categorie: "Données KYC des clients finaux (identité, pièces, scoring, attestations)",
    duree: "5 ans après la fin de la relation d'affaires",
    base: "Obligation légale — art. L.561-12-1 du Code monétaire et financier (LCB-FT). Cette durée prime sur le droit à l'effacement.",
    important: true,
  },
  {
    categorie: "Données de facturation (factures, justificatifs comptables)",
    duree: "10 ans",
    base: "Obligation légale — art. L.123-22 du Code de commerce",
  },
  {
    categorie: "Logs techniques (connexions, accès API)",
    duree: "12 mois maximum",
    base: "Intérêt légitime — sécurité (recommandation CNIL)",
  },
  {
    categorie: "Cookies de session",
    duree: "Session de navigation (suppression à la déconnexion)",
    base: "Strictement nécessaire au fonctionnement du service",
  },
] as const;

/* ============================================================
   DROITS DES PERSONNES CONCERNÉES (RGPD)
   ============================================================ */
export const DROITS_RGPD = [
  { code: "Accès", article: "art. 15", description: "Connaître les données qui vous concernent et en obtenir copie." },
  { code: "Rectification", article: "art. 16", description: "Corriger des données inexactes ou incomplètes." },
  { code: "Effacement", article: "art. 17", description: "Faire supprimer vos données — sauf obligation légale de conservation (LCB-FT : 5 ans)." },
  { code: "Limitation", article: "art. 18", description: "Geler temporairement un traitement contesté." },
  { code: "Portabilité", article: "art. 20", description: "Récupérer vos données dans un format structuré, lisible par machine." },
  { code: "Opposition", article: "art. 21", description: "S'opposer à un traitement, sauf base légale impérieuse." },
  { code: "Réclamation CNIL", article: "art. 77", description: "Saisir l'autorité de contrôle française : www.cnil.fr — 3 place de Fontenoy, 75007 Paris." },
] as const;

/* ============================================================
   COOKIES (catégorisation CNIL)
   ============================================================ */
export const COOKIES = [
  {
    nom: "__clerk_*",
    emetteur: "Clerk (Klaris)",
    finalite: "Authentification sécurisée — maintien de la session connectée",
    duree: "Session + 7 jours",
    categorie: "Strictement nécessaire (pas de consentement requis)",
  },
  {
    nom: "__stripe_*",
    emetteur: "Stripe",
    finalite: "Sécurisation du paiement d'abonnement (anti-fraude)",
    duree: "1 an",
    categorie: "Strictement nécessaire au paiement",
  },
  {
    nom: "klaris-cookie-notice",
    emetteur: "Klaris",
    finalite: "Mémoriser que vous avez vu le bandeau d'information",
    duree: "12 mois",
    categorie: "Strictement nécessaire (préférence d'affichage)",
  },
] as const;
