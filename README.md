# Portfolio 2025 Frontend

Application Angular 19 du portfolio. Le frontend est SSR, localise en `fr` et `en`, et structure autour d'une separation nette entre features UI, composants partages et infrastructure.

## Stack

- Angular 19 avec standalone components
- TypeScript strict
- Angular SSR / prerender
- RxJS
- SCSS + Tailwind CSS
- Jasmine / Karma
- ESLint + Prettier

## Architecture

Le frontend est organise en trois zones principales :

- `src/app/core` : ports, adapters HTTP, interceptors, SEO, configuration et services transverses.
- `src/app/features` : pages, parcours utilisateur et orchestration d'ecrans.
- `src/app/shared` : composants reutilisables, modeles partages et directives communes.

Regle non negociable : un composant peut orchestrer de l'etat UI, mais pas embarquer de logique d'infrastructure qui doit vivre dans `core`.

## Cartographie des routes

Les routes principales exposees aujourd'hui sont :

- `/` et `/home`
- `/presentation`
- `/offer`
- `/contact`
- `/client-project`
- `/growth-audit`
- `/login` et `/register`
- `/cookie-settings`
- `/terms` et `/privacy`

## Prise en main rapide

```bash
npm ci
npm run start
```

Commandes utiles :

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:ci
npm run build
npm run ci:check
```

## Hooks Git et verrous locaux

Apres `npm ci`, Husky installe automatiquement trois hooks :

- `pre-commit` : lance `lint-staged` pour formatter et lint uniquement les fichiers indexes ;
- `commit-msg` : impose un message au format Conventional Commit ;
- `pre-push` : lance `npm run ci:check` pour bloquer un push sale.

Ces hooks ne remplacent pas la CI, ils evitent surtout d'introduire une regression evidente dans l'historique local.

## Garde-fous qualite

Chaque lot de changement coherent doit idealement valider :

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`

## Standards de contribution

- Les commentaires de code, la documentation, les descriptions de PR et les messages de commit sont rediges en francais par defaut.
- Les commits doivent rester atomiques : un sujet, un commit.
- Les messages suivent le format Conventional Commits, par exemple `feat(auth): ajoute le guard de refresh token`.
- Les hooks Git locaux font partie de la definition de done. Si un hook casse, on corrige la cause au lieu de le contourner.
- Toute evolution de route, contrat, architecture ou workflow implique une mise a jour de la documentation associee.
- Les contraintes SSR, accessibilite et i18n ne doivent jamais etre contournees pour livrer vite.

## Documentation

- [Guide de contribution](./CONTRIBUTING.md)
- [Standards d'ingenierie](./docs/engineering-standards.md)
- [Garde-fous agent](./AGENTS.md)
