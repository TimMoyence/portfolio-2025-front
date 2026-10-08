# 0004 - Livret papier : une même pagination sous Safari et Chrome

- Statut : accepte
- Date : 2026-10-07

## Contexte

Le livret papier d'un cours (`cours-livret.component`) s'imprime ou s'exporte en PDF depuis le
navigateur du formateur. Sous Safari, le livret du B2-02 sortait sur 25 pages, la moitié haute
des premières en noir, alors que l'en-tête annonçait 15 feuilles. Chrome ne donnait pas les mêmes
pages, et le résultat de Safari changeait avec la taille de la fenêtre.

Les causes relevées, moteur par moteur :

- le voile décoratif `body::before` s'imprimait en aplat sombre ;
- le zoom et les unités liées à la fenêtre (`vh`, `cqh` de la toile, requêtes `min-width`)
  donnaient une mise en page qui dépendait de la fenêtre au moment d'imprimer ;
- chaque moteur réduit la page pour la faire tenir en largeur (« ajuster à la page »), mais
  pas à partir de la même largeur ;
- les images différées (`loading="lazy"`) hors de la fenêtre s'imprimaient vides sous Safari ;
- WebKit ne respecte pas `break-inside: avoid` sur un élément de grille et coupait les écrans ;
- WebKit remet `float` à `none` sur une légende enfant de grille : la légende retombe dans la
  bordure de son `fieldset` et la carte grandit ;
- WebKit pagine une ligne sur son débordement visuel : l'ombre portée d'une carte repoussait à
  la page suivante un bloc dont la boîte tenait ;
- Chrome arrondit au pixel CSS entier la page et ses marges : avec des marges de 12 mm
  (45,35 px), une page contient 1525 px de mise en page sous Chrome contre 1527 sous Safari, et
  une fiche de 1525,3 px tenait sur une page dans l'un et deux dans l'autre.

Une fois ces règles en production, un export Safari du B2-02 lancé depuis le pupitre sortait
encore blanc : une seule page, ou tout blanc à partir de la page 13. Le livret ne dépendait
d'aucune de ces règles : il partageait le processus WebContent du pupitre.

- Le pupitre ouvrait le livret par `window.open` dans une fenêtre nommée : WebKit charge une
  fenêtre ouverte par une page dans le processus de son ouvreur, et `noopener` n'y change rien
  pour une page du même site (`preferredProcessFromOpener`).
- `window.print()` bloque le processus de la page tant que le panneau d'impression est ouvert,
  donc aussi le pupitre resté en arrière-plan.
