---
name: gitnexus-area-components
description: "Skill for the Components area of portfolio-2025-front. 28 symbols across 3 files."
---

# Components

28 symbols | 3 files | Cohesion: 84%

## When to Use

- Working with code in `src/`
- Understanding how pathFor, dimensionToRem, httpGetIcon work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/components/seo-manager.component.ts` | pathFor, trimTrailingSlashes, buildAbsoluteUrl, buildHreflangs, resolveBaseUrl (+12) |
| `src/app/shared/components/svg-icon.component.ts` | dimensionToRem, httpGetIcon, loadIcon, ngOnChanges, prepareSvg (+2) |
| `src/app/shared/components/svg-icon.component.spec.ts` | chargerEnGet, loadIcon, nameChange, monterIcone |

## Entry Points

Start here when exploring this area:

- **`pathFor`** (Function) — `src/app/shared/components/seo-manager.component.ts:137`
- **`dimensionToRem`** (Method) — `src/app/shared/components/svg-icon.component.ts:204`
- **`httpGetIcon`** (Method) — `src/app/shared/components/svg-icon.component.ts:107`
- **`loadIcon`** (Method) — `src/app/shared/components/svg-icon.component.ts:70`
- **`ngOnChanges`** (Method) — `src/app/shared/components/svg-icon.component.ts:58`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `pathFor` | Function | `src/app/shared/components/seo-manager.component.ts` | 137 |
| `dimensionToRem` | Method | `src/app/shared/components/svg-icon.component.ts` | 204 |
| `httpGetIcon` | Method | `src/app/shared/components/svg-icon.component.ts` | 107 |
| `loadIcon` | Method | `src/app/shared/components/svg-icon.component.ts` | 70 |
| `ngOnChanges` | Method | `src/app/shared/components/svg-icon.component.ts` | 58 |
| `prepareSvg` | Method | `src/app/shared/components/svg-icon.component.ts` | 140 |
| `sanitizeSvgElement` | Method | `src/app/shared/components/svg-icon.component.ts` | 114 |
| `buildAbsoluteUrl` | Method | `src/app/shared/components/seo-manager.component.ts` | 242 |
| `buildHreflangs` | Method | `src/app/shared/components/seo-manager.component.ts` | 136 |
| `resolveBaseUrl` | Method | `src/app/shared/components/seo-manager.component.ts` | 178 |
| `resolvePageUrls` | Method | `src/app/shared/components/seo-manager.component.ts` | 114 |
| `applySeoConfig` | Method | `src/app/shared/components/seo-manager.component.ts` | 91 |
| `constructor` | Method | `src/app/shared/components/seo-manager.component.ts` | 43 |
| `getCleanUrl` | Method | `src/app/shared/components/seo-manager.component.ts` | 182 |
| `resolveAbsoluteUrl` | Method | `src/app/shared/components/seo-manager.component.ts` | 248 |
| `resolveRobots` | Method | `src/app/shared/components/seo-manager.component.ts` | 128 |
| `setDefaultSeo` | Method | `src/app/shared/components/seo-manager.component.ts` | 153 |
| `isHomeAlias` | Method | `src/app/shared/components/seo-manager.component.ts` | 238 |
| `normalizePath` | Method | `src/app/shared/components/seo-manager.component.ts` | 186 |
| `normalizeRelativePath` | Method | `src/app/shared/components/seo-manager.component.ts` | 231 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → TrimLeadingSlashes` | cross_community | 7 |
| `Constructor → TrimTrailingSlashes` | cross_community | 7 |
| `Constructor → GetCleanUrl` | cross_community | 7 |
| `Constructor → IsHomeAlias` | cross_community | 5 |
| `Constructor → ResolveBaseUrl` | cross_community | 4 |

## How to Explore

1. `context({name: "pathFor"})` — see callers and callees
2. `query({search_query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
