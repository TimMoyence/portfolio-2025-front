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

Source de verite : [`src/app/app.routes.ts`](./src/app/app.routes.ts) (et [`src/app/app.routes.server.ts`](./src/app/app.routes.server.ts) pour les `renderMode`).

### Pages publiques

- `/` — Home (landing page)
- `/presentation` — Page a propos
- `/projets` — Realisations
- `/articles` — Articles Morning-Brief publies par l'API
- `/offer` — Page des offres
- `/contact` — Formulaire de contact
- `/growth-audit` — Audit SEO automatise
- `/atelier`, `/atelier/meteo`, `/atelier/sebastian` — Redirections permanentes vers `/projets`

### Auth

- `/login` — Connexion
- `/register` — Inscription
- `/forgot-password` — Mot de passe oublie
- `/reset-password` — Reinitialisation
- `/verify-email` — Verification d'email (lien magique)
- `/profil` — Profil utilisateur (`authGuard`, rendu client)

### Ateliers — apps (protegees auth + role)

Apps reelles non indexables, en rendu client (`RenderMode.Client`).

- `/atelier/meteo/app` — App meteo (`authGuard` + `roleGuard("weather")`)
- `/atelier/sebastian/app` — App Sebastian (`authGuard` + `roleGuard("sebastian")`) avec sous-routes : `dashboard`, `rapports`, `badges`, `historique`, `objectifs`

Le sitemap ajoute les slugs d'articles publies quand `PORTFOLIO_ARTICLE_API_URL` pointe vers le backend public (`.../api/v1/portfolio25`). Sans cette variable, il reste statique et ne publie aucune URL inventee.

### Formations

- `/formations` — Liste des formations
- `/formations/ia-solopreneurs` — Formation IA Solopreneurs (slides)
- `/formations/ia-solopreneurs/toolkit` — Toolkit IA Solopreneurs (capture email)
- `/formations/ia-solopreneurs/toolkit/:token` — Toolkit personnalise (acces direct via token, rendu serveur on-demand)
- `/formations/automatiser-avec-ia` — Formation Automatiser avec l'IA (slides)
- `/formations/automatiser-avec-ia/toolkit` — Toolkit Automatiser avec l'IA
- `/formations/audit-seo-diy` — Formation Audit SEO DIY (slides)
- `/formations/audit-seo-diy/toolkit` — Toolkit Audit SEO DIY

### Utilitaires

- `/cookie-settings` — Parametres cookies
- `/terms` — CGU
- `/privacy` — Politique de confidentialite
- `/commonbudgetTM` — Redirection vers l'accueil `/`
- `/slides/library` — Bibliotheque de slides interne (`noindex, nofollow`)
- `/**` — 404

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
npm run test:cov
npm run build
npm run ci:check
```

## Hooks Git et verrous locaux

Apres `npm ci`, Husky installe automatiquement trois hooks :

- `pre-commit` : lance `lint-staged` pour formatter et lint uniquement les fichiers indexes ;
- `commit-msg` : impose un message au format Conventional Commit ;
- `pre-push` : lance `npm run pre-push:check` (lint + format:check + typecheck + test:ci, sans build) pour bloquer un push sale.

Ces hooks ne remplacent pas la CI, ils evitent surtout d'introduire une regression evidente dans l'historique local.

## Internationalisation (i18n)

Le frontend est localise `fr` (langue source) et `en`. Deux fichiers different par
format et par role :

- `src/locale/messages.xlf` — XLIFF 1.2 (`trans-unit`), source **francaise**,
  entierement regeneree par extraction : aucune edition manuelle.
- `src/locale/messages.en.xlf` — XLIFF 2.0 (`unit`/`segment`/`target`), traduction
  **anglaise**, maintenue a la main : l'extraction ne touche jamais ce fichier.

Flux a suivre a chaque ajout ou modification d'un texte marque `i18n="..."` ou
`$localize` :

1. Extraire la source francaise :

   ```bash
   npm run extract-i18n
   ```

   Cette commande regenere entierement `src/locale/messages.xlf` a partir du code
   source : elle ajoute les nouveaux `trans-unit`, retire ceux dont l'id a disparu
   et rafraichit les numeros de ligne des `context-group` existants. Ne jamais
   editer ce fichier a la main.

2. Reporter chaque `trans-unit` nouveau ou modifie dans `src/locale/messages.en.xlf`,
   en convertissant le format XLIFF 1.2 vers XLIFF 2.0 :
   - `<trans-unit id="X" datatype="html">` devient `<unit id="X">` ;
   - `<note priority="1" from="meaning">V</note>` devient
     `<note category="meaning">V</note>` (idem pour `from="description"` →
     `category="description"`) ; un `trans-unit` avec plusieurs `context-group`
     donne plusieurs `<note category="location">chemin:lignes</note>`, un par
     `context-group` ;
   - un placeholder `<x id="ID" equiv-text="TEXTE"/>` devient
     `<ph id="0" equiv="ID" disp="TEXTE"/>` (le `id` du `<ph>` est numerique et
     repart de `0` a chaque unite ; `equiv` recoit l'ancien `id`, `disp` l'ancien
     `equiv-text`) ; le meme `<ph>` doit apparaitre a l'identique dans `<source>`
     et dans `<target>` ;
   - ecrire un `<target>` anglais naturel, en conservant les espaces significatifs
     de tete/fin du `<source>` et en normalisant la ponctuation francaise (espace
     avant `:`/`;`/`?`) a l'usage anglais standard.
   - Retirer un `trans-unit` de `messages.xlf` (id disparu du code source) doit
     retirer l'`unit` correspondante de `messages.en.xlf`.

3. Verifier qu'il ne reste aucun avertissement de traduction manquante :

   ```bash
   npm run build
   ```

   Inspecter la sortie : `0` occurrence de `No translation found` doit apparaitre
   pour la locale `en`. Un id present dans `messages.xlf` sans `unit` correspondante
   (ou dont le `<target>` est absent) declenche cet avertissement au build.

## Gouvernance depot

- Le proprietaire de code est defini dans [`.github/CODEOWNERS`](./.github/CODEOWNERS).
- Les regles de protection de branche a appliquer sur GitHub sont documentees dans [`docs/repository-governance.md`](./docs/repository-governance.md).
- Les decisions d'architecture sont historisees dans [`docs/adr`](./docs/adr).

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
- [Gouvernance du depot](./docs/repository-governance.md)
- [ADR](./docs/adr/README.md)
- [Garde-fous agent](./AGENTS.md)
