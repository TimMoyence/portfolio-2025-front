# 0003 - Toile de cours : mise à l'échelle et seuil de lisibilité étudiant

- Statut : accepte
- Date : 2026-09-24

## Contexte

Un écran de cours se dessine sur une toile fixe de 1280 × 720, la même pour le poste étudiant,
l'aperçu du pupitre et la projection (`cours-presentation.component.ts`). Quand le contenu dépasse
la hauteur de la toile, il est réduit pour tenir. Sur les écrans les plus denses du B2-01, cette
réduction descendait jusqu'à 0,35 : lisible sur un vidéoprojecteur, illisible sur le portable
14 pouces d'un étudiant (viewports CSS 1280 × 720 à 1512 × 982).

## Decision

- Le contenu de la toile est d'abord densifié plutôt que réduit : la toile impose aux gabarits
  Angular des marges nulles (`--slide-marge-bloc`, `--slide-marge-ligne`) et aux briques runtime
  une densité resserrée (`--fp-densite-imposee`, `--fp-echelle-imposee`, `--fp-titre-impose`,
  `--fp-marge-carte-imposee`), plus serrée encore dans la demi-toile d'un renvoi.
- Au poste étudiant, la réduction du contenu ne descend jamais sous 0,8 (`ECHELLE_LISIBLE`)
  quand la toile est réduite ; quand elle est agrandie, c'est la taille affichée (échelle de la
  toile × réduction) qui ne descend jamais sous 0,8, et la réduction peut aller jusqu'à
  `0,8 ÷ échelle de la toile`. Au-delà, le contenu garde
  cette taille, la toile s'aligne en haut et le cadre de l'écran défile
  (`cours-presentation--defilante`, `.student-session__cadre`), la navigation restant visible ;
  aucune brique ne défile en interne, hors l'exception du tableau large (amendement du
  2026-10-14).
- Au poste étudiant, la toile garde 1280 de large mais prend toute la hauteur du cadre quand
  celui-ci est plus haut que le 16:9 (`hauteurDeToile`) : sur un portable 14 pouces
  (cadre 1480 × 913), cette hauteur sert au contenu au lieu de rester en bandes vides.
- La projection et l'aperçu du pupitre continuent de tout faire tenir dans la toile, quelle que
  soit la réduction.

## Consequences

- Le test « T2 · T3 · G01 » de `cours-presentation.component.spec.ts` monte chaque écran du
  B2-01 réel dans les trois rendus et échoue sur tout élément perdu, tout défilement interne ou
  toute échelle inférieure à 0,8.
- Le test « G01 · sur un portable 14 pouces » monte chaque écran étudiant du B2-01 dans le cadre
  mesuré sur un 14 pouces (1480 × 913) et échoue sur tout défilement, tout élément hors toile ou
  toute taille affichée inférieure à 0,8.
- Un écran étudiant très long défile verticalement : c'est assumé, plutôt qu'un texte réduit
  sous le seuil de lecture.
- Un nouveau gabarit doit lire les variables de marge et de densité, sans quoi la toile ne peut
  pas le densifier et il sera réduit, ou défilera côté étudiant.

## Amendement du 2026-10-14 : tableaux larges et briques au téléphone

Contexte : en QA prod, une feuille de onze colonnes perdait sa colonne K sur un ordinateur
1920, et au téléphone des formules du corrigé élargissaient la brique jusqu'à faire défiler la
page en largeur. Décision de Tim : « Élargir, sinon défiler ».

- Au poste étudiant, un contenu plus large que la toile élargit la carte, comme la projection,
  jusqu'à `1 ÷ réduction lisible` (`plafondDElargissement`) : la taille affichée ne passe jamais
  sous 0,8.
