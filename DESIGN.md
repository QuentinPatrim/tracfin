# Identité du site public Klaris : « Papier & encre »

Ce fichier décrit les choix visuels du site public (accueil, tarifs, confiance,
sécurité, guides, pages légales) et du formulaire client. Le tableau de bord a sa
propre feuille de style (`app/dashboard/dashboard.css`) et n'est pas concerné.

À lire avant toute modification visuelle du site, par un humain ou par un agent.

## L'idée

Klaris s'adresse à des professionnels de l'immobilier, pas à des startups. Le site
parle donc leur langue visuelle :

- **Le document, pas la carte à icône.** On montre la vraie attestation
  (`/pdf-render/attestation/demo`) et le vrai formulaire client (`/kyc/demo`).
- **L'échelle de vigilance** reprend la grammaire de l'étiquette énergie. C'est la
  signature du site. Elle n'apparaît que là où elle a un sens (niveau d'un dossier).
- **Papier et encre.** Fond clair par défaut, un seul accent (le violet Klaris) en
  aplat, des champs pleins en violet profond pour rythmer la page.

## Couleurs

Toutes les couleurs passent par des variables CSS dans `app/globals.css`.

| Rôle | Clair | Variable |
|---|---|---|
| Fond papier | `#F6F5FA` | `--lp-bg` |
| Feuille, cartes | `#FFFFFF` | `--lp-card-bg`, `--kl-sheet` |
| Texte | `#17123A` | `--lp-text` (puis `-2`, `-3`, `-4`) |
| Accent | `#5B46E0` | `--lp-accent` |
| Accent en texte | `#4A36C9` | `--lp-accent-text` |
| Champ d'encre | `#1E1657` | `--kl-field` |
| Vigilance 1 à 4 | `#1E9E6A` `#E3A008` `#DD6B20` `#C5302C` | `--kl-v1` … `--kl-v4` |

Règles :

- **Un seul accent.** Pas de dégradé, pas de rose, pas de turquoise. Les variables
  `--lp-accent-2/3` et `--lp-*-grad` existent encore pour compatibilité mais pointent
  toutes vers le violet.
- **Les couleurs de vigilance portent un sens.** Elles ne servent jamais de décor.
- Pas d'effet verre (`backdrop-filter` décoratif), pas de halo flou, pas d'ombre
  colorée lumineuse.

## Typographie

- **Titres : Bricolage Grotesque** (`--font-display`), graisse 700, légèrement
  étroitisée (`font-variation-settings: "wdth" 90`). Classe `.kl-display`, tailles
  `.kl-h1`, `.kl-h2`, `.kl-h3`. Tous les `h1`/`h2` des pages publiques la reçoivent
  automatiquement.
- **Texte : Inter** (`--font-inter`).
- **JetBrains Mono** uniquement pour de vraies données (empreinte, référence de
  dossier), jamais comme habillage.
- Pas d'étiquette en capitales espacées au-dessus des titres. Pas de mot du titre
  mis en couleur.

## Formes

- Documents et feuilles : coins presque vifs (`--kl-r-paper`, 4 px).
- Boutons et champs : `--kl-r-ctl` (10 px). Pas de bouton « pilule ».
- La numérotation est réservée aux vraies séquences (les quatre étapes).

## Mouvement

- Une seule animation orchestrée, à l'arrivée sur la page d'accueil (`.kl-enter`).
- Interface sous 300 ms, courbe `--kl-ease-out`.
- Retour au clic : `transform: scale(0.97)` sur `:active`.
- Survol dans `@media (hover: hover)` uniquement.
- `prefers-reduced-motion` est respecté globalement.

## Textes

- Klaris **aide** à être conforme. Jamais « conformité garantie », « certifié »,
  « opposable ».
- Aucun chiffre sans source officielle vérifiée.
- Chaque article de loi cité est un lien vers Légifrance : composant
  `components/landing/LegalRef.tsx`, table `lib/legal-refs.ts`. Pas d'URL dans la
  table, pas de lien.
- Ton rassurant. On n'ouvre pas sur les sanctions.

## Où sont les choses

- Variables et classes `.kl-*` : `app/globals.css` (dans `@layer components`, pour
  qu'un utilitaire Tailwind posé sur l'élément garde le dernier mot).
- Page d'accueil : `app/page.tsx`.
- Échelle de vigilance : `components/landing/VigilanceScale.tsx`. Ses textes
  décrivent les règles de `lib/tracfin.ts` : si le moteur change, ils changent aussi.
- Navigation : `components/landing/FloatingNav.tsx`. Pied de page :
  `components/legal/LegalFooter.tsx`.
- Logo en aplat : `<KlarisLogo flat />`.
