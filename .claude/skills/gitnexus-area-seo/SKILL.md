---
name: gitnexus-area-seo
description: "Skill for the Seo area of portfolio-2025-front. 25 symbols across 5 files."
---

# Seo

25 symbols | 5 files | Cohesion: 94%

## When to Use

- Working with code in `src/`
- Understanding how resolveLocaleKey, updateCanonicalLink, updateHreflangLinks work
- Modifying seo-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/core/seo/seo-registry.service.ts` | buildResolved, getSeoByKey, resolveLocaleKey, getSeoByPath, normalizePagePath (+6) |
| `src/app/core/seo/seo.service.ts` | resolveLocaleKey, updateCanonicalLink, updateHreflangLinks, updateJsonLd, updateOgLocaleTags (+3) |
| `src/app/core/seo/seo-registry.service.spec.ts` | createService, seoParChemin, seoParCle, seoTrouve |
| `src/app/core/seo/seo-metadata.model.ts` | SeoLocaleMeta |
| `src/app/core/seo/seo.interface.ts` | SeoConfig |

## Entry Points

Start here when exploring this area:

- **`resolveLocaleKey`** (Method) — `src/app/core/seo/seo.service.ts:164`
- **`updateCanonicalLink`** (Method) — `src/app/core/seo/seo.service.ts:121`
- **`updateHreflangLinks`** (Method) — `src/app/core/seo/seo.service.ts:130`
- **`updateJsonLd`** (Method) — `src/app/core/seo/seo.service.ts:144`
- **`updateOgLocaleTags`** (Method) — `src/app/core/seo/seo.service.ts:80`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SeoLocaleMeta` | Interface | `src/app/core/seo/seo-metadata.model.ts` | 4 |
| `SeoConfig` | Interface | `src/app/core/seo/seo.interface.ts` | 2 |
| `resolveLocaleKey` | Method | `src/app/core/seo/seo.service.ts` | 164 |
| `updateCanonicalLink` | Method | `src/app/core/seo/seo.service.ts` | 121 |
| `updateHreflangLinks` | Method | `src/app/core/seo/seo.service.ts` | 130 |
| `updateJsonLd` | Method | `src/app/core/seo/seo.service.ts` | 144 |
| `updateOgLocaleTags` | Method | `src/app/core/seo/seo.service.ts` | 80 |
| `updateOpenGraphTags` | Method | `src/app/core/seo/seo.service.ts` | 53 |
| `updateSeoMetadata` | Method | `src/app/core/seo/seo.service.ts` | 23 |
| `updateTwitterTags` | Method | `src/app/core/seo/seo.service.ts` | 98 |
| `buildResolved` | Method | `src/app/core/seo/seo-registry.service.ts` | 55 |
| `getSeoByKey` | Method | `src/app/core/seo/seo-registry.service.ts` | 42 |
| `resolveLocaleKey` | Method | `src/app/core/seo/seo-registry.service.ts` | 80 |
| `getSeoByPath` | Method | `src/app/core/seo/seo-registry.service.ts` | 47 |
| `normalizePagePath` | Method | `src/app/core/seo/seo-registry.service.ts` | 110 |
| `normalizeRequestPath` | Method | `src/app/core/seo/seo-registry.service.ts` | 97 |
| `stripLocalePrefix` | Method | `src/app/core/seo/seo-registry.service.ts` | 124 |
| `trimSlashes` | Method | `src/app/core/seo/seo-registry.service.ts` | 116 |
| `getDefaultLocale` | Method | `src/app/core/seo/seo-registry.service.ts` | 38 |
| `getLocaleId` | Method | `src/app/core/seo/seo-registry.service.ts` | 29 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NormalizeRequestPath → TrimSlashes` | intra_community | 3 |

## How to Explore

1. `context({name: "resolveLocaleKey"})` — see callers and callees
2. `query({search_query: "seo"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
