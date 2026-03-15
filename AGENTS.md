# AGENTS.md

## Portee

Ces instructions s'appliquent a tout le code sous `portfolio-2025-front`.

## Protocole obligatoire avant toute execution

1. Avant toute commande, toute lecture approfondie, toute modification, tout test, tout build, toute installation ou toute suppression, l'agent produit un plan explicite, meme si l'utilisateur ne le demande pas.
2. Ce plan doit couvrir au minimum :
   - l'objectif et le resultat attendu ;
   - les zones impactees (`core`, `features`, `shared`, `assets`, `styles`, `i18n`, `config`) ;
   - les fichiers ou composants probablement touches ;
   - les tests, verifications et commandes prevus ;
   - les risques UX, accessibilite, SSR, responsive, i18n et regressions.
3. L'execution peut commencer apres ce plan sans validation supplementaire, sauf si la demande est ambigue, destructive ou a fort impact.
4. Si le scope change, l'agent reformule le plan avant de poursuivre.

## Stack imposee

- Angular 19
- TypeScript strict
- Angular SSR / prerender
- RxJS
- SCSS
- Tailwind CSS
- Jasmine / Karma
- Angular CLI
- `npm` et `package-lock.json`

L'agent respecte strictement cette stack. Il n'introduit pas React, Vue, un state manager externe, une lib HTTP concurrente ou un autre gestionnaire de paquets sans demande explicite.

## Architecture non negociable

- Respecter le decoupage existant :
  - `core` pour les models, ports, adapters, config, HTTP et services transverses ;
  - `features` pour les ecrans et cas d'usage UI ;
  - `shared` pour les composants et modeles reutilisables.
- Appliquer DDD et Clean Architecture cote front :
  - les ports definissent les dependances de l'application ;
  - les adapters implementent les acces HTTP et integrations externes ;
  - les composants ne doivent pas embarquer de logique d'infrastructure ou de plomberie reseau.
- Appliquer DRY :
  - mutualiser les comportements repetes ;
  - ne pas dupliquer les appels HTTP, les mappings, les contrats ou les etats UI.
- Appliquer KISS :
  - privilegier une composition Angular simple et lisible ;
  - pas de sur-ingenierie, pas d'abstraction speculative, pas de pattern invente si Angular fournit deja la solution.

## TDD obligatoire

- Tout changement de comportement doit commencer par un test cible qui echoue, ou par l'ajout/la mise a jour immediate d'un test avant l'implementation finale.
- Priorite des tests :
  - specs des adapters, services et ports ;
  - specs des composants pour la logique, les etats et les interactions critiques ;
  - tests de regression pour les bugs UI deja observes.
- Pour les changements purement visuels, l'agent couvre au minimum la logique et les etats critiques et documente ce qui a ete verifie manuellement si necessaire.

## Regles de code

- JSDoc obligatoire sur :
  - services, adapters, interceptors et tokens exportes ;
  - fonctions exportees ou utilitaires non triviaux ;
  - logique de transformation ou d'orchestration RxJS non evidente ;
  - composants dont le contrat, les invariants ou le comportement SSR/i18n merite une explication.
- Les commentaires expliquent le pourquoi, pas l'evidence.
- Le code doit rester compatible SSR et prerender :
  - aucun acces direct a `window`, `document`, `localStorage`, `navigator` ou APIs navigateur sans garde explicite.
- Toute UI asynchrone gere au minimum les etats `loading`, `success`, `error` et, quand pertinent, `empty`.
- L'accessibilite n'est pas optionnelle : structure semantique, labels, focus, clavier et contenu visible doivent rester corrects.
- Les textes, metadata SEO et localisations doivent rester coherents avec `src/locale` et les fichiers de contenu associes.

## Definition de termine orientee entreprise

Une tache n'est pas terminee tant que tous les points suivants ne sont pas satisfaits :

- `package.json` est aligne avec la realite du projet.
- Les scripts CI utiles existent et restent coherents avec la stack. Au minimum : `lint`, `test`, `typecheck`, `build`. Si un script manque ou n'est pas exploitable en mode non interactif, l'agent l'ajoute ou l'aligne avant de conclure.
- Le lint passe.
- Les tests pertinents passent.
- Le typecheck passe.
- Le build passe.
- La documentation impactee est mise a jour.
- Les fichiers d'environnement, de configuration, d'i18n, de SEO et les scripts restent coherents.

### Verification minimale attendue

- `npm run lint`
- `npm run test -- --watch=false --browsers=ChromeHeadless`
- `npm run typecheck`
- `npm run build`

### Verification additionnelle selon l'impact

- Si le contenu utilisateur, les textes ou les routes localisees changent :
  - `npm run extract-i18n` ou mise a jour equivalente de la chaine i18n du projet
- Si le rendu SSR, les meta tags, les assets critiques ou le prerender changent :
  - verifier explicitement que le build SSR/prerender reste sain et que le rendu ne casse pas hors navigateur

L'agent ne doit jamais declarer une tache "terminee" si une verification attendue n'a pas ete executee ou si un blocage n'est pas explique precisement.

## Exigence production-ready

- Aucune secret, cle, mot de passe, URL sensible ou configuration environnement-specifique en dur dans le code.
- Toute configuration passe par les fichiers d'environnement, la configuration Angular et les tokens appropries.
- Les erreurs HTTP et erreurs d'usage sont gerees proprement avec retour utilisateur explicite et sans fuite d'information sensible.
- Aucun `console.log` residuel, aucun code mort, aucun composant partiellement branche.
- Le responsive doit rester propre sur mobile et desktop.
- Le design doit respecter le systeme existant : Angular, SCSS, Tailwind, tokens et conventions du projet.
- Tout changement de comportement, de configuration, de scripts, de SEO, d'i18n, de routes ou d'architecture doit mettre a jour `README.md` et toute documentation utile du projet.
- Le code livre doit etre directement deployable et maintenable, sans TODO bloquant ni hypothese implicite non documentee.

## Regles de sortie

- Le compte-rendu final doit indiquer ce qui a ete modifie, quelles verifications ont ete executees et quels risques residuels subsistent.
- Si une verification ne peut pas etre executee localement, l'agent doit citer la commande precise et la raison exacte.