- Un tableau qui reste plus large que la carte défile seul dans `.defileur-de-tableau`
  (`src/cours/runtime/core/defileur.ts`, `src/cours/runtime/design/defileur.ts`, composant
  `app-defileur-de-tableau`) : ombre au bord tant qu'il reste une suite (`data-suite-avant`,
  `data-suite-apres`), en-têtes de ligne figés, colonne figée resserrée sous 40 rem. C'est la
  seule brique qui défile en interne, avec le graphique au téléphone (amendement suivant) ;
  consignes, boutons et verdicts restent à la largeur de la carte.
- Les règles étroites des gabarits Angular (`etroite-a-l-ecran`, `_slide-toile.scss`) dépendent
  de la largeur de la toile du téléphone (`@container toile-compacte`) et non plus de la
  fenêtre : la projection, le pupitre et l'ordinateur gardent leur toile de 1280, même quand un
  renvoi en réduit la colonne principale.
- Dans les briques, un texte sans point de coupure (formule, référence) se coupe
  (`overflow-wrap: anywhere` sur `.fp-root`), sauf dans un tableau qui défile, où les mots
  restent entiers ; une scène (`.fp-scene`) a une colonne `minmax(0, 1fr)` et un champ ne
  dépasse jamais son conteneur.

Conséquences :

- « QP-03 » de `cours-presentation.component.spec.ts` monte chaque écran à tableau de tous les
  cours servis à 1920, 1366 et 390 : tableau entier à 1920, sinon défileur avec ombre et
  en-têtes figés, jamais de réduction sous le seuil.
- « QP-08 » monte chaque écran de tous les cours servis au téléphone, servi, avec l'option la
  plus longue choisie, puis corrigé révélé : rien ne dépasse la carte, et aucun mot du texte
  courant n'est coupé.

## Amendement du 2026-10-14 : graphiques et écran rappelé

Contexte : au téléphone, les valeurs d'un graphique serré se masquaient faute de place, et
l'écran rappelé (`renvoi`) n'était qu'une miniature de la projection, aux graduations de 3 px ;
au prix du sac du B2-01, le tracé n'avait que 61 px de haut en projection. Décisions de Tim :
« Défiler en largeur », « Pleine largeur », « Tracé d'au moins 12 rem ».

- Au téléphone, un graphique trop serré pour écrire chaque valeur glisse en largeur dans
  `app-defileur-de-tableau`, comme un tableau ; son axe des valeurs reste figé
  (`data-colonne-fixe`). Aux autres postes, il tient dans sa carte : une valeur ou une abscisse
  qui sortirait du tracé s'y décale, un marqueur ne dépasse pas sa barre, et ce qui touche
  encore n'est écrit qu'une fois sur deux (« Décaler, sinon une sur deux », « Une sur deux »),
  graduations comprises.
- Au téléphone, l'écran rappelé s'affiche au-dessus de la question, en pleine largeur et à sa
  propre taille, comme un écran ordinaire : plus aucune miniature de la projection.
- Le tracé d'un graphique mesure au moins 12 rem de haut à chaque poste : la projection et le
  pupitre réduisent l'écran pour tenir ; le poste étudiant défile s'il le faut, selon la règle
  de cette décision. Dans la toile, le graphique lit les marges qu'elle impose
  (`--slide-marge-bloc`, `--slide-marge-ligne`) au lieu des siennes : le prix du sac du B2-01
  tient ainsi à 0,93 au lieu de 0,75.

Conséquences :

- « QP-02 · QP-18 · QP-21 » de `cours-presentation.component.spec.ts` monte chaque graphique de
  tous les cours servis en projection, au pupitre, sur un 14 pouces et au téléphone : aucun
  libellé collé, aucune valeur sur une forme qui n'est pas la sienne, aucun tracé sous 12 rem ;
  « QP-18 » vérifie au téléphone que chaque valeur est écrite et l'axe toujours en vue.
- « QP-20 » monte chaque écran à renvoi de tous les cours servis au téléphone : renvoi à au
  moins 0,8, de la largeur de la question, au-dessus d'elle.
