# Contribution

## Langue de travail

Le francais est la langue par defaut pour les nouveaux commentaires, la documentation, les descriptions de PR, les notes d'architecture et les messages de commit, sauf besoin explicite contraire.

## Discipline de commit

- Un lot de changement coherent = un commit atomique.
- Ne pas melanger refactor, feature et formatage non lie dans le meme commit.
- Utiliser les Conventional Commits : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Preferer des messages du type `type(scope): resume`.

## Attendus d'architecture

- `core` porte les ports, adapters, l'integration HTTP, les tokens de config, les services transverses et la plomberie SEO.
- `features` porte les parcours utilisateur et l'orchestration des pages.
- `shared` porte les composants de presentation reutilisables et les view models communs.
- La logique d'infrastructure ne doit pas fuir dans les composants de route ou de presentation.

## Standards de code

- Appliquer DRY sans sur-abstraction : on factorise la duplication reelle, pas la ressemblance ponctuelle.
- Appliquer DDD et Clean Architecture de maniere pragmatique pour garder des frontieres stables.
- Ajouter du JSDoc sur les services, adapters, interceptors, utilitaires non triviaux et contrats a invariants importants.
- Gerer explicitement les etats asynchrones UI : `loading`, `success`, `error` et `empty` quand pertinent.
- Preserver la compatibilite SSR. Toute API navigateur doit etre protegee.
- Considerer tout contenu externe comme non fiable. Aucun HTML arbitraire ni contenu IA ne doit etre rendu sans sanitization et justification claire.

## Tests et verification

Avant d'ouvrir une PR, lancer idealement :

```bash
npm run ci:check
```

Les hooks Git suivants tournent automatiquement apres installation des dependances :

- `pre-commit` via `lint-staged` ;
- `commit-msg` via `commitlint` ;
- `pre-push` via `npm run ci:check`.

Si une verification ne peut pas etre executee, documenter la commande exacte et le blocage reel.

## Definition of Done

Une tache n'est pas terminee tant que :

- les tests pertinents passent ;
- lint, format, typecheck et build passent ;
- la documentation impactee est a jour ;
- accessibilite, SSR, responsive et i18n ont ete pris en compte ;
- le changement est committe comme une unite coherente.
- si l'architecture, les conventions ou la gouvernance evoluent, un ADR ou la documentation de gouvernance a ete mis a jour.
