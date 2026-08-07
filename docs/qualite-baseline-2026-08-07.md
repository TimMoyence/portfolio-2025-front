# Baseline qualité — 2026-08-07

Ce document consigne la mise en place de trois outils d'analyse statique sur `portfolio-2025-front`
et l'état du code au moment de leur installation. C'est une **photographie**, pas un objectif : les
chiffres ci-dessous servent de point de comparaison pour mesurer les progrès (ou les régressions).

> **Conditions de mesure.** Les chiffres ont été relevés sur un arbre de travail contenant des
> modifications non commitées (branche `master`, HEAD `6b97e02`). Le code a bougé pendant la mesure :
> le compte jscpd est passé de 88 à 76 clones entre le début et la fin de l'installation. Les
> chiffres retenus ci-dessous sont ceux de la **passe finale**, tous outils lancés à la suite.
> Il faudra les rejouer une fois l'arbre stabilisé.

| Outil                   | Version | Rôle                                          | Script npm                            | Statut CI          |
| ----------------------- | ------- | --------------------------------------------- | ------------------------------------- | ------------------ |
| `jscpd`                 | 5.0.14  | Détection de duplication (copier/coller)      | `lint:dup`                            | Vert, non branché  |
| `knip`                  | 6.32.0  | Fichiers / exports / dépendances non utilisés | `lint:unused`                         | Rouge, non branché |
| `eslint-plugin-sonarjs` | 4.2.0   | Règles de qualité, complexité et sécurité     | intégré à `lint`, plus `lint:quality` | Vert, branché      |

## Comment lancer chaque outil

```bash
npm run lint            # ESLint standard, sonarjs inclus — DOIT rester à 0
npm run lint:quality    # ESLint + tout sonarjs en `warn` — mesure la dette, ne bloque jamais
npm run lint:dup        # Duplication du code applicatif (hors specs)
npm run lint:dup:tests  # Duplication dans les specs, seuils relevés, jamais bloquant
npm run lint:dup:report # Rapport HTML dans reports/jscpd/ (dossier gitignoré)
npm run lint:unused     # Fichiers, exports et dépendances non utilisés
```

---

## 1. jscpd — duplication

### Configuration (`.jscpd.json`)

