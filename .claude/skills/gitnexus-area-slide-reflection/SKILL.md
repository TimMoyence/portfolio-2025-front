---
name: gitnexus-area-slide-reflection
description: "Skill for the Slide-reflection area of portfolio-2025-front. 26 symbols across 6 files."
---

# Slide-reflection

26 symbols | 6 files | Cohesion: 83%

## When to Use

- Working with code in `src/`
- Understanding how avecLaBase, enqueueFreeResponse, ouvrirLaBase work
- Modifying slide-reflection-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | debrief, etat, garderMalgreLeRefus, jusqua, garder (+5) |
| `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | avecLaBase, enqueueFreeResponse, ouvrirLaBase, removeFreeResponse, pendingFreeResponses (+1) |
| `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.ts` | SlideReflectionComponent, etatAffiche, activiteCourante, constructor, save |
| `src/app/shared/slides/session/reponses-libres.service.ts` | issueDeLEnvoi, traiterLeRefus, cleDeReponseLibre |
| `src/app/features/cours/etudiant/cours-etudiant.component.spec.ts` | garderPuisRattacher |
| `src/app/shared/slides/session/reponses-libres.service.spec.ts` | textesEnFile |

## Entry Points

Start here when exploring this area:

- **`avecLaBase`** (Function) — `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts:31`
- **`enqueueFreeResponse`** (Function) — `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts:46`
- **`ouvrirLaBase`** (Function) — `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts:15`
- **`removeFreeResponse`** (Function) — `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts:80`
- **`cleDeReponseLibre`** (Function) — `src/app/shared/slides/session/reponses-libres.service.ts:32`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SlideReflectionComponent` | Class | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.ts` | 52 |
| `avecLaBase` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 31 |
| `enqueueFreeResponse` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 46 |
| `ouvrirLaBase` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 15 |
| `removeFreeResponse` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 80 |
| `cleDeReponseLibre` | Function | `src/app/shared/slides/session/reponses-libres.service.ts` | 32 |
| `pendingFreeResponses` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 61 |
| `duParticipant` | Function | `src/app/shared/slides/interactions/slide-reflection/free-response.queue.ts` | 65 |
| `issueDeLEnvoi` | Method | `src/app/shared/slides/session/reponses-libres.service.ts` | 94 |
| `traiterLeRefus` | Method | `src/app/shared/slides/session/reponses-libres.service.ts` | 114 |
| `activiteCourante` | Method | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.ts` | 123 |
| `constructor` | Method | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.ts` | 74 |
| `save` | Method | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.ts` | 97 |
| `garderPuisRattacher` | Function | `src/app/features/cours/etudiant/cours-etudiant.component.spec.ts` | 1490 |
| `debrief` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 106 |
| `etat` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 140 |
| `garderMalgreLeRefus` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 167 |
| `jusqua` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 148 |
| `garder` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 61 |
| `monterEnSeance` | Function | `src/app/shared/slides/interactions/slide-reflection/slide-reflection.component.spec.ts` | 69 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → ActiveReflection` | intra_community | 3 |
| `Constructor → InteractionId` | intra_community | 3 |

## How to Explore

1. `context({name: "avecLaBase"})` — see callers and callees
2. `query({search_query: "slide-reflection"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
