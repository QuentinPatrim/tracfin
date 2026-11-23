# Identité de Klaris : « Registre »

Ce fichier décrit les choix visuels du site public (accueil, tarifs, confiance,
sécurité, guides, pages légales), du formulaire client, de l'application connectée
et des PDF. À lire avant toute modification visuelle, par un humain ou par un agent.

## L'idée

Klaris tient le registre LCB-FT d'une agence immobilière. L'identité en prend la
tenue : celle d'un document notarié bien composé, pas celle d'une start-up.

- **Encre et papier.** Un fond papier clair, du texte d'encre, des filets fins. Les
  sections de nuit (haut de page, hébergement, appel final) rythment la page.
- **Une seule couleur d'accent : l'iris** (`#5847E8`), utilisée avec parcimonie
  (liens, sélection, focus, petites marques). Le bouton principal est **d'encre**
  sur papier, **blanc** sur la nuit.
- **Le dégradé violet → rose ne survit qu'à un endroit** : le petit losange du
  monogramme. Nulle part ailleurs : ni bouton, ni texte, ni halo. C'est ce dégradé
  partout qui donnait l'impression d'un logiciel « généré ».
- **Le produit, pas des cartes à icône.** On montre le vrai formulaire client
  (`/kyc/demo`), la vraie attestation (`/pdf-render/attestation/demo`) et une
  reproduction fidèle du tableau de bord (`components/landing/AppMock.tsx`).
- **L'échelle de vigilance** reprend la grammaire de l'étiquette énergie. C'est la
  signature du produit : sur le site, dans l'aperçu d'un dossier, dans les maquettes.

## Couleurs

| Rôle | Valeur | Variable |
|---|---|---|
| Encre (texte, bouton principal) | `#121118` | `--kl-ink`, `--lp-text`, `--k-fg` |
| Papier (fond) | `#F6F6F3` | `--kl-paper`, `--lp-bg` |
| Feuille (cartes) | `#FFFFFF` | `--lp-card-bg`, `--k-surface` |
| Barre latérale de l'application | `#F1F0EC` | `--k-side-bg` |
| Nuit (sections sombres) | `#0B0A10` | `--kl-night`, `--kl-field` |
| Iris (accent) | `#5847E8`, en texte `#4A3AD6` | `--lp-accent`, `--lp-accent-text`, `--k-accent` |
| Vigilance 1 à 4 | `#1F9A68` `#D9980A` `#D86A21` `#C23630` | `--kl-v1…4`, `--k-v1…4` |

Règles :

- Les couleurs de vigilance portent un sens. Jamais de décor.
- Les utilitaires Tailwind `slate`, `violet`, `indigo`, `emerald`, `red` sont
  redéfinis dans `app/globals.css` (`@theme`) : `text-slate-500` donne le gris
  d'encre, `bg-violet-500` l'iris.
- Pas d'effet verre décoratif, pas de halo flou derrière les cartes, pas d'ombre
  colorée. Une carte, c'est un fond blanc et un filet (`0 0 0 1px` à 8 %).
- Thème sombre du site : mêmes règles, le bouton principal passe à l'iris.

## Typographie

- **Titres : Instrument Serif** (`--font-serif-face`), une seule graisse. Classe
  `.kl-display`, tailles `.kl-h1`, `.kl-h2`. Tous les `h1`/`h2` du site public la
  reçoivent automatiquement. `font-synthesis: none` : jamais de faux gras.
- **Mise en relief : l'italique de la serif** (`<em>` dans un titre). Pas de mot
  coloré, pas de dégradé sur du texte.
- **Texte et interface : Instrument Sans** (`--font-sans-face`).
- **JetBrains Mono** uniquement pour de vraies données : référence d'article,
  empreinte, numéro de dossier, numéro d'étape.
