---
name: gitnexus-area-e2e
description: "Skill for the E2e area of portfolio-2025-front. 38 symbols across 9 files."
---

# E2e

38 symbols | 9 files | Cohesion: 93%

## When to Use

- Working with code in `e2e/`
- Understanding how installerLaSeanceDeSortie, intercepterApi, ouvrirEcranEtudiantB2 work
- Modifying e2e-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/fixtures.ts` | installerLaSeanceDeSortie, intercepterApi, ouvrirEcranEtudiantB2, servirFlux, servirJson (+6) |
| `e2e/cours-reprise.spec.ts` | answers, free-responses, cleDuBrouillon, ecrireUnBrouillon, installerLaSeance (+2) |
| `e2e/cours-refus.spec.ts` | etatDeLaSeance, installerLaSeance, answers, rejoindre, etat |
| `e2e/cours-pupitre.spec.ts` | annotationServie, installerLePupitre, annotationEnregistree, pilotageApplique |
| `e2e/cours-i18n-en.spec.ts` | decoderXml, libellesTraduits, normaliser, texteVisible |
| `e2e/cours-medias.spec.ts` | fichiersDeLaCapsule, fichiersDuCatalogue, lireJson |
| `e2e/cours-session.spec.ts` | installerApiEtudiant, rejoindre |
| `src/app/features/cours/cours-flux.token.spec.ts` | etat |
| `e2e/cours-graphiques.spec.ts` | graphiquePret |

## Entry Points

Start here when exploring this area:

- **`installerLaSeanceDeSortie`** (Function) — `e2e/fixtures.ts:212`
- **`intercepterApi`** (Function) — `e2e/fixtures.ts:113`
- **`ouvrirEcranEtudiantB2`** (Function) — `e2e/fixtures.ts:239`
- **`servirFlux`** (Function) — `e2e/fixtures.ts:97`
- **`servirJson`** (Function) — `e2e/fixtures.ts:85`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `installerLaSeanceDeSortie` | Function | `e2e/fixtures.ts` | 212 |
| `intercepterApi` | Function | `e2e/fixtures.ts` | 113 |
| `ouvrirEcranEtudiantB2` | Function | `e2e/fixtures.ts` | 239 |
| `servirFlux` | Function | `e2e/fixtures.ts` | 97 |
| `servirJson` | Function | `e2e/fixtures.ts` | 85 |
| `servirSansContenu` | Function | `e2e/fixtures.ts` | 93 |
| `remplirLaJonction` | Function | `e2e/fixtures.ts` | 139 |
| `ecranB2Graphique` | Function | `e2e/fixtures.ts` | 64 |
| `etatDuParticipant` | Function | `e2e/fixtures.ts` | 191 |
| `annotationServie` | Function | `e2e/cours-pupitre.spec.ts` | 133 |
| `installerLePupitre` | Function | `e2e/cours-pupitre.spec.ts` | 149 |
| `annotationEnregistree` | Function | `e2e/cours-pupitre.spec.ts` | 161 |
| `pilotageApplique` | Function | `e2e/cours-pupitre.spec.ts` | 154 |
| `etatDeLaSeance` | Function | `e2e/cours-refus.spec.ts` | 24 |
| `installerLaSeance` | Function | `e2e/cours-refus.spec.ts` | 28 |
| `answers` | Function | `e2e/cours-refus.spec.ts` | 38 |
| `answers` | Function | `e2e/cours-reprise.spec.ts` | 40 |
| `free-responses` | Function | `e2e/cours-reprise.spec.ts` | 48 |
| `installerApiEtudiant` | Function | `e2e/cours-session.spec.ts` | 84 |
| `etat` | Function | `src/app/features/cours/cours-flux.token.spec.ts` | 36 |

## How to Explore

1. `context({name: "installerLaSeanceDeSortie"})` — see callers and callees
2. `query({search_query: "e2e"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
