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
  téléphone, le K passe sous les boutons, en version compacte. Survol (ordinateur) :
  toute la ligne réagit (barre, filet, texte) ; la barre avance et s'entoure d'un halo,
  le texte prend sa couleur, les autres lignes s'effacent, et un aperçu de
  l'obligation (petite vue du produit, une phrase, « Voir comment ») remplace la
  légende sous le K.
- **Fil rouge du K dans tout le site** : les cinq couleurs des barres désignent les
  cinq obligations, partout dans le même ordre (#2F5BFF, #5468FF, #9A6BEB, #EC6A93,
  #FF6A4D). Tableau des obligations : chaque ligne porte sa barre et son numéro ;
  au survol, elle se teinte de sa couleur. Pastille des titres de section = une
  barre du K (`--kc` : bleu pour « Comment ça marche », bleu 2 pour la vigilance,
  mini-K pour « Vos obligations » avec `.kl-kicker--k`). Fil de lecture : cinq
  segments sous la barre de navigation, remplis au défilement.
  Guides : carte avec la barre de l'obligation traitée (champ `ob` dans
  app/guides/page.tsx), dégradé de la marque si le guide n'en traite pas une seule.
  PDF : la bande du haut de chaque page est faite des cinq barres du K.
- **Grands écrans** : la colonne du site passe à 84rem (≥ 1500 px) puis 90rem
  (≥ 1800 px), et la taille de base du site public à 17 puis 18 px ; le K grandit
  avec (--u 4,3 puis 4,8 px). Sous les boutons, la
  pastille « Conçu par un négociateur immobilier en activité ». Dessous, `HeroStage.tsx` : le tableau de bord posé en perspective
  se redresse au défilement, le téléphone du client remonte en parallaxe.
- **Entrées** : montée avec léger flou (`.kl-enter`), ressort sur les survols
  (`--kl-ease-spring`), barres du logo qui glissent en place (`animated`).
- **Comment ça marche** (`components/landing/ProductStory.tsx`) : quatre étapes ; une
  scène reste épinglée à côté du texte (au-dessus sur téléphone) et change de plan
  quand une étape passe au milieu de l'écran.
- **Démo guidée** (`components/landing/DemoModal.tsx`, styles `.dg-*` et `.dq-*` de
  `demo.css`) : cinq chapitres, un par barre du K et dans le même ordre (identifier,
  évaluer, conserver cinq ans, déclarer, justifier). Chaque chapitre occupe tout le
  cadre dans la couleur de sa barre (assombrie pour porter du texte blanc) : titre à
  gauche, une seule grande carte d'interface blanche, à plat, à droite (au-dessus sur
  téléphone). Pas de téléphone, pas de fenêtre de navigateur, pas de grille de points.
  Les cartes sont dessinées à 560 × 640 puis mises à l'échelle ; chaque geste (saisie,
  appui, coche, jauge) est une animation CSS décalée par `--t`. Entre deux chapitres,
  le volet aux 5 couleurs du K (comme dans le reel). Une barre de progression par
  chapitre porte le temps ; la pause fige barres et cartes. Toucher à gauche / à
  droite, flèches, espace, Échap. Fin : le panneau cobalt avec l'appel à l'essai.
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
  téléphone, les indicateurs passent en grille 2 × 2 compacte (sans défilement de
  côté) ; l'aperçu s'ouvre en feuille glissante depuis le bas au toucher d'un dossier
  (poignée, croix, voile, Échap) ; les onglets s'effacent derrière.
- **Cartes et pilules** : la pilule est réservée aux boutons, badges et champs d'une
  ligne. Une carte qui contient plusieurs lignes prend un rayon de 20 à 28 px.
- **Niveaux dans l'application** : vert (standard), ambre (renforcée), orange (examen
  renforcé), rouge plein (interdiction).
- **Grands écrans** (≥ 1700 px) : le contenu du tableau de bord se centre, 1600 px
  au plus.
- **Fiche dossier** (`app/dashboard/[id]/page.tsx`, styles `.kd-*` de
  `components/dashboard/dossier/dossier.css`) : un en-tête (`DossierHeader.tsx` :
  initiales, nom, type, rôle, date de la fiche, niveau, « Dossier .zip » et
  « Attestation PDF ») puis un sommaire en pilules. Deux colonnes au-dessus de
  1180 px : à gauche ce qu'il faut faire (suite à donner, validation, déclaration,
  analyse de risque), à droite ce qu'on a (pièces reçues, données déclarées). Une
  seule colonne en dessous. Les titres de section portent la barre du K de
  l'obligation : identifier (données du client), évaluer (analyse), conserver
  (pièces), déclarer (déclaration). L'analyse (`TracfinForm`) est une carte avec
  ses trois étapes cliquables vers l'arrière et une barre d'actions collante en
  pilule (au-dessus des onglets sur téléphone).