- Safari met fin à une page qui ne répond plus depuis environ 3 s et n'est pas visible
  (« Unresponsive page is being terminated since it's not visible ») : en tuant le pupitre, il
  tuait le processus du livret pendant que le panneau préparait le PDF.
- Seule une réponse `Cross-Origin-Opener-Policy: same-origin` sur le livret, que le pupitre ne
  porte pas, fait passer le livret dans un autre groupe de navigation, donc dans un autre
  processus.

Le premier export réel (B2-02, 23 pages sous Safari) a ensuite montré :

- le fond crème de la page et les aplats beiges des briques s'imprimaient dès que l'option
  « imprimer les arrière-plans » était cochée, sur chaque exemplaire ;
- une carte collée au bord droit du livret perdait sa bordure : WebKit rogne la page d'une
  fraction de pixel, que le livret mesure 1040,42 px ou 1040 px ;
- le champ numérique gardait sa largeur intrinsèque d'une vingtaine de caractères et poussait
  son unité hors de la carte (« jour » coupé au B2-02) ;
- un tableur de onze colonnes (B2-03) mesurait 1350 px : à l'écran il défile, sur papier un
  quart des colonnes disparaissait ;
- Chromium élargit la piste d'une `inline-grid` à la largeur minimale de son contenu
  (corrigé du B2-01, 1088 px), WebKit non ;
- un écran de cours aux trois cartes en occupait deux rangées et gardait, comme les autres
  gabarits, les marges et la densité d'un écran projeté : une demi-page blanche par écran ;
- le parcours de méthode (plan de séance du B2-01) fait défiler ses étapes sur un minuteur et
  n'imprimait que la preuve et le résultat de l'étape affichée à l'instant de l'impression :
  cinq actes sur six perdaient les leurs, et le contenu changeait d'un export à l'autre.

## Decision

- À l'impression, le livret a une largeur fixe de 275,28 mm (1040 px), environ 1,48 fois la
  largeur utile de la page A4, sous le plafond de réduction de WebKit. Les deux moteurs
  réduisent alors la même mise en page avec la même échelle, quelle que soit la fenêtre. Cette
  largeur ne dépend pas des marges : chaque retour à la ligne en dépend, et la déplacer d'un
  pixel suffit à changer la pagination.
- Rien n'y dépend de la fenêtre : la hauteur de toile est imposée par des variables
  (`--slide-hauteur-de-toile`, `--fp-hauteur-de-toile-imposee`), les requêtes média des
  gabarits s'écrivent `print, (min-width: …)`, aucun élément n'est zoomé et aucune image n'est
  différée.
- La pagination ne repose sur aucune propriété `break-*` d'évitement : chaque bloc insécable
  est une `inline-grid` pleine largeur dans un flux `display: block` (`orphans` et `widows` à
  1), que les deux moteurs déplacent d'un seul tenant. Un écran du corrigé se scinde entre son
  activité et chacune des aides du formateur.
- Un bloc insécable rogne son débordement (`overflow: clip`) et les cartes des briques
  n'ont pas d'ombre portée à l'impression : seule la boîte compte pour la pagination.
- Une légende de `fieldset` flotte en pleine largeur dans un `fieldset` en `flow-root` ; la
  grille passe sur un enveloppant `.fp-…__corps`.
- Les marges de `@page` sont des pixels CSS entiers (45 px), que Chrome n'a pas à arrondir.
  Des marges de 30 px, avec un livret élargi à 1084 px pour garder la même taille de texte,
  ont été mesurées : 277 pages au lieu de 279 sur les douze livrets. Les blocs étant
  insécables, les 45 px gagnés par page laissent rarement entrer un bloc de plus ; les marges
  restent à 45 px.
- Le voile décoratif ne s'imprime pas, et le livret s'imprime sur fond blanc : la page,
  `--fp-cream`, `--fp-ivory` et `--fp-a-revoir-fond` passent au blanc à l'impression. Les
  bordures portent la structure ; les petits aplats d'accent restent.
- Une gouttière de 2 px écarte les écrans du bord de la largeur imprimée.
- Un bloc insécable n'a qu'une colonne `minmax(0, 1fr)` : son contenu ne l'élargit jamais.
- Rien ne déborde d'un écran : le champ numérique part de 10 rem et son unité passe à la ligne
  faute de place ; à l'impression, le tableur redevient une table dont les cellules passent à
  la ligne.
- Le livret imprimé reprend les réglages de la projection : marges de cadre nulles
  (`--slide-marge-bloc`, `--slide-marge-ligne`) et densité des briques à 0,75. Un écran de
  cours imprime ses cartes sur une seule rangée.
- Ce qu'un gabarit révèle à l'écran étape par étape s'imprime en entier : le parcours de
  méthode imprime une fiche par étape, preuve et résultat compris, et masque sa navigation.
- L'en-tête annonce des fiches, et non un nombre de pages que le navigateur décide seul. Chaque
  fiche se distribue après la correction sur place de la précédente : en flux continu, une même
  feuille porterait la fin d'un exercice et le début de la fiche suivante, souvent la trace
  écrite qui y répond. Le flux continu a été mesuré à 95 pages de sujets au lieu de 138 sur les
  six cours, et écarté pour cette raison.
- Une fiche commence sur une nouvelle page, sauf dans deux cas où partager la page ne dévoile
  aucune réponse :
  - elle suit une fiche close par un exemple guidé, corrigé sur place : la fiche précédente n'a
    plus rien à cacher ;
  - elle se réduit à un écran dont le corrigé est donné à la suite (`reflexion`,
    `revelation`) : la question qui ouvre une notion ne répond pas à la fiche qui la précède.

  Un exercice qui suit un exercice, et le cours qui suit une question, gardent leur nouvelle
  page : au B2-02, l'Exercice 3 rappelle les résultats de l'Exercice 2 (« a = 3,8 et
  y = 716 k€ »), l'Exercice 5 donne la droite de l'Exercice 4 (« y = 43,89x + 564,4 »), et la
  trace écrite d'un cours répond à la question qui l'ouvre. L'en-tête « Fiche N / M » est
  imprimé dans le premier écran de sa fiche, pour ne jamais rester seul en bas d'une page.

- Le livret s'imprime hors du processus du pupitre : le pupitre l'ouvre dans un nouvel onglet
  (`_blank`, `noopener`), et sa route serveur (`app.routes.server.ts`) déclare
  `Cross-Origin-Opener-Policy: same-origin`, que `server.ts` pose sur la réponse. Le livret n'a
  plus d'`opener` ni de nom : chaque clic sur « Livret papier » ouvre un nouvel onglet.

## Consequences

- `e2e/cours-livret-impression.spec.ts` garde chacune de ces règles : voile, zoom, images,
  largeur fixe, marges entières, blocs d'un seul tenant rognés et sans ombre, légendes
  flottantes, hauteurs identiques d'une fenêtre à l'autre, fond blanc, gouttière, réglages de
  la projection, cartes de cours sur une rangée, aucun élément hors de son écran, parcours de
  méthode imprimé en entier et indépendant de son minuteur.
- `src/server/routes-client.spec.ts` vérifie que chaque route qui déclare des en-têtes les
  reçoit et que le pupitre et la projection n'en reçoivent pas ; `e2e/entetes-ssr.spec.ts`
  vérifie l'en-tête sur la réponse du serveur SSR construit.
- Un harnais WebKit (WKWebView sur le build de production, API simulée) suit le chemin du
  formateur : pupitre, « Livret papier », « Imprimer », enregistrement du PDF, en appliquant la
  règle de Safari aux pages cachées qui ne répondent plus. Sur le build d'avant le correctif,
  livret et pupitre partagent un processus, tué 3 s après l'ouverture du panneau, et aucun PDF
  ne sort. Après, les douze livrets (sujet et corrigé des six cours) sortent en A4 sans page
  blanche, chaque écran présent dans l'ordre, avec le nombre de pages que donne un remplissage
  glouton de leurs blocs insécables dans l'ordre : aucun livret ne peut en compter moins sans
  couper un bloc ou faire partager une page à deux fiches que la règle sépare.
- Imprimer à la suite les fiches qui le peuvent fait passer les six sujets de 141 à 122 pages
  au harnais WebKit (B2-02 : 23 à 19), sans changer les corrigés.
- `cours-livret.component.spec.ts` fixe les fiches imprimées à la suite du B2-02 et vérifie
  qu'aucune fiche qui dévoilerait une réponse ne l'est ; `e2e/cours-livret-impression.spec.ts`
  vérifie que seules les autres fiches reçoivent un saut de page.
- `e2e/banc/livret-impression.spec.ts` vérifie qu'aucun écran ne dépasse une page A4, que les
  écrans se tassent à plusieurs par page, le PDF ne comptant pas plus de pages qu'un tassement
  où chaque fiche imprimée à la suite continue la page de la précédente.
- Le nombre de pages reste décidé par le moteur : un texte qui ne se coupe pas aux mêmes mots
  dans les deux navigateurs peut encore faire changer une page. C'est le cas d'un tableau dont
  la largeur naturelle dépasse d'une fraction de pixel la place disponible : ses colonnes
  manquent de quelques centièmes de pixel, Safari laisse déborder le texte, Chrome le renvoie à
  la ligne. Le livret n'annonce donc pas de nombre de pages.
- Un réglage d'impression qui réduit la zone imprimable (en-têtes et pieds de page de Safari,
  marges personnalisées) change la pagination.
- Un nouveau gabarit ou une nouvelle brique ne doit ni dépendre de la fenêtre, ni déborder de
  sa boîte, ni poser une ombre portée imprimée.
