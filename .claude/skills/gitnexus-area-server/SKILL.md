---
name: gitnexus-area-server
description: "Skill for the Server area of portfolio-2025-front. 102 symbols across 24 files."
---

# Server

102 symbols | 24 files | Cohesion: 85%

## When to Use

- Working with code in `src/`
- Understanding how buildSitemapXml, documentCacheControlFor, injectSeoHead work
- Modifying server-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/server/seo-builders.ts` | alternateLink, alternatesMarkupOf, buildSitemapXml, dynamicArticleEntryOf, escapeXml (+14) |
| `src/server/seo-injector.ts` | buildArticleFeedLink, injectSeoHead, isKnownRoute, buildSeoLinkTags, hrefFor (+7) |
| `src/server/seo-builders.spec.ts` | lastmods, lastmodsPublies, llmsFullDe, sitemapDArticle, sansLocale (+4) |
| `src/server.ts` | loadSeoMetadata, renderWithSsr, resolveIndexHtml, sendPrerendered, ssrPublicPathOf (+1) |
| `src/server/url-utils.ts` | buildBaseUrlFromRequest, firstAllowedHost, buildLocalizedPath, normalizePath, trimLeadingSlashes (+1) |
| `src/server/sitemap-route.spec.ts` | appeler, dependances, lireMetadata, differe, lireArticles (+1) |
| `src/server/cours-publication.ts` | lecteurDePublicationsDeCours, lire, cheminDuCours, dateDePublication, lirePublication |
| `src/server/article-sitemap.ts` | entreesDe, lirePage, lecteurDArticlesDuSitemap, lireLocale |
| `src/server/cours-publication.simulation.spec.ts` | appels, repond, repond, repond |
| `src/testing/factories/seo-metadata.factory.ts` | buildSeoMetadata, buildPageDuCoursB2, buildPageSeo, buildPageSeoFr |

## Entry Points

Start here when exploring this area:

- **`buildSitemapXml`** (Function) — `src/server/seo-builders.ts:107`
- **`documentCacheControlFor`** (Function) — `src/server/document-cache.ts:0`
- **`injectSeoHead`** (Function) — `src/server/seo-injector.ts:176`
- **`isKnownRoute`** (Function) — `src/server/seo-injector.ts:171`
- **`routeDuSitemap`** (Function) — `src/server/sitemap-route.ts:14`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildSitemapXml` | Function | `src/server/seo-builders.ts` | 107 |
| `documentCacheControlFor` | Function | `src/server/document-cache.ts` | 0 |
| `injectSeoHead` | Function | `src/server/seo-injector.ts` | 176 |
| `isKnownRoute` | Function | `src/server/seo-injector.ts` | 171 |
| `routeDuSitemap` | Function | `src/server/sitemap-route.ts` | 14 |
| `buildBaseUrlFromRequest` | Function | `src/server/url-utils.ts` | 56 |
| `buildRobotsTxt` | Function | `src/server/seo-builders.ts` | 214 |
| `buildAgentBlock` | Function | `src/server/seo-builders.ts` | 233 |
| `buildLocalizedPath` | Function | `src/server/url-utils.ts` | 29 |
| `normalizePath` | Function | `src/server/url-utils.ts` | 23 |
| `lecteurDePublicationsDeCours` | Function | `src/server/cours-publication.ts` | 68 |
| `lire` | Function | `src/server/cours-publication.ts` | 77 |
| `buildRequeteExpress` | Function | `src/testing/factories/express.factory.ts` | 40 |
| `createReponseExpressStub` | Function | `src/testing/factories/express.factory.ts` | 10 |
| `lireJsonSousDelai` | Function | `src/server/lecture-api.ts` | 3 |
| `messageDErreur` | Function | `src/server/lecture-api.ts` | 24 |
| `buildReponseDuCatalogue` | Function | `src/testing/factories/formation-catalogue.factory.ts` | 19 |
| `buildVisualCourse` | Function | `src/testing/factories/formation-catalogue.factory.ts` | 3 |
| `buildLlmsFullTxt` | Function | `src/server/seo-builders.ts` | 259 |
| `buildSeoMetadata` | Function | `src/testing/factories/seo-metadata.factory.ts` | 41 |

## How to Explore

1. `context({name: "buildSitemapXml"})` — see callers and callees
2. `query({search_query: "server"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