| Paramètre   | Valeur                                      | Pourquoi                                                                                                                                                                     |
| ----------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minLines`  | 5                                           | Valeur par défaut ; en dessous on ne détecte que du bruit syntaxique.                                                                                                        |
| `minTokens` | 50                                          | Idem — un bloc de moins de 50 tokens n'est pas une duplication actionnable.                                                                                                  |
| `mode`      | `weak`                                      | Ignore les commentaires. La JSDoc est obligatoire sur les symboles exportés dans ce projet : sans cela, des en-têtes de documentation similaires remontent comme des clones. |
| `format`    | `typescript, markup, scss, css, javascript` | `markup` est le format jscpd qui couvre le HTML — il n'existe pas de format `html`.                                                                                          |
| `threshold` | 4 %                                         | Garde-fou anti-régression calibré juste au-dessus de la baseline (3,56 %). Ce n'est **pas** une validation de l'état actuel.                                                 |

### Ce qui est exclu et pourquoi

- `node_modules/`, `dist/`, `.angular/`, `coverage/`, `playwright-report/`, `test-results/` :
  artefacts de build et dépendances, hors périmètre.
- `src/locale/**` : fichiers XLF générés par `ng extract-i18n`, structurellement répétitifs par
  nature.
- `src/assets/**`, `public/**` : contenu statique (dont `seo-metadata.json`, généré).
- `e2e/**` : scénarios Playwright, hors du code livré.
- `**/*.spec.ts` et `src/testing/**` : **la duplication y est en grande partie structurelle** —
  le triptyque arrange/act/assert produit des blocs formellement identiques qui ne sont pas de la
  dette. Le chiffre est vérifié séparément par `lint:dup:tests`, avec des seuils relevés
  (10 lignes / 100 tokens) qui filtrent ce bruit.

### Baseline

**Code applicatif (`src/` hors specs + `scripts/`) : 76 clones, 1 310 lignes dupliquées, 3,60 %.**

| Format        | Fichiers analysés | Lignes | Clones | Lignes dupliquées  |
| ------------- | ----------------- | ------ | ------ | ------------------ |
| markup (HTML) | 56                | 7 030  | 38     | 582 (8,28 %)       |
| scss          | 50                | 7 323  | 22     | 466 (6,36 %)       |
| javascript    | 4                 | 1 543  | 3      | 30 (1,94 %)        |
| typescript    | 203               | 20 524 | 13     | 232 (1,13 %)       |
| **Total**     | **313**           | 36 420 | **76** | **1 310 (3,60 %)** |

Le TypeScript est très propre (1,13 %). **Toute la duplication est concentrée dans les templates
HTML et les feuilles SCSS.** Le pourcentage global (3,60 %) laisse 0,4 point de marge sous le
`threshold` de 4 % : c'est peu, il faudra soit traiter les gros doublons SCSS/HTML, soit relever le
seuil si une évolution légitime fait remonter le chiffre.

Fichiers de test, pour information : `lint:dup:tests` (seuils 10/100) remonte **1 clone (0,11 %)**
sur 149 fichiers. Aux seuils standards (5/50) on monterait à 78 clones / 4,57 %, ce qui confirme que
cette duplication est courte et structurelle.

### Les pires cas

| #   | Lignes dupliquées | Paire de fichiers                                                                     |
| --- | ----------------- | ------------------------------------------------------------------------------------- |
| 1   | 248               | `atelier.component.scss` ↔ `weather-presentation.component.scss`                      |
| 2   | 183               | `atelier.component.html` ↔ `weather-presentation.component.html`                      |
| 3   | 73                | `weather/components/historical-comparison` ↔ `weather/components/spaghetti-plot` (TS) |
| 4   | 69                | `sebastian-bac-curve.component.ts` ↔ `sebastian-trend-chart.component.ts`             |
| 5   | 64                | `navbar.component.html` ↔ lui-même (bloc répété dans le fichier)                      |
| 6   | 56                | `offer.component.html` ↔ `presentation.component.html`                                |
| 7   | 49                | `sebastian-presentation.component.html` ↔ `weather-presentation.component.html`       |
| 8   | 48                | `atelier.component.html` ↔ `sebastian-presentation.component.html`                    |

Cumulé par fichier, les quatre plus gros porteurs de duplication sont
`atelier.component.scss` (314 lignes), `weather-presentation.component.html` (292),
`weather-presentation.component.scss` (248) et `atelier.component.html` (242).

---

## 2. knip — code et dépendances non utilisés

### Configuration (`knip.json`)

knip détecte automatiquement Angular (via `angular.json`), Playwright, Karma, Husky, lint-staged,
commitlint, Prettier, ESLint, PostCSS et Tailwind : les points d'entrée `src/main.ts`,
`src/main.server.ts` et `src/server.ts` **n'ont pas besoin d'être déclarés**, le plugin Angular les
fournit. Les composants standalone chargés par `loadComponent: () => import(...)` dans
`app.routes.ts` sont résolus nativement (imports dynamiques statiquement analysables) — ils ne
produisent pas de faux positifs.

Ce qui est déclaré explicitement :

- `entry` : `src/polyfills.ts`, `src/test.ts`, `src/**/*.spec.ts`, `scripts/*.{mjs,mts}`,
  `e2e/**/*.spec.ts` — les fichiers appelés par un runner et non par un import.
- `project` : `src/**/*.ts`, `scripts/**/*.{mjs,mts}`, `e2e/**/*.ts`.
- `ignoreDependencies` : `@fontsource/.+`. **Seul faux positif neutralisé** : ces polices sont
  chargées via le tableau `styles` de `angular.json` (des `.css` dans `node_modules`), un chemin que
  knip ne suit pas. Elles sont bien utilisées (`_tokens.scss` référence `Instrument Serif`,
  `Hanken Grotesk` et `Geist Mono`).

Aucun autre faux positif n'a été masqué : tout ce qui suit est un signalement réel.

knip s'appuie sur `.gitignore`, donc `dist/`, `.angular/` et `coverage/` sont déjà hors périmètre.

### Baseline

**`npm run lint:unused` sort en EXIT=1** — 85 signalements :

| Catégorie                     | Nombre |
| ----------------------------- | ------ |
| Fichiers non utilisés         | 1      |
| Dépendances non utilisées     | 5      |
| devDependencies non utilisées | 5      |
| Exports non utilisés          | 17     |
| Types exportés non utilisés   | 57     |

#### Fichier mort

- `src/testing/factories/app-config.factory.ts` — la factory `buildAppConfig()` n'est importée nulle
  part, alors que **17 fichiers `.spec.ts` construisent un `APP_CONFIG` à la main**. C'est une
  violation directe de la règle « factories obligatoires » du `CLAUDE.md`. À noter aussi :
  `setupTestBed()`, décrit dans le `CLAUDE.md` racine comme l'orchestrateur de TestBed, **n'existe
  pas** dans `src/testing/`.

#### Dépendances de production jamais importées

| Paquet        | Constat                                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gsap`        | Aucune occurrence dans `src/`, `scripts/` ni `angular.json`.                                                                                                                                                                                                  |
| `lottie-web`  | Idem.                                                                                                                                                                                                                                                         |
| `ngx-lottie`  | Idem.                                                                                                                                                                                                                                                         |
| `aos`         | Jamais importée en TS, aucun attribut `data-aos` dans les templates — mais `node_modules/aos/dist/aos.css` **est chargé par `angular.json`** (bundles browser et serveur). CSS embarqué pour rien : la bibliothèque JS qui l'active n'est jamais initialisée. |
| `animate.css` | Aucune classe `animate__*` dans les templates — mais `animate.min.css` **est chargé par `angular.json`**. Même situation que `aos`.                                                                                                                           |

