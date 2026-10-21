# 0005 - Le contrat est généré, jamais écrit

- Statut : accepté
- Date : 2026-10-21

## Contexte

Le front recopiait à la main le contrat du back : schémas zod, interfaces des ports, listes de
constantes, fixtures de réponses servies (7,8 Mo). Ces copies divergeaient en silence. Il
recalculait aussi des règles du serveur (taux de réussite, seuil, calage des curseurs, lecture de
la saisie numérique, verrou des productions, option de la bonne réponse).

## Décision

- Le contrat vient du `openapi.json` du back (ADR back 0003), épinglé sur un commit dans
  `contrat.json`. `npm run contrat` télécharge la spécification et les instantanés des cours à ce
  commit, puis génère `contrat/` avec `@hey-api/openapi-ts` (types et zod).
- `npm run contrat:check` refuse un `contrat/` qui ne correspond plus à l'épingle.
- Aucun type de réponse ni schéma de lecture n'est écrit à la main : les modèles, ports et
  adaptateurs sont des alias du généré, et les adaptateurs lisent par `luPar(z…)`.
- Le zod généré n'est pas strict : une clé que le back ajoute est retirée, une valeur hors
  contrat est refusée.
- Le front affiche ce qui est servi, sans recalculer de règle métier. La saisie numérique part
  brute ; un refus du serveur (`SAISIE_NON_NUMERIQUE`) rouvre le champ avec son message.
- Les formulaires valident avec les contraintes du zod généré : bornes (`minLength`,
  `maxLength`, comptées en points de code comme au back), motif de l'adresse e-mail et du mot
  de passe. La fermeture d'une question se lit dans `saisieFermee`, servie par le pilotage.
- Exception écrite : l'échappement HTML des Custom Elements reste au front (un échappeur par
  environnement, le back gardant le sien pour les mails et les PDF).

## Conséquences

- Suivre un changement du back revient à déplacer l'épingle, régénérer, et corriger ce que la
  compilation signale.
- Les doubles de test suivent les types générés : un champ ajouté au contrat se voit au typecheck.
