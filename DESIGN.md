# Identité de Klaris : « Étiquette »

Ce fichier décrit les choix visuels du site public, du formulaire client, de
l'application connectée et des PDF. À lire avant toute modification visuelle.

## L'idée

- **Le logo, c'est le produit.** Le K est dessiné comme une étiquette de vigilance :
  un fût d'encre et cinq barres arrondies posées en escalier, du cobalt au corail
  (`components/ui/KlarisLogo.tsx`, `app/icon.tsx`, `klarisLogoSvg` dans
  `lib/pdf-helpers.ts`). Mot-symbole : « klaris » en minuscules, Plus Jakarta Sans 800
  (`.kl-wordmark`).
- **Clair uniquement.** Fond blanc et brume bleutée, pas de thème sombre (le thème est
  fixé à « light » dans `app/layout.tsx`).
- **Peu de couleur, mais franche.** Le cobalt pour agir (boutons, liens, sélection),
  le corail pour faire ressortir. Le dégradé cobalt → corail est réservé au logo, aux
  mots mis en avant dans les titres (`<em>` dans `.kl-display`), au premier indicateur
  du tableau de bord et à l'appel final. Un seul aplat de couleur par page.
- **Arrondi partout.** Boutons et pastilles en pilule, cartes de 20 à 40 px de rayon.
- **Le produit, pas des cartes à icône** : vrai formulaire client (`/kyc/demo`), vraie
  attestation (`/pdf-render/attestation/demo`), tableau de bord reconstitué
  (`components/landing/AppMock.tsx`).

## Couleurs

| Rôle | Valeur | Variable |
|---|---|---|
| Encre (texte) | `#0B1435` | `--kl-ink`, `--lp-text`, `--k-fg` |
| Cobalt (action) | `#2F5BFF`, en texte `#1F45E0` | `--kl-cobalt`, `--lp-accent`, `--k-accent` |
| Corail (accent) | `#FF6A4D` | `--kl-coral` |
| Brume (fonds) | `#F5F7FF`, `#EEF2FF` | `--kl-mist`, `--kl-cobalt-soft`, `--k-bg` |
| Dégradé de marque | cobalt → `#7B63F2` → `#EC6A93` → corail | `--kl-grad`, `--k-grad` |
| Vigilance 1 à 4 | `#16A06A` `#F2AE0A` `#F07A2B` `#E5483D` | `--kl-v1…4`, `--k-v1…4` |

Les couleurs de vigilance portent un sens, jamais un décor. Les utilitaires Tailwind
`slate`, `violet`, `indigo` sont redéfinis dans `app/globals.css` (`@theme`).

## Typographie

