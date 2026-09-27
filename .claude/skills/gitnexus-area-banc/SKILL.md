---
name: gitnexus-area-banc
description: "Skill for the Banc area of portfolio-2025-front. 117 symbols across 13 files."
---

# Banc

117 symbols | 13 files | Cohesion: 82%

## When to Use

- Working with code in `e2e/`
- Understanding how interagirAvecLEcran, sondeHttp, agirSurLePoste work
- Modifying banc-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/banc/interactions.ts` | billetDeSortie, cliquerUneOption, curseurs, defi, envoyerPourUnRetour (+30) |
| `e2e/banc/contexte.ts` | agirSurLePoste, demarrerLaSeance, entetesDuFormateur, lireLesResultats, objetRenvoye (+28) |
| `scripts/banc/jouer.mjs` | annoncer, compose, construireLeBack, executer, executerSql (+9) |
| `e2e/banc/volume-par-ecran.spec.ts` | ouvrirLaClasse, voteJumele, consigner, surChaquePoste, surveiller (+4) |
| `scripts/banc/amorcage.mjs` | AmorcageEchoue, amorcerFormateur, connecterLeFormateur, corpsDInscription, inscrireFormateur (+1) |
| `scripts/banc/configuration.mjs` | environnementDeLApi, identifiantsDuFormateur, secretAleatoire, secretsTropCourts, variablesDeBase |
| `e2e/banc/cadence-flux.spec.ts` | rafaleDeReponses, ouvrirLeFlux, lire, signalerLOuverture |
| `scripts/banc/attente.mjs` | sondeHttp, AttenteEpuisee, attendreQue |
| `e2e/banc/vote-jumele.spec.ts` | seanceDuFichier, optionsAffichees, voterDans |
| `scripts/banc/attente.test.mjs` | sonder, patienter |

## Entry Points

Start here when exploring this area:

- **`interagirAvecLEcran`** (Function) — `e2e/banc/interactions.ts:309`
- **`sondeHttp`** (Function) — `scripts/banc/attente.mjs:40`
- **`agirSurLePoste`** (Function) — `e2e/banc/contexte.ts:162`
- **`lireLesResultats`** (Function) — `e2e/banc/contexte.ts:150`
- **`repondreDepuisLePoste`** (Function) — `e2e/banc/contexte.ts:194`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AmorcageEchoue` | Class | `scripts/banc/amorcage.mjs` | 2 |
| `AttenteEpuisee` | Class | `scripts/banc/attente.mjs` | 0 |
| `interagirAvecLEcran` | Function | `e2e/banc/interactions.ts` | 309 |
| `sondeHttp` | Function | `scripts/banc/attente.mjs` | 40 |
| `agirSurLePoste` | Function | `e2e/banc/contexte.ts` | 162 |
| `lireLesResultats` | Function | `e2e/banc/contexte.ts` | 150 |
| `repondreDepuisLePoste` | Function | `e2e/banc/contexte.ts` | 194 |
| `servirLEcran` | Function | `e2e/banc/contexte.ts` | 130 |
| `lireDepuisLePoste` | Function | `e2e/banc/contexte.ts` | 231 |
| `lireLeSujet` | Function | `e2e/banc/contexte.ts` | 242 |
| `lireMonEtat` | Function | `e2e/banc/contexte.ts` | 223 |
| `coursReleve` | Function | `e2e/banc/contexte.ts` | 357 |
| `seanceDemarreeSurLEcran` | Function | `e2e/banc/contexte.ts` | 455 |
| `seanceLimiteeSurLePremierVote` | Function | `e2e/banc/contexte.ts` | 467 |
| `seancePartagee` | Function | `e2e/banc/contexte.ts` | 478 |
| `amorcerFormateur` | Function | `scripts/banc/amorcage.mjs` | 90 |
| `corpsDInscription` | Function | `scripts/banc/amorcage.mjs` | 29 |
| `inscrireFormateur` | Function | `scripts/banc/amorcage.mjs` | 46 |
| `sqlDePromotion` | Function | `scripts/banc/amorcage.mjs` | 18 |
| `attendreQue` | Function | `scripts/banc/attente.mjs` | 22 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `InteragirAvecLEcran → AttendreLeVerdict` | cross_community | 5 |
| `InteragirAvecLEcran → TaperVite` | intra_community | 4 |
| `InteragirAvecLEcran → CliquerUneOption` | intra_community | 4 |
| `InteragirAvecLEcran → TexteRapide` | intra_community | 3 |

## How to Explore

1. `context({name: "interagirAvecLEcran"})` — see callers and callees
2. `query({search_query: "banc"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
