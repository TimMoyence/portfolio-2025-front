# `lastmod` du sitemap : ce qu'il mesure, et sa limite pour les pages servies par l'API

## Fonctionnement actuel

- `/sitemap.xml` est servi par le serveur SSR (`src/server.ts`, `buildSitemapXml` dans
  `src/server/seo-builders.ts`). Il lit `src/assets/seo/seo-metadata.json` (copié dans
  `dist/…/assets/seo/`) et y ajoute les articles publiés quand `PORTFOLIO_ARTICLE_API_URL`
  est défini : leur `lastmod` vient du champ `updated_at` renvoyé par l'API.
- Pour les pages déclarées dans `seo-metadata.json`, `lastmod` est écrit par
  `scripts/update-seo-lastmod.mjs`, lancé par `npm run build` (`seo:lastmod`). Chaque chemin
  y est relié à des dossiers du front (`pathToSources`) ; la date retenue est celle du dernier
  commit git qui touche ces dossiers (`git log -1 --format=%ad --date=short`).

`lastmod` mesure donc la dernière modification **du code front** d'une page, pas celle de son
contenu.

## Limite : `/formations/b2-01-traitement-information-chiffree`

Le contenu de cette page (72 écrans) n'est plus dans le dépôt front : il est lu à chaque visite
sur `GET /formations/catalogue/:slug` (rendu `RenderMode.Server`, voir
`src/app/app.routes.server.ts`). Conséquences :

- publier une nouvelle version du cours en base ne change pas le `lastmod` du sitemap ;
- à l'inverse, un commit front sur `src/app/features/formations/b2-01-…` avance `lastmod`
  sans que le contenu ait changé.

### Pourquoi ce n'est pas corrigé côté front aujourd'hui

La source fiable existe, mais l'API ne l'expose pas :

- côté back, chaque publication crée une ligne `(slug, version)` dans
  `formation_course_contents`, horodatée par `created_at` (`CreateDateColumn`,
  `FormationCourseContentEntity`) ; la version courante est celle de plus haut numéro
  (`CoursCatalogueRepositoryTypeORM.findEntity`) ;
- mais `GET /formations/catalogue/:slug` renvoie `CoursPublic`
  (`id`, `titre`, `niveau`, `duree`, `concepts`, `ecrans`) : ni date ni version.

Lire une date côté front imposerait de l'inventer. Le `lastmod` actuel, daté par le commit front,
reste le moins faux des deux.

### Correction proposée (back puis front)

1. **Back** : ajouter à la réponse de `GET /formations/catalogue/:slug` un champ `publieLe`
   (ISO 8601, `created_at` de la version courante), et le champ `version`. Aucune donnée
   sensible : la route est déjà publique.
2. **Front, serveur SSR** : dans `src/server.ts`, sur le modèle de `loadArticleSitemap`
   (URL de l'API par variable d'environnement, délai de 2 s, cache de 5 min, repli silencieux),
   lire `publieLe` pour les pages de cours rendues depuis l'API et publier
   `lastmod = max(lastmod de seo-metadata.json, publieLe)`.

Réserve : pour une version insérée par une migration de données, `created_at` est l'heure
d'exécution de la migration sur l'environnement concerné. En production, elle coïncide avec la
mise en ligne du contenu ; sur un environnement recréé, elle date la recréation.