Une seule famille : **Plus Jakarta Sans** (`--font-sans-face`), 400 à 800. Titres en
800, approche serrée (`-0.045em`). JetBrains Mono uniquement pour de vraies données
(références d'articles, empreinte, liens). Pas de petites capitales espacées.

## Mouvement

Le mouvement raconte le produit, il ne décore pas. **Le défilement n'est jamais
capté** : un geste fait défiler la page, rien d'autre.

- **Haut de page** : le texte à gauche et, à droite, le K du logo en grand
  (`components/landing/HeroMark.tsx`). Le logo reste un logo : barres pleines, sans
  texte dedans. Un filet relie chaque barre à une étiquette en petit (01 Identifier le
  client… 05 Justifier au contrôle), qui mène à la section correspondante. Sur
  téléphone, le K passe sous les boutons, en version compacte. Sous les boutons, la
  pastille « Conçu par un négociateur immobilier en activité ». Dessous, `HeroStage.tsx` : le tableau de bord posé en perspective
  se redresse au défilement, le téléphone du client remonte en parallaxe.
- **Entrées** : montée avec léger flou (`.kl-enter`), ressort sur les survols
  (`--kl-ease-spring`), barres du logo qui glissent en place (`animated`).
- **Comment ça marche** (`components/landing/ProductStory.tsx`) : quatre étapes ; une
  scène reste épinglée à côté du texte (au-dessus sur téléphone) et change de plan
  quand une étape passe au milieu de l'écran.
- **Démo guidée** (`components/landing/DemoModal.tsx`, styles `.dg-*` de `demo.css`) :
  quatre chapitres façon « stories », texte à gauche et écran à droite (au-dessus sur
  téléphone). Une barre par chapitre : son animation CSS porte le temps, la pause la
  fige, sa fin passe au chapitre suivant. Toucher à gauche / à droite, flèches, espace,
  Échap. Fin : un panneau cobalt avec l'appel à l'essai.
- **Aucune iframe dans le site public.** Les écrans (formulaire du client, attestation)
  sont reconstitués en HTML léger dans `DemoScreens.tsx` et partagés par le haut de
  page, « Comment ça marche » et la démo.
- **Sous les sections** : un geste par section (`ScrollFx.tsx`, bloc « Effets liés au
  défilement » de `globals.css`).
- Règles : seuls `transform`, `opacity` et `clip-path` sont animés ; le texte est
  toujours dans le DOM ; `prefers-reduced-motion` met tout à plat ; interface sous
  300 ms, retour au clic par `scale(0.97)`.
- **On ne montre que ce que le produit fait.** Les libellés des écrans reconstitués
  reprennent ceux du produit (`app/dashboard/nouveau/NewDossierForm.tsx`,
  `components/tracfin/Step2.tsx`, `components/dashboard/demoData.ts`).

## Application connectée

- **Cadre** : `components/dashboard/AppShell.tsx`, posé par `app/dashboard/layout.tsx`.
  Barre latérale blanche (logo, organisation, navigation, essai, compte). Sur
  téléphone (≤ 900 px) : un bandeau en pilule en haut et une barre d'onglets flottante
  en bas (Dossiers, Risques, « + » Nouveau, Archives, Menu → tiroir).
- **Jetons** : `--k-*` dans `app/dashboard/dashboard.css` (noms de classes d'origine
  conservés ; `.btn-grad` est un bouton cobalt en pilule).
- **Indicateurs** : quatre cartes, la première en dégradé de marque.
- **Aperçu d'un dossier** : l'étiquette de vigilance compacte (`VigilanceMini`). Sur
  téléphone, les indicateurs deviennent un bandeau compact défilant pour que la liste
  arrive tout de suite ; l'aperçu s'ouvre en feuille glissante depuis le bas au toucher d'un dossier
  (poignée, croix, voile, Échap) ; les onglets s'effacent derrière.
- **Cartes et pilules** : la pilule est réservée aux boutons, badges et champs d'une
  ligne. Une carte qui contient plusieurs lignes prend un rayon de 20 à 28 px.
- **Niveaux dans l'application** : vert (standard), ambre (renforcée), orange (examen
  renforcé), rouge plein (interdiction).

## App installable (téléphone)

- Klaris s'installe sur l'écran d'accueil depuis le site, sans store : manifeste
  `app/manifest.ts`, icônes `public/pwa/` (générées depuis le monogramme), icône
  Apple `app/apple-icon.png`, service worker `public/sw.js`.
- **Le service worker ne met aucune donnée en cache** : seule la page
  `public/offline.html` (« Pas de connexion ») est gardée.
- L'app s'ouvre sur `/app` (`app/app/`) : connexion sur place (composant Clerk
  intégré, même domaine, indispensable sur iPhone), puis `/dashboard`.
- Bouton « Installer l'app » : `components/pwa/InstallApp.tsx`. Android : invite du
  navigateur. iPhone : feuille avec les gestes Safari. Ordinateur : QR code
  (`public/pwa/qr-app.svg`, vers www.klaris-app.fr/app). Masqué une fois installée.
  Présent dans la section `#app` du site, le menu mobile du site, le menu de l'app
  et un bandeau refermable sur le tableau de bord (téléphone).

## PDF

Mêmes couleurs et logo, bandeau supérieur au dégradé de marque ; contenu et mise en
page inchangés. La police reste Inter.

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
- Haut de page : `HeroMark.tsx`, `HeroStage.tsx`, `AppMock.tsx`, `KycPhone.tsx`.
  Écrans légers : `DemoScreens.tsx` + `demo.css`. Démo : `DemoModal.tsx`. Étapes :
  `ProductStory.tsx`. Échelle : `VigilanceScale.tsx` (ses textes décrivent les règles
  de `lib/tracfin.ts` : si le moteur change, ils changent aussi).
- Navigation : `components/landing/FloatingNav.tsx`. Pied de page :
  `components/legal/LegalFooter.tsx`.
- Origine du site côté navigateur : `lib/use-origin.ts`.