#### devDependencies jamais utilisées

| Paquet                     | Constat                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@types/aos`               | Types d'une bibliothèque elle-même inutilisée.                                                                                                                                                                                                            |
| `eslint-config-prettier`   | **Jamais référencée dans `eslint.config.js`.** Le conflit ESLint/Prettier n'est donc pas neutralisé — dans les faits ça ne pose pas de problème aujourd'hui puisque aucune règle de formatage n'est activée, mais la dépendance ne sert à rien en l'état. |
| `eslint-plugin-prettier`   | **Jamais référencée non plus.** Le formatage est vérifié par `format:check` (Prettier en direct), ce qui est le choix recommandé : ce plugin fait doublon.                                                                                                |
| `fast-check`               | Aucune spec n'utilise de property-based testing.                                                                                                                                                                                                          |
| `baseline-browser-mapping` | Aucune référence hors `package.json` ; elle est de toute façon tirée transitivement par `browserslist`.                                                                                                                                                   |

#### Exports et types non utilisés

Les 74 exports/types morts se concentrent sur quelques fichiers :

| Fichier                                                  | Exports | Types |
| -------------------------------------------------------- | ------- | ----- |
| `src/app/shared/slides/index.ts`                         | 2       | 6     |
| `src/app/core/models/sebastian.model.ts`                 | 0       | 8     |
| `src/app/core/models/audit-client-report.model.ts`       | 0       | 6     |
| `src/app/core/seo/seo-metadata.model.ts`                 | 0       | 6     |
| `src/app/core/models/presentation-interactions.model.ts` | 0       | 5     |
| `src/app/core/models/toolkit-page.model.ts`              | 0       | 5     |
| `src/app/core/models/weather.model.ts`                   | 0       | 5     |
| `src/app/shared/sections/index.ts`                       | 0       | 4     |
| `src/testing/factories/*` (6 fichiers)                   | 8       | 1     |

Deux familles très différentes :

- Les **barrels** (`shared/slides/index.ts`, `shared/sections/index.ts`) ré-exportent plus que ce qui
  est consommé — c'est un choix d'API publique interne, discutable mais pas dangereux.
- Les **types de modèles** non utilisés décrivent souvent des sous-structures d'un type parent qui,
  lui, est utilisé. Beaucoup ne méritent pas d'être supprimés, seulement de ne plus être `export`.
- Les **factories de test non consommées** (`buildContactPayload`, `createContactPortStub`,
  `buildAuditRequestPayload`…) signalent des specs qui remockent à la main au lieu d'utiliser la
  factory prévue — même problème que `buildAppConfig`.

### Note

knip affiche un « Configuration hint » sur `.css` (« imports not followed »). C'est informatif :
knip ne suit pas les imports de feuilles de style, ce qui est le comportement attendu ici.

---

## 3. eslint-plugin-sonarjs

### Configuration retenue

Le jeu `sonarjs/recommended` (279 règles, dont **217 actives en `error`**) est branché dans
`eslint.config.js`, sur `src/**/*.ts` uniquement, dans le même bloc que
`typescript-eslint` et `angular-eslint`.

**202 de ces 217 règles passaient déjà au vert sur tout le code** : elles sont donc actives en
`error` dès maintenant et protègent le dépôt sans rien casser. Seules 15 règles remontaient des
occurrences ; elles ont été traitées ainsi :

- **4 règles ne remontent QUE dans les fichiers de test** — elles restent en `error` sur tout le
  code applicatif et sont désactivées via un bloc `files: ['src/**/*.spec.ts', 'src/testing/**/*.ts',
'src/test.ts']`. C'est le cas notamment de `sonarjs/no-hardcoded-passwords`, règle de sécurité
  qu'on veut absolument garder active en production et dont les 21 occurrences sont toutes des mots
  de passe factices de fixtures.
- **11 règles ont des occurrences dans le code applicatif** — elles sont désactivées nommément, avec
  le nombre d'occurrences en commentaire dans `eslint.config.js`.

#### Pourquoi `off` et non `warn`

La consigne habituelle serait de passer ces règles en `warn`. C'est impossible ici :
`lint-staged` lance `eslint --fix --max-warnings=0` sur les fichiers modifiés. **Un seul warning
bloquerait tous les commits** touchant un fichier concerné. Le choix est donc :
`off` dans la configuration de production, et mesure exhaustive via `npm run lint:quality`, qui
utilise `eslint.quality.config.js` — une surcouche qui rejoue l'intégralité de `sonarjs/recommended`
en `warn`. Ce script sort toujours en EXIT=0 et n'est branché nulle part dans la CI.

### Baseline : 128 violations, 15 règles déclenchées

| Règle                                    | Total | Code applicatif | Specs | Traitement         |
| ---------------------------------------- | ----- | --------------- | ----- | ------------------ |
| `sonarjs/deprecation`                    | 31    | 4               | 27    | `off`              |
| `sonarjs/no-hardcoded-passwords`         | 21    | 0               | 21    | `error` hors specs |
| `sonarjs/no-nested-conditional`          | 10    | 8               | 2     | `off`              |
| `sonarjs/pseudo-random`                  | 9     | 9               | 0     | `off`              |
| `sonarjs/parameterized-tests`            | 9     | 0               | 9     | `error` hors specs |
| `sonarjs/super-linear-regex`             | 9     | 9               | 0     | `off`              |
| `sonarjs/prefer-regexp-exec`             | 9     | 4               | 5     | `off`              |
| `sonarjs/cognitive-complexity`           | 8     | 8               | 0     | `off`              |
| `sonarjs/function-return-type`           | 5     | 5               | 0     | `off`              |
| `sonarjs/different-types-comparison`     | 5     | 4               | 1     | `off`              |
| `sonarjs/no-floating-point-equality`     | 4     | 0               | 4     | `error` hors specs |
| `sonarjs/void-use`                       | 3     | 3               | 0     | `off`              |
| `sonarjs/no-angular-bypass-sanitization` | 2     | 2               | 0     | `off`              |
| `sonarjs/assertions-in-tests`            | 2     | 0               | 2     | `error` hors specs |
| `sonarjs/no-nested-template-literals`    | 1     | 1               | 0     | `off`              |

### Coût en temps

`npm run lint` passe d'environ **20 s à 50-80 s** sur une machine de dev. C'est le prix des règles
sonarjs qui exploitent le type-checking (`projectService` est déjà activé). L'impact sur
`lint-staged` reste faible, puisqu'il ne lint que les fichiers modifiés.

---

## 4. Ce qui est branché en CI, et ce qui ne l'est pas

| Script             | EXIT actuel      | Dans `ci:check` / `pre-push:check` ?                   |
| ------------------ | ---------------- | ------------------------------------------------------ |
| `lint` (+ sonarjs) | **0**            | Oui — déjà présent, sonarjs s'y ajoute sans le casser. |
| `lint:quality`     | 0 (128 warnings) | Non — outil de mesure, jamais bloquant.                |
| `lint:dup`         | **0**            | Non — prêt à être branché (voir ci-dessous).           |
| `lint:dup:tests`   | **0**            | Non — informatif.                                      |
| `lint:unused`      | **1**            | Non — sortirait en échec, bloquerait tous les pushes.  |
| `typecheck`        | 0                | Oui — inchangé.                                        |
| `format:check`     | 0                | Oui — inchangé.                                        |

`lint:dup` est le seul candidat immédiat à un ajout dans `ci:check` : il est vert et son
`threshold: 4` empêche la duplication de repartir à la hausse. La décision reste à prendre, sachant
qu'un seuil calibré sur la baseline gèle la dette au niveau actuel plutôt qu'il ne la réduit.

`lint:unused` ne peut pas être branché avant traitement des 10 dépendances mortes et du fichier mort.
Une fois ceux-ci réglés, il resterait les 74 exports/types, que l'on peut soit traiter, soit exclure
temporairement avec `--include files,dependencies,unlisted`.

---

## 5. À traiter en priorité

1. **Les cinq dépendances de production mortes** (`gsap`, `lottie-web`, `ngx-lottie`, `aos`,
   `animate.css`). `aos` et `animate.css` embarquent en plus leurs CSS dans les bundles browser
   **et** serveur via `angular.json`, pour zéro usage. Gain immédiat sur le poids livré. Retirer
   aussi `@types/aos` avec `aos`.
2. **`src/testing/factories/app-config.factory.ts` et les 17 specs qui l'ignorent.** La règle DRY du
   projet est explicitement enfreinte, et le `setupTestBed()` documenté n'existe pas — il faut soit
   l'écrire, soit corriger la documentation.
3. **Les templates et SCSS de `atelier` / `weather-presentation` / `sebastian-presentation`.** Ces
   trois pages partagent 500+ lignes de HTML et SCSS quasi identiques : c'est le gisement de
   duplication le plus rentable du projet, et sans doute un composant de section partagé qui
   manque.
4. **`sonarjs/cognitive-complexity`** : 8 fonctions au-dessus du seuil de 15, dont
   `asili-background.component.ts:239` à **41** (2,7× le seuil), `seo-builders.ts:34` à 28 et
   `weather-icons.ts:13` à 26.
5. **`eslint-config-prettier` / `eslint-plugin-prettier`** : trancher entre les brancher réellement
   dans `eslint.config.js` ou les désinstaller. En l'état, elles ne servent à rien.

## 6. Points signalés, non corrigés

- **`sonarjs/super-linear-regex` sur le chemin SSR.** Trois des neuf occurrences sont dans du code
  serveur qui traite l'URL entrante : `src/server.ts:64` (`/\/{2,}/g` puis `/\/+$/` sur `req.path`),
  `src/server/redirects.ts:38` et `src/server/url-utils.ts:22`. Ces regex ont un profil de
  backtracking super-linéaire sur une entrée contrôlée par le client. Le risque ReDoS réel est
  faible (les URL sont bornées côté Express), mais c'est le seul signalement à composante sécurité
  du lot. Les six autres occurrences sont côté navigateur, donc sans enjeu.
- **`sonarjs/no-angular-bypass-sanitization` (2 occurrences)** — revues, elles semblent maîtrisées :
  `slide-video.component.ts:51` passe par une allowlist explicite (`isAllowedIframeUrl`) et
  `svg-icon.component.ts:107` injecte des SVG issus des assets locaux via un input de composant, pas
  d'une saisie utilisateur. Rien à corriger, mais à ne pas perdre de vue si ces entrées deviennent
  dynamiques.
- **`sonarjs/pseudo-random` (9 occurrences)** — `Math.random()` sert ici à de l'animation
  (`asili-background`, `sebastian-gauge`) et à générer un identifiant de corrélation de requête
  (`request-id.interceptor.ts:4`). Aucun usage cryptographique. Le cas de l'identifiant de requête
  mériterait `crypto.randomUUID()`, davantage pour la garantie d'unicité que pour la sécurité.
