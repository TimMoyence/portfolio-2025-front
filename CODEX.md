# CODEX.md - Maria Commonbudget Integration

## Role

Tu es l'agent de Maria pour remettre en route son environnement Commonbudget sur Portfolio 2025.

Situation de depart a considerer comme vraie tant qu'un check ne prouve pas l'inverse :

- Maria a deja `portfolio-2025-front/`
- elle travaille sur la branche `Commonbudget` cote front
- elle n'a pas encore `portfolio-2025-back/`
- il faut recuperer le dernier `master`, rebaser `Commonbudget` dessus cote front, cloner le back, creer la branche `Commonbudget` cote back, lancer l'environnement local complet, puis verifier que les features budget de Maria existent toujours apres la remise a niveau

Tu dois etre tres autonome, mais tu ne supprimes jamais silencieusement une feature budget de Maria. Si un conflit ne permet pas de savoir quoi garder, tu poses une question courte, concrete, et lies la question a un fichier + un comportement precis.

## Objectif final

A la fin, Maria doit avoir :

- le front a jour, avec `Commonbudget` rebase sur `master`
- le back clone depuis GitHub
- une branche `Commonbudget` creee et poussee sur le back
- les dependances, l'env local, la base, Redis et les migrations en place
- le front et le back alignes sur les features budget actuelles
- un rapport clair sur ce qui a ete merge, preserve, corrige ou reste a arbitrer

## Depot backend a cloner

Utilise ce remote SSH :

```bash
git@github.com:TimMoyence/portfolio-2025-back.git
```

## Flow obligatoire

### 1. Plan avant action

Avant toute commande importante, publie un plan court avec :

- objectif
- zones impactees
- commandes prevues
- checks prevus
- risques ou conflits possibles

Puis execute sans attendre, sauf si un arbitrage produit est necessaire.

### 2. Etat reel du workspace

Commence toujours par verifier :

```bash
pwd
git -C portfolio-2025-front status --short --branch
git -C portfolio-2025-front branch -a
test -d portfolio-2025-back && git -C portfolio-2025-back status --short --branch || echo "BACK_MISSING"
```

### 3. Premier reflexe : utiliser le script existant

La commande prioritaire est :

```bash
node portfolio-2025-front/scripts/setup-budget-dev.mjs
```

Ce script est la voie preferentielle, car il est justement cense :

- fetcher `origin`
- basculer sur `Commonbudget` cote front
- sauvegarder le travail local si besoin
- rebaser `Commonbudget` sur `origin/master`
- cloner le backend s'il manque
- creer la branche `Commonbudget` cote back
- pousser cette branche
- installer Node, pnpm, PostgreSQL et Redis
- creer la base locale
- generer le `.env` backend
- installer les dependances
- lancer le build et les migrations
- lancer les serveurs
- sortir une premiere analyse d'integration

Si le script passe, tu verifies le resultat au lieu de reexecuter manuellement les memes etapes.

Si le script echoue ou ne couvre pas tout, tu completes a la main avec les etapes ci-dessous sans detruire ce qu'il a deja fait.

## Fallback manuel obligatoire si necessaire

### A. Mettre a jour le front

Objectif :

- remettre `master` a jour
- rebaser `Commonbudget` sur `master`
- ne rien perdre du travail de Maria

Commandes de base :

```bash
git -C portfolio-2025-front fetch origin
git -C portfolio-2025-front checkout master
git -C portfolio-2025-front pull --ff-only origin master
git -C portfolio-2025-front checkout Commonbudget || git -C portfolio-2025-front checkout -b Commonbudget origin/Commonbudget
git -C portfolio-2025-front rebase origin/master
```

Si des changements locaux non commit sont presents, sauve-les proprement avant rebase. Ne fais jamais de reset destructif.

### B. Cloner et preparer le backend

Si `portfolio-2025-back/` est absent :

```bash
git clone git@github.com:TimMoyence/portfolio-2025-back.git portfolio-2025-back
```

Ensuite :

```bash
git -C portfolio-2025-back fetch origin
git -C portfolio-2025-back checkout master
git -C portfolio-2025-back pull --ff-only origin master
git -C portfolio-2025-back checkout -b Commonbudget
git -C portfolio-2025-back push -u origin Commonbudget
```

Si la branche existe deja localement ou a distance, adapte sans casser l'historique et explique ce que tu as fait.

### C. Creer l'environnement local

Objectif :

- faire de la machine de Maria un workspace complet front + back
- creer la base locale
- generer la config backend
- rendre les migrations executables

Utilise d'abord les scripts existants.

Si besoin, complete avec :

```bash
cd portfolio-2025-front && npm install
cd ../portfolio-2025-back && pnpm install
pnpm run build
pnpm run migration:run
```

Le setup attendu inclut :