- **Où en est un dossier** (`components/dashboard/dossierStage.ts`) : quatre étapes,
  toujours les mêmes — lien envoyé, fiche reçue, analyse vérifiée, suite donnée — et
  une seule « prochaine action » en mots simples. À la réception de la fiche, le
  niveau n'est **pas** encore calculé : l'agent vérifie l'analyse pré-remplie et
  l'enregistre, c'est là que Klaris calcule le niveau. La prochaine action apparaît
  sous chaque nom dans la liste (et un filtre « À faire »), en tête de l'aperçu, et
  sur la fiche dans `DossierProgress.tsx` (fil + bouton qui mène à la bonne section).
  Après « Enregistrer ce niveau », l'agent reste sur la fiche.
- **Documents** (`/dashboard/document`, `components/dashboard/docs/`) : on voit avant
  de télécharger. Les documents Klaris (attestation, fiche client, déclaration,
  cartographie) s'affichent depuis leur HTML (`?view=html`, `lib/doc-view.ts`),
  identique au PDF ; les pièces du client : image telle quelle, PDF dessiné page par
  page avec pdf.js (`public/pdfjs/pdf.worker.min.mjs`, à recopier depuis
  `node_modules/pdfjs-dist/build/` si la version change). Aucun lien direct vers un
  fichier « attachment » : dans l'app installée sur iPhone, il ouvre une page noire
  sans retour. On passe par `downloadFile()` : feuille de partage sur téléphone,
  téléchargement classique sur ordinateur.
- **E-mails de la marche à suivre** (`components/dashboard/mail/`) : pas de « mailto »
  nu (sans logiciel de messagerie, il ne se passe rien). Une fenêtre pré-remplie
  (destinataire, nom, bien, signature de l'agent) avec des cases qui adaptent le
  texte, puis « Ma messagerie », Gmail, Outlook, partager ou copier. Modèles sans IA
  dans `templates.ts`. Le refus ne mentionne jamais Tracfin (L.561-18).
- **Vocabulaire de l'app** : « fiche client » plutôt que « KYC » à l'écran
  (« Fiche attendue », « À vérifier »).
- **Page d'attente** (`app/dashboard/[id]/wait`) : dans le cadre de l'app, même
  bouton « ← Dossiers » que la fiche.
- **Visite guidée** (`components/dashboard/GuidedTour.tsx`, `tour.css`) : six plans
  (bienvenue, indicateurs, dossiers, détail, côté client, premier dossier), une
  couleur du K par plan dans la barre de progression. Voile encre, anneau blanc
  autour de la cible, carte blanche ; la pastille « Données d'exemple » remplace
  l'ancien bandeau. Sur téléphone la carte se pose en bas comme une feuille, la
  cible remonte en haut, et un plan peut avoir sa cible et son texte propres
  (`selectorMobile`, `bodyMobile`). Le plan « côté client » montre la fiche dessinée
  à plat en HTML (rubriques cochées une à une) : pas de téléphone ni de page réduite
  dans une iframe, floue et coupée.

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
- Un dossier n'est jamais dit « conforme » : on dit « vigilance standard » (niveau)
  et, pour un critère, « sans alerte ». Le PDF s'intitule « Attestation de diligences
  LCB-FT ».
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

## Téléphone : largeur

Rien ne doit dépasser la largeur de l'écran : sur iPhone, un seul élément trop large
fait dézoomer toute la page. `html, body { overflow-x: clip }` sert de filet ; la
barre du site connecté affiche « Mon espace » sans avatar sur téléphone.

## Carte de partage (aperçu des liens)

`app/opengraph-image.tsx` : fond clair, Plus Jakarta Sans 800 (`app/_og/*.woff`,
chargées par l'image), titre du site et le K avec ses cinq obligations. Titre partagé :
« Klaris · Chaque client identifié, chaque dossier prêt ». Les messageries gardent
l'ancien aperçu en cache un moment : pour tester, partager une adresse jamais
envoyée (ex. `klaris-app.fr/?v=2`).

## Site public : ce qui se clique doit se voir

- **Références d'articles** (`a.kl-ref`) : bleu, soulignées, avec la flèche ↗ ; une
  référence sans lien reste une pastille grise.
- **Échelle de vigilance** (`VigilanceExplorer`) : chaque niveau porte une flèche ;
  sur ordinateur le détail s'affiche à côté, sur téléphone dans une feuille du bas
  (`.kl-lvsheet`, niveau précédent / suivant).
- **Grand K de l'accueil** : fût en dégradé des cinq couleurs (le logo garde son fût
  bleu nuit).
- **« Comment ça marche » sur téléphone** : pas de scène épinglée ; chaque étape a son
  visuel juste dessous (`MobileStep`).

## Démo d'abord, puis contact

- Bouton principal partout : « Voir la démo guidée ». L'essai gratuit passe en second
  (lien sous les boutons, menu, appel final).
- **Formulaire « Parler à Klaris »** (`components/landing/contact/`) : section `#contact`
  de l'accueil, fenêtre ouverte par `klaris:open-contact` (accueil, menu, tarifs, fin
  de la démo). Les demandes vont dans la table `leads` (créée à la première demande)
  et s'affichent dans l'app, page « Demandes », réservée à `ADMIN_EMAILS`
  (par défaut quentindel2002@gmail.com). Mentionné dans la politique de confidentialité.
