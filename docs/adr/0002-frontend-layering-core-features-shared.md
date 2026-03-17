# 0002 - Structuration frontend en core features shared

- Statut : accepte
- Date : 2026-03-17

## Contexte

Le portfolio combine routes, composants reutilisables, integration HTTP, SEO, SSR et i18n. Sans frontieres simples, la logique d'infrastructure fuit facilement dans les composants de page.

## Decision

Le frontend conserve trois zones principales :

- `core` pour les ports, adapters, services techniques, SEO et configuration ;
- `features` pour les parcours utilisateur et les pages ;
- `shared` pour les composants de presentation et modeles reutilisables.

La logique d'infrastructure ne doit pas vivre dans `features` ou `shared`.

## Consequences

- Le code devient plus facile a lire pour un nouveau contributeur.
- Les refactors transverses sont moins risqués.
- Une nouvelle abstraction n'est justifiee que si elle respecte ce decoupage et retire un vrai couplage.