- Pas de petites capitales espacées (le grand marqueur des interfaces générées).
  Une règle hors couche dans `globals.css` les neutralise sur les pages anciennes.
  Pour légender une section : `.kl-kicker` (une phrase courte précédée d'un filet).
- Dans l'application : titres de page et chiffres des indicateurs en serif, tout le
  reste en Instrument Sans.

## Formes

- Boutons et champs : 8 px de rayon. Cartes : 12 px. Documents : 3 px.
- Pastilles de statut : 6 px, à plat, un point de couleur devant le libellé.
- Monogramme : `components/ui/KlarisLogo.tsx` (variantes `inverted`, `mono`,
  `noBackground`), même dessin dans le favicon (`app/icon.tsx`) et les PDF
  (`klarisLogoSvg` dans `lib/pdf-helpers.ts`). Mot-symbole : `.kl-wordmark` (serif).

## Mouvement

Le mouvement raconte le produit, il ne décore pas. **Le défilement n'est jamais
capté** : un geste fait défiler la page, rien d'autre.

- **Haut de page** (`components/landing/HeroStage.tsx`) : le tableau de bord est posé
  en perspective et se redresse à mesure qu'on défile, jusqu'à être à plat face au
  lecteur. Le téléphone du client, avec le vrai formulaire qui avance seul, remonte
  un peu plus vite (parallaxe).
- **Comment ça marche** (`components/landing/ProductStory.tsx`) : quatre étapes ; une
  scène reste épinglée à côté du texte (au-dessus sur téléphone) et change de plan
  quand une étape passe au milieu de l'écran.
- **Démo guidée** : le film en 3D (`components/landing/DemoModal.tsx`,
  `demo-film.css`), inchangé dans sa mécanique, recoloré.
- **Sous les sections** : un geste par section (`ScrollFx.tsx`, bloc « Effets liés au
  défilement » de `globals.css`).
- Règles : seuls `transform`, `opacity` et `clip-path` sont animés ; le texte est
  toujours dans le DOM ; `prefers-reduced-motion` met tout à plat ; interface sous
  250 ms, courbe `--kl-ease-out`, retour au clic par `scale(0.98)`.
- **On ne montre que ce que le produit fait.** Les libellés des écrans reconstitués
  reprennent ceux du produit (`app/dashboard/nouveau/NewDossierForm.tsx`,
  `components/tracfin/Step2.tsx`, `components/dashboard/demoData.ts`).

## Application connectée

- **Cadre** : `components/dashboard/AppShell.tsx`, posé une fois par
  `app/dashboard/layout.tsx`. Barre latérale (marque, organisation, navigation,
  compte, essai, utilisateur) ; sur téléphone, un bandeau et un menu. L'écran
  d'attente du client (`/dashboard/[id]/wait`) garde son plein écran.
- **Jetons** : `--k-*` dans `app/dashboard/dashboard.css`. Les noms de classes
  d'origine sont conservés (`.btn-grad` est désormais un bouton d'encre plein).
- **Indicateurs** : un seul bandeau, quatre cases séparées par des filets, chiffres
  en serif, un petit carré de couleur de vigilance.
- **Aperçu d'un dossier** : l'étiquette de vigilance compacte (`VigilanceMini`).
- **Niveaux dans l'application** : vert (standard), ambre (renforcée), rouge (examen
  renforcé), encre (interdiction). Toute harmonisation avec l'échelle du site est une
  décision produit, pas un détail d'habillage.

## PDF

Mêmes couleurs, contenu et mise en page inchangés, plus de dégradé. La police reste
Inter : pas de police supplémentaire à charger au moment du rendu.

## Textes

- Klaris **aide** à être conforme. Jamais « conformité garantie », « certifié »,
  « opposable ».
- Aucun chiffre sans source officielle vérifiée.
- Chaque article de loi cité est un lien vers Légifrance :
  `components/landing/LegalRef.tsx`, table `lib/legal-refs.ts`.
- Ton rassurant. On n'ouvre pas sur les sanctions.

## Où sont les choses

- Jetons et classes `.kl-*` : `app/globals.css`. Page d'accueil : `app/page.tsx` et
  `components/landing/landing.css`.
- Haut de page : `HeroStage.tsx`, `AppMock.tsx`, `KycPhone.tsx`. Étapes :
  `ProductStory.tsx`. Échelle : `VigilanceScale.tsx` (ses textes décrivent les règles
  de `lib/tracfin.ts` : si le moteur change, ils changent aussi).
- Navigation : `components/landing/FloatingNav.tsx`. Pied de page :
  `components/legal/LegalFooter.tsx`.
- Origine du site côté navigateur : `lib/use-origin.ts`.
