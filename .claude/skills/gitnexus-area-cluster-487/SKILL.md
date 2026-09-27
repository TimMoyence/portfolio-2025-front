---
name: gitnexus-area-cluster-487
description: "Skill for the Cluster_487 area of portfolio-2025-front. 26 symbols across 1 files."
---

# Cluster_487

26 symbols | 1 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how appliquer, arrondirMoitieLoinDeZero, comparer work
- Modifying cluster_487-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/cours/runtime/core/formula.ts` | appliquer, arrondirMoitieLoinDeZero, comparer, ecartType, fini (+21) |

## Entry Points

Start here when exploring this area:

- **`appliquer`** (Function) — `src/cours/runtime/core/formula.ts:406`
- **`arrondirMoitieLoinDeZero`** (Function) — `src/cours/runtime/core/formula.ts:388`
- **`comparer`** (Function) — `src/cours/runtime/core/formula.ts:395`
- **`ecartType`** (Function) — `src/cours/runtime/core/formula.ts:436`
- **`fini`** (Function) — `src/cours/runtime/core/formula.ts:463`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `appliquer` | Function | `src/cours/runtime/core/formula.ts` | 406 |
| `arrondirMoitieLoinDeZero` | Function | `src/cours/runtime/core/formula.ts` | 388 |
| `comparer` | Function | `src/cours/runtime/core/formula.ts` | 395 |
| `ecartType` | Function | `src/cours/runtime/core/formula.ts` | 436 |
| `fini` | Function | `src/cours/runtime/core/formula.ts` | 463 |
| `lireContenu` | Function | `src/cours/runtime/core/formula.ts` | 372 |
| `lireNombre` | Function | `src/cours/runtime/core/formula.ts` | 169 |
| `quantile` | Function | `src/cours/runtime/core/formula.ts` | 425 |
| `refuser` | Function | `src/cours/runtime/core/formula.ts` | 123 |
| `sansZeroNegatif` | Function | `src/cours/runtime/core/formula.ts` | 384 |
| `statistique` | Function | `src/cours/runtime/core/formula.ts` | 446 |
| `agreger` | Method | `src/cours/runtime/core/formula.ts` | 653 |
| `appeler` | Method | `src/cours/runtime/core/formula.ts` | 670 |
| `binaireNommee` | Method | `src/cours/runtime/core/formula.ts` | 662 |
| `calculer` | Method | `src/cours/runtime/core/formula.ts` | 689 |
| `condition` | Method | `src/cours/runtime/core/formula.ts` | 642 |
| `depenser` | Method | `src/cours/runtime/core/formula.ts` | 537 |
| `etendre` | Method | `src/cours/runtime/core/formula.ts` | 619 |
| `exigerDansLaGrille` | Method | `src/cours/runtime/core/formula.ts` | 568 |
| `expression` | Method | `src/cours/runtime/core/formula.ts` | 533 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Commandes → Refuser` | cross_community | 10 |
| `Graphique → LettreColonne` | cross_community | 10 |
| `Graphique → LireContenu` | cross_community | 10 |
| `Graphique → ArbreDe` | cross_community | 10 |
| `TableauDesEtapes → LireNombre` | cross_community | 10 |
| `TableauDesEtapes → SourceDeFormule` | cross_community | 10 |
| `TableauDesEtapes → Analyser` | cross_community | 10 |
| `Cellule → Comparaison` | cross_community | 10 |
| `Cellule → NomCellule` | cross_community | 10 |
| `Champ → Somme` | cross_community | 10 |

## How to Explore

1. `context({name: "appliquer"})` — see callers and callees
2. `query({search_query: "cluster_487"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
