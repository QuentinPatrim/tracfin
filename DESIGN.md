# Identité du site public Klaris : « Papier & encre »

Ce fichier décrit les choix visuels du site public (accueil, tarifs, confiance,
sécurité, guides, pages légales) et du formulaire client. Le tableau de bord a sa
propre feuille de style (`app/dashboard/dashboard.css`) et n'est pas concerné.

À lire avant toute modification visuelle du site, par un humain ou par un agent.

## L'idée

Klaris s'adresse à des professionnels de l'immobilier, pas à des startups. Le site
parle donc leur langue visuelle :

- **Le document, pas la carte à icône.** On montre la vraie attestation
  (`/pdf-render/attestation/demo`) et le vrai formulaire client (`/kyc/demo`),
  mis en scène au défilement.
- **L'échelle de vigilance** reprend la grammaire de l'étiquette énergie. C'est la
  signature du site. Elle n'apparaît que là où elle a un sens (niveau d'un dossier).
- **Papier et encre.** Fond clair par défaut, des champs pleins en indigo nuit,
  éclairés d'une lueur violet / rose, pour rythmer la page.

## Couleurs

Palette « Iris » : les couleurs de la marque (logo, vidéos). Toutes passent par des
variables CSS dans `app/globals.css`.

| Rôle | Clair | Variable |
|---|---|---|
| Fond papier | `#F6F5FA` | `--lp-bg` |
| Feuille, cartes | `#FFFFFF` | `--lp-card-bg`, `--kl-sheet` |
| Texte | `#17123A` | `--lp-text` (puis `-2`, `-3`, `-4`) |
| Violet (principal) | `#6D5EF6`, en texte `#5B46E0` | `--lp-accent`, `--lp-accent-text` |
| Rose (second) | `#EC4899`, en texte `#BE185D` | `--lp-accent-2`, `--lp-accent-2-text` |
| Indigo (appoint) | `#4F46E5` | `--lp-accent-3` |
| Champ d'encre | `#110E30` + lueur | `--kl-field`, `--kl-field-glow` |
| Dégradé du bouton principal | `#6D5EF6 → #A548D8 → #DB2777` | `--lp-cta-grad` |
| Vigilance 1 à 4 | `#1E9E6A` `#E3A008` `#DD6B20` `#C5302C` | `--kl-v1` … `--kl-v4` |

Règles :

- **Le dégradé violet → rose est réservé à quatre endroits** : la lueur des champs
  d'encre, le bouton principal, les chiffres d'étape de la séquence, le logo. Pas de
  dégradé sur du texte courant ni sur les titres de la page d'accueil.
- **Le blanc doit rester lisible sur tout le bouton** : c'est pour cela que le
  dégradé du bouton finit sur un rose plus soutenu (`#DB2777`) que le rose de marque.
- **Les couleurs de vigilance portent un sens.** Elles ne servent jamais de décor.
- Pas d'effet verre (`backdrop-filter` décoratif), pas de halo flou derrière les
  cartes.

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

Le mouvement raconte le produit, il ne décore pas.

- **Haut de page : une séquence au défilement** (`components/landing/ScrollStory.tsx`).
  La scène est épinglée pendant cinq hauteurs d'écran. Le téléphone, posé en
  perspective, se redresse et vient vers nous ; on entre dans le vrai formulaire
  client, dont les étapes avancent avec le défilement ; l'étiquette de vigilance se
  construit ; l'attestation se relève et l'étiquette vient s'y coller. Ce sont les
  quatre étapes du produit, dans l'ordre.
- **Sous la séquence : un geste par section** (`components/landing/ScrollFx.tsx` et
  le bloc « Effets liés au défilement » de `globals.css`). Les barres de l'échelle
  se déploient, les lignes du tableau s'inscrivent une à une, le champ d'encre de
  l'hébergement s'ouvre d'un panneau vers la pleine largeur. Pas d'apparition
  identique plaquée sur tout.
- **Règles** :
  - le défilement n'est jamais détourné : la page suit le doigt, la scène suit la page ;
  - seuls `transform`, `opacity` et `clip-path` sont animés ;
  - le texte est toujours dans le DOM et lisible sans JavaScript ;
  - `prefers-reduced-motion` : la séquence n'est pas épinglée et s'affiche à plat,
    les effets de section sont désactivés ;
  - interface (boutons, survols) sous 300 ms, courbe `--kl-ease-out`, retour au clic
    par `scale(0.97)`, survol dans `@media (hover: hover)`.
- Pour régler la séquence : les fenêtres de chaque légende sont dans `CAPTIONS`, les
  étapes du formulaire dans `formStep()`, la longueur dans `LENGTH_VH`.

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
- Page d'accueil : `app/page.tsx`. Haut de page animé : `components/landing/ScrollStory.tsx`.
- Échelle de vigilance : `components/landing/VigilanceScale.tsx`. Ses textes
  décrivent les règles de `lib/tracfin.ts` : si le moteur change, ils changent aussi.
- Navigation : `components/landing/FloatingNav.tsx`. Pied de page :
  `components/legal/LegalFooter.tsx`.
- Logo : `<KlarisLogo />`, en dégradé, le même partout (site, tableau de bord, PDF).
