---
name: gitnexus-area-blocks
description: "Skill for the Blocks area of portfolio-2025-front. 772 symbols across 59 files."
---

# Blocks

772 symbols | 59 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how envoyer, solution, envoyer work
- Modifying blocks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/cours/runtime/blocks/FpTableBuild.ts` | bornerDecimales, copierColonne, formater, atelier, attenduDe (+45) |
| `src/cours/runtime/blocks/FpPlot.ts` | description, entreeDeLegende, legende, libelleDeSource, nomDuTrait (+44) |
| `src/cours/runtime/blocks/FpCardsort.ts` | formaterChrono, battre, cartesDe, choisir, choix (+42) |
| `src/cours/runtime/blocks/FpSheet.ts` | valeur, atelier, barre, bilanErreurs, boutonRecopier (+41) |
| `src/cours/runtime/blocks/FpEscape.ts` | solution, acheve, annonceOuverture, appliquer, atelier (+37) |
| `src/cours/runtime/blocks/FpBlock.ts` | annonces, attente, boutonNeSaitPas, cloture, depuisAffichage (+32) |
| `src/cours/runtime/blocks/reglable.ts` | boutonAnimer, panneauDeReglages, prereglagesAffiches, texteDuBloc, arrondi (+28) |
| `src/cours/runtime/blocks/FpSpaced.ts` | bilan, bonneReponse, carteDeMaitrise, entete, etatSansQuestion (+24) |
| `src/cours/runtime/blocks/production.ts` | conclure, justes, relacherLaSaisie, actionsDeProduction, atelier (+23) |
| `src/cours/runtime/blocks/FpConcept4.ts` | motifDesTermes, enMots, faces, formule, graphique (+22) |

## Entry Points

Start here when exploring this area:

- **`envoyer`** (Function) — `src/cours/runtime/blocks/FpChallenge.ts:173`
- **`solution`** (Function) — `src/cours/runtime/blocks/FpEscape.ts:321`
- **`envoyer`** (Function) — `src/cours/runtime/blocks/FpExit.ts:83`
- **`envoyer`** (Function) — `src/cours/runtime/blocks/FpNumeric.ts:81`
- **`valeur`** (Function) — `src/cours/runtime/blocks/FpSheet.ts:430`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `UrlEchappee` | Class | `src/cours/runtime/core/html.ts` | 6 |
| `FpBlock` | Class | `src/cours/runtime/blocks/FpBlock.ts` | 51 |
| `FpConcept4` | Class | `src/cours/runtime/blocks/FpConcept4.ts` | 57 |
| `FpPlot` | Class | `src/cours/runtime/blocks/FpPlot.ts` | 181 |
| `FpQuote` | Class | `src/cours/runtime/blocks/FpQuote.ts` | 14 |
| `FpSpaced` | Class | `src/cours/runtime/blocks/FpSpaced.ts` | 72 |
| `FpStory` | Class | `src/cours/runtime/blocks/FpStory.ts` | 42 |
| `FpVote` | Class | `src/cours/runtime/blocks/FpVote.ts` | 70 |
| `FpReglable` | Class | `src/cours/runtime/blocks/reglable.ts` | 71 |
| `FpVerdicts` | Class | `src/cours/runtime/blocks/verdicts.ts` | 3 |
| `FpChallenge` | Class | `src/cours/runtime/blocks/FpChallenge.ts` | 74 |
| `FpEscape` | Class | `src/cours/runtime/blocks/FpEscape.ts` | 89 |
| `FpPro` | Class | `src/cours/runtime/blocks/FpPro.ts` | 37 |
| `FpPulse` | Class | `src/cours/runtime/blocks/FpPulse.ts` | 54 |
| `FpWorked` | Class | `src/cours/runtime/blocks/FpWorked.ts` | 34 |
| `FpContenu` | Class | `src/cours/runtime/blocks/contenu.ts` | 3 |
| `FpEnvoi` | Class | `src/cours/runtime/blocks/contenu.ts` | 17 |
| `FpRedaction` | Class | `src/cours/runtime/blocks/redaction.ts` | 3 |
| `VerdictsParQuestion` | Class | `src/cours/runtime/blocks/retours.ts` | 90 |
| `Evaluation` | Class | `src/cours/runtime/core/formula.ts` | 485 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Commandes → Refuser` | cross_community | 10 |
| `Commandes → Avancer` | cross_community | 10 |
| `Pilote → Courant` | cross_community | 10 |
| `Graphique → LettreColonne` | cross_community | 10 |
| `Graphique → LireContenu` | cross_community | 10 |
| `Graphique → ArbreDe` | cross_community | 10 |
| `TableauDesEtapes → LireNombre` | cross_community | 10 |
| `TableauDesEtapes → SourceDeFormule` | cross_community | 10 |
| `TableauDesEtapes → Analyser` | cross_community | 10 |
| `Cellule → Comparaison` | cross_community | 10 |

## How to Explore

1. `context({name: "envoyer"})` — see callers and callees
2. `query({search_query: "blocks"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
