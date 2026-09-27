---
name: gitnexus-area-banc
description: "Skill for the Banc area of portfolio-2025-front. 118 symbols across 13 files."
---

# Banc

118 symbols | 13 files | Cohesion: 87%

## When to Use

- Working with code in `e2e/`
- Understanding how interagirAvecLEcran, sondeHttp, agirSurLePoste work
- Modifying banc-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/banc/interactions.ts` | attendreLeVerdict, billetDeSortie, classement, placerLaCarte, cliquerUneOption (+31) |
| `e2e/banc/contexte.ts` | agirSurLePoste, classer, demarrerLaSeance, entetesDuFormateur, ouvrirUneSeance (+28) |
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

- **`interagirAvecLEcran`** (Function) — `e2e/banc/interactions.ts:330`
- **`sondeHttp`** (Function) — `scripts/banc/attente.mjs:40`
- **`agirSurLePoste`** (Function) — `e2e/banc/contexte.ts:169`
- **`repondreDepuisLePoste`** (Function) — `e2e/banc/contexte.ts:201`
- **`servirLEcran`** (Function) — `e2e/banc/contexte.ts:137`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AmorcageEchoue` | Class | `scripts/banc/amorcage.mjs` | 2 |
| `AttenteEpuisee` | Class | `scripts/banc/attente.mjs` | 0 |
| `interagirAvecLEcran` | Function | `e2e/banc/interactions.ts` | 330 |
| `sondeHttp` | Function | `scripts/banc/attente.mjs` | 40 |
| `agirSurLePoste` | Function | `e2e/banc/contexte.ts` | 169 |
| `repondreDepuisLePoste` | Function | `e2e/banc/contexte.ts` | 201 |
| `servirLEcran` | Function | `e2e/banc/contexte.ts` | 137 |
| `coursReleve` | Function | `e2e/banc/contexte.ts` | 364 |
| `jetonDuFormateur` | Function | `e2e/banc/contexte.ts` | 97 |
| `seanceDemarreeSurLEcran` | Function | `e2e/banc/contexte.ts` | 462 |
| `seanceLimiteeSurLePremierVote` | Function | `e2e/banc/contexte.ts` | 474 |
| `seancePartagee` | Function | `e2e/banc/contexte.ts` | 485 |
| `amorcerFormateur` | Function | `scripts/banc/amorcage.mjs` | 90 |
| `corpsDInscription` | Function | `scripts/banc/amorcage.mjs` | 29 |
| `inscrireFormateur` | Function | `scripts/banc/amorcage.mjs` | 46 |
| `sqlDePromotion` | Function | `scripts/banc/amorcage.mjs` | 18 |
| `attendreQue` | Function | `scripts/banc/attente.mjs` | 22 |
| `passerALaPhase` | Function | `e2e/banc/interactions.ts` | 409 |
| `environnementDeLApi` | Function | `scripts/banc/configuration.mjs` | 88 |
| `identifiantsDuFormateur` | Function | `scripts/banc/configuration.mjs` | 41 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `InteragirAvecLEcran → AttendreLeVerdict` | intra_community | 5 |
| `InteragirAvecLEcran → TaperVite` | intra_community | 4 |
| `InteragirAvecLEcran → CliquerUneOption` | intra_community | 4 |
| `InteragirAvecLEcran → TexteRapide` | intra_community | 3 |

## How to Explore

1. `context({name: "interagirAvecLEcran"})` — see callers and callees
2. `query({search_query: "banc"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