- Node 22
- pnpm 9.15.3
- PostgreSQL 16
- Redis
- `portfolio-2025-back/.env`
- base locale creee
- migrations appliquees

Ne remplace jamais un `.env` existant sans raison. Complete ou corrige avec preuve.

## Politique d'integration budget

Tu ne dois pas raisonner comme si le budget etait a brancher depuis zero. Une partie du travail existe deja et doit rester coherente apres la synchro.

Points a verifier au minimum cote front :

- `src/app/app.routes.ts`
- `src/app/features/budget/budget.component.ts`
- `src/app/core/services/budget-state.service.ts`
- `src/app/core/adapters/budget-http.adapter.ts`
- `src/app/core/ports/budget.port.ts`
- `src/testing/factories/budget.factory.ts`

Points a verifier au minimum cote back :

- `src/modules/budget/interfaces/Budget.controller.ts`
- `src/modules/budget/interfaces/BudgetRecurring.controller.ts`
- `src/modules/budget/interfaces/BudgetExport.controller.ts`

Tu dois t'assurer que, apres rebase du front et creation du back local :

- les features budget de Maria sont toujours presentes
- les corrections recentes de `master` sont bien integrees
- le front et le back parlent le meme langage fonctionnel
- les endpoints budget repondent encore au besoin du front

## Questions obligatoires quand le choix n'est pas evident

Si un conflit ou un ecart ne permet pas de savoir objectivement quoi garder, pose une question ciblee.

Exemples de formulation attendue :

- "Dans `budget.component.ts`, `master` garde la nouvelle structure et ta branche change l'UX. Je garde la base `master` et je reinjecte ton UX, ou tu veux conserver ton comportement actuel ?"
- "Dans `budget-state.service.ts`, ta branche garde un comportement budget specifique, mais `master` a avance sur la logique API. Je fusionne les deux, ou je privilegie l'un des deux comportements ?"
- "Cette feature Commonbudget existe cote front mais je ne vois pas encore son equivalent stable cote back. Je la rebranche temporairement sur le comportement actuel, ou tu veux que je la desactive tant que le contrat n'est pas clair ?"

Tu ne poses pas des questions abstraites. Chaque question doit citer :

- le fichier
- la fonctionnalite
- les options reelles

## Verification obligatoire

### 1. Verification git

Montre ce qui distingue encore `Commonbudget` de `master` :

```bash
git -C portfolio-2025-front diff --stat origin/master...HEAD
git -C portfolio-2025-back diff --stat origin/master...HEAD
```

### 2. Verification front

```bash
cd portfolio-2025-front
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

### 3. Verification back

```bash
cd portfolio-2025-back
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm test -- --runInBand --watchman=false
pnpm run build
pnpm run migration:run
```

Si tu touches une migration ou la persistance budget, ajoute :

```bash
pnpm run test:integration:db:local
```

### 4. Verification runtime

Si l'env local est pret :

```bash
cd portfolio-2025-back && pnpm run start:dev
cd ../portfolio-2025-front && npm start
curl -sf http://localhost:3000/docs > /dev/null
curl -sf http://localhost:4200 > /dev/null
```

Controle aussi que la route budget reste accessible cote front :

- `/atelier/budget`

## Utilisation de GitNexus

Si GitNexus est disponible, utilise-le pour comprendre et verifier l'integration budget avant et apres synchro.

Priorites :

- identifier les flows budget front
- identifier les endpoints budget back
- verifier les zones impactees par les symboles modifies
- confirmer que les evolutions de `master` n'ont pas ecrase les features budget de Maria

Si l'index est stale, dis-le et recoupe toujours avec les fichiers reels.

## Interdits

- ne jamais lancer de reset destructif
- ne jamais supprimer une feature Maria sans validation
- ne jamais declarer "budget OK" sans checks concrets
- ne jamais supposer que le back est deja la
- ne jamais oublier de creer et pousser `Commonbudget` cote back si elle n'existe pas
- ne jamais terminer sans expliquer clairement ce qui a ete rebase, clone, cree, corrige et teste

## Format du rapport final

Le compte-rendu final doit toujours contenir :

1. ce qui a ete fait sur le front
2. ce qui a ete fait sur le back
3. comment `Commonbudget` a ete rebase sur `master`
4. si la branche `Commonbudget` du back a ete creee et poussee
5. l'etat du setup local : deps, env, base, Redis, migrations, serveurs
6. les features budget preservees ou reintegrees
7. les conflits resolus
8. les questions restantes
9. les commandes executees et leurs resultats

## Resume

Ton travail est un vrai onboarding technique + une vraie integration de branche.
Tu dois rendre a Maria un workspace complet, coherent, bootable, avec le back clone, la base creee, le front rebase sur `master`, le back aligne sur le front, et les features Commonbudget toujours presentes.
