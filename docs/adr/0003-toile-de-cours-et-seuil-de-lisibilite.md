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
- Au poste étudiant, la réduction ne descend jamais sous 0,8 (`ECHELLE_LISIBLE`). Au-delà, le
  contenu garde l'échelle 0,8, la toile s'aligne en haut et c'est la page qui défile
  (`cours-presentation--defilante`) ; aucun composant ne défile en interne.
- La projection et l'aperçu du pupitre continuent de tout faire tenir dans la toile, quelle que
  soit la réduction.

## Consequences

- Le test « T2 · T3 · G01 » de `cours-presentation.component.spec.ts` monte chaque écran du
  B2-01 réel dans les trois rendus et échoue sur tout élément perdu, tout défilement interne ou
  toute échelle inférieure à 0,8.
- Un écran étudiant très long défile verticalement : c'est assumé, plutôt qu'un texte réduit
  sous le seuil de lecture.
- Un nouveau gabarit doit lire les variables de marge et de densité, sans quoi la toile ne peut
  pas le densifier et il sera réduit, ou défilera côté étudiant.
