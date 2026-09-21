# `lastmod` du sitemap : ce qu'il mesure, et comment il suit les cours servis par l'API

## Fonctionnement

- `/sitemap.xml` est servi par le serveur SSR (`src/server.ts`, `buildSitemapXml` dans
  `src/server/seo-builders.ts`). Il lit `src/assets/seo/seo-metadata.json` (copié dans
  `dist/…/assets/seo/`) et y ajoute les articles publiés quand `PORTFOLIO_ARTICLE_API_URL`
  est défini : leur `lastmod` vient du champ `updated_at` renvoyé par l'API.
- Pour les pages déclarées dans `seo-metadata.json`, `lastmod` est écrit par
  `scripts/update-seo-lastmod.mjs`, lancé par `npm run build` (`seo:lastmod`). Chaque chemin
  y est relié à des dossiers du front (`pathToSources`) ; la date retenue est celle du dernier
  commit git qui touche ces dossiers (`git log -1 --format=%ad --date=short`).

`lastmod` mesure donc, par défaut, la dernière modification **du code front** d'une page.

## Pages de cours servies par l'API (H1)

Le contenu de `/formations/b2-01-traitement-information-chiffree` (écrans du cours) n'est pas dans
le dépôt front : il est lu à chaque visite sur `GET /formations/catalogue/:slug` (rendu
`RenderMode.Server`, voir `src/app/app.routes.server.ts`). Publier une nouvelle version en base ne
touche aucun fichier du front ; le `lastmod` issu du commit ne le verrait pas.

### Contrat lu

`GET /formations/catalogue/:slug` renvoie, en plus du cours public, `version` et `publieLe`
(ISO 8601, `publiee_le` de la table de publication : la date de la bascule, pas celle de la
migration). Contrat fixé par `portfolio-2025-back/docs/cours-b2-01-conception.md` (§ 4.6, H1).

### Lecture côté serveur SSR

- `src/server/cours-publication.ts` : `lecteurDePublicationsDeCours` interroge la route pour chaque
  cours de `COURS_SERVIS_PAR_L_API`, sur le modèle de `loadArticleSitemap` :
  - URL de l'API : `PORTFOLIO_ARTICLE_API_URL` (la même base `…/api/v1/portfolio25` que pour les
    articles) ;
  - délai de 2 s par requête (`AbortController`) ;
  - cache de 5 min, repli compris : au plus une série de requêtes, ou un avertissement, toutes
    les 5 min.
- `buildSitemapXml` reçoit ces publications et publie, pour la page du cours,
  `lastmod = max(lastmod de seo-metadata.json, publieLe)`. `publieLe` est ramené au jour UTC
  (`AAAA-MM-JJ`), le format des autres entrées. Une page sans `lastmod` prend `publieLe` seul.

### Replis, tous journalisés en `warn`

Le sitemap garde alors le `lastmod` de `seo-metadata.json` et le journal (`console.warn`, préfixe
`[sitemap]`) dit pourquoi :

| Cas                                         | Message                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `PORTFOLIO_ARTICLE_API_URL` absente         | variable absente, aucune date de publication lue |
| réponse HTTP en erreur                      | code HTTP reçu                                   |
| API injoignable ou délai de 2 s dépassé     | message de l'erreur réseau                       |
| `publieLe` absent ou qui n'est pas une date | `publieLe` absent ou invalide                    |

Tant que le back n'expose pas `publieLe` (lot 2b), c'est le dernier cas qui s'applique : le
sitemap reste celui d'avant, avec un avertissement toutes les 5 min.

### Tests

- `src/server/seo-builders.spec.ts` : `buildSitemapXml` sans API (lastmod de `seo-metadata.json`),
  avec une publication plus récente, plus ancienne, et pour une page sans `lastmod`.
- `src/server/cours-publication.spec.ts` : lecture de `publieLe`, chaque repli et son
  avertissement, cache de 5 min.

### Réserve

Si une version est publiée par une migration de données, `publieLe` date la bascule sur
l'environnement concerné : en production, la mise en ligne ; sur un environnement recréé, la
recréation.
