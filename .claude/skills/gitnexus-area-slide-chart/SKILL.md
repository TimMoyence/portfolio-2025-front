---
name: gitnexus-area-slide-chart
description: "Skill for the Slide-chart area of portfolio-2025-front. 35 symbols across 9 files."
---

# Slide-chart

35 symbols | 9 files | Cohesion: 96%

## When to Use

- Working with code in `src/`
- Understanding how arrondir, estEntier, pasRond work
- Modifying slide-chart-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | SlideChartComponent, degager, pasAutomatique, plageAutomatique, prochainIdentifiantDeDescription (+9) |
| `src/app/shared/slides/layouts/slide-chart/slide-chart.simulation.spec.ts` | series, monter, attendue, valeursDansLOrdreDuRendu, variables (+3) |
| `src/app/shared/slides/layouts/axe-gradue.ts` | arrondir, estEntier, pasRond, ecart, position (+1) |
| `src/app/shared/slides/layouts/slide-boxplot/slide-boxplot.component.ts` | SlideBoxplotComponent, prochainIdentifiantDeDescription |
| `src/app/features/cours/presentateur/cours-panneau-activite.component.spec.ts` | monter |
| `src/app/shared/slides/layouts/slide-chart/slide-chart.component.spec.ts` | monter |
| `src/app/shared/slides/layouts/slide-guide/slide-guide.component.spec.ts` | monter |
| `src/testing/graphique-monte.ts` | monterLeGraphique |
| `src/testing/montage-page.ts` | poserLesEntrees |

## Entry Points

Start here when exploring this area:

- **`arrondir`** (Function) — `src/app/shared/slides/layouts/axe-gradue.ts:16`
- **`estEntier`** (Function) — `src/app/shared/slides/layouts/axe-gradue.ts:20`
- **`pasRond`** (Function) — `src/app/shared/slides/layouts/axe-gradue.ts:29`
- **`ecart`** (Function) — `src/app/shared/slides/layouts/axe-gradue.ts:44`
- **`position`** (Function) — `src/app/shared/slides/layouts/axe-gradue.ts:24`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SlideBoxplotComponent` | Class | `src/app/shared/slides/layouts/slide-boxplot/slide-boxplot.component.ts` | 42 |
| `SlideChartComponent` | Class | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 122 |
| `arrondir` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 16 |
| `estEntier` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 20 |
| `pasRond` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 29 |
| `ecart` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 44 |
| `position` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 24 |
| `valeursGraduees` | Function | `src/app/shared/slides/layouts/axe-gradue.ts` | 52 |
| `monterLeGraphique` | Function | `src/testing/graphique-monte.ts` | 12 |
| `poserLesEntrees` | Function | `src/testing/montage-page.ts` | 74 |
| `abscisse` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 257 |
| `ariaLabel` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 219 |
| `formatValue` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 226 |
| `marqueur` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 230 |
| `constructor` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 210 |
| `observeVisibility` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 261 |
| `play` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 234 |
| `stop` | Method | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 281 |
| `prochainIdentifiantDeDescription` | Function | `src/app/shared/slides/layouts/slide-boxplot/slide-boxplot.component.ts` | 30 |
| `degager` | Function | `src/app/shared/slides/layouts/slide-chart/slide-chart.component.ts` | 87 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → Stop` | intra_community | 4 |
| `Constructor → Labels` | intra_community | 4 |
| `Constructor → Step` | intra_community | 4 |
| `Constructor → HasPlayed` | intra_community | 3 |

## How to Explore

1. `context({name: "arrondir"})` — see callers and callees
2. `query({search_query: "slide-chart"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
