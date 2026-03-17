# Gouvernance du depot Frontend

Ce document decrit les regles distantes a appliquer sur GitHub pour garder `master` protege. Ces regles ne peuvent pas etre forcees uniquement par des fichiers de repo : elles doivent etre configurees dans l'interface GitHub du depot.

## CODEOWNERS

- Le fichier source de verite est [`.github/CODEOWNERS`](../.github/CODEOWNERS).
- Toute PR touchant le code ou la documentation doit demander une revue du proprietaire declare.

## Regle de protection cible

Branche cible : `master`

Parametres recommandes :

- interdire les pushes directs sur `master` ;
- exiger une pull request avant merge ;
- exiger au moins 1 approbation ;
- exiger une revue CODEOWNERS ;
- invalider les reviews obsoletes apres nouveau push ;
- exiger la resolution des conversations ;
- exiger une branche a jour avant merge ;
- interdire les merges en force et la suppression de branche protegee.

## Checks obligatoires

Les checks a rendre obligatoires dans GitHub sont :

- `quality-gate`
- `security`

`docker` et `deploy` ne doivent pas etre requis au merge, car ils ne tournent que sur `push` vers `master`.

## Regle de maintenance

- Toute evolution des jobs CI doit conserver des noms de checks stables ou mettre a jour ce document dans le meme commit.
- Toute evolution d'ownership ou de responsabilite doit mettre a jour `CODEOWNERS`.
