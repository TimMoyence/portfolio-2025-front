# portfolio-2025-front

Front Angular 19 du portfolio (SSR, prerender, fr/en). Les règles transverses sont dans `~/.claude/CLAUDE.md`. Ce fichier ne garde que les juges, les commandes non évidentes et les invariants qu'aucune machine ne tient ici.

## Juges

- Le contrat OpenAPI du back `portfolio-2025-back` est la source unique des types de réponse. Le front ne réécrit jamais un type de réponse ni un schéma de lecture à la main, et ne recalcule pas une règle métier servie : il affiche le champ servi. Un type recopié faisait perdre 7 incidents sur 9 en production.
- Ces types et schémas viennent de `contrat/`, généré par `npm run contrat` depuis le commit du back épinglé dans `contrat.json` (ADR 0005) ; `npm run contrat:check` refuse un contrat qui s'en écarte.
- Un changement de contrat part du back : PR back d'abord, puis la PR front qui déplace l'épingle de `contrat.json`. Le job `banc` de `.github/workflows/ci.yml` joue le front contre ce commit épinglé du back.
- La frontière `core` → `shared`/`features` est jugée par `eslint.config.js` et `scripts/frontiere-du-coeur.test.mjs` ; les traductions par `scripts/guard-i18n-sync.test.mjs`.

## Commandes

- Suite complète avant chaque commit : `npm run ci:check`, qui démarre lui-même les serveurs SSR de `test:e2e:portail`, puis `npm run test:banc` (Docker et dépôt back voisin requis). `ci:check` ne contient pas le banc, que `.github/workflows/ci.yml` joue en porte bloquante.
- `npm run build` lance `seo:lastmod`, qui réécrit `src/assets/seo/seo-metadata.json` d'après `git log` : ce diff se commite.
- Texte, route ou SEO localisé modifié : `npm run extract-i18n`, puis chaque unité se reporte dans `src/locale/messages.en.xlf` ; `npm run test:guards` le juge.

## Invariants qu'aucune machine ne tient

- Aucun accès à `window`, `document`, `localStorage` ou `navigator` sans garde de plateforme : le même code tourne au prerender et en SSR.
- Toute UI asynchrone rend ses états `loading`, `success`, `error` et, quand il existe, `empty`.

## GitNexus

- Index local dans `.gitnexus/`, absent des worktrees : `node .gitnexus/run.cjs analyze --index-only` le rafraîchit (`npx gitnexus analyze --index-only` s'il manque). Toujours `--index-only` : sans lui, `analyze` réinjecte un bloc généré dans ce fichier et dans `CLAUDE.md`.
- Usage par les skills `.claude/skills/gitnexus-*`. Un `risk: UNKNOWN` ou zéro appelant n'est pas un feu vert : il se confirme par `git grep`.
