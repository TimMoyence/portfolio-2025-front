---
name: gitnexus-area-etudiant
description: "Skill for the Etudiant area of portfolio-2025-front. 127 symbols across 21 files."
---

# Etudiant

127 symbols | 21 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how retourDeRefus, retourDeTentative, retrouves work
- Modifying etudiant-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/cours/etudiant/cours-etudiant.component.ts` | retrouves, refusDe, ajouter, chargerLaSeance, chargerLesDonneesDeLEcran (+51) |
| `src/app/features/cours/etudiant/cours-etudiant.component.spec.ts` | attendreLaFileVideeEnLigne, correctionVerrouillee, sujetAuSecondEcranVerrouille, verrouiller, rattacherAvecSecret (+22) |
| `src/cours/runtime/core/deck.ts` | canNavigate, canNavigate, current, createDeck, applyRemote (+4) |
| `src/cours/runtime/core/queue.ts` | ecrireOuRefuser, enqueue, flush, pending, purgerLesAutresEnvois (+1) |
| `src/cours/runtime/core/lock.ts` | createLock, arm, disarm, onIncident, recordAnswerDuration |
| `src/app/core/ports/retours-brique.ts` | retourDeRefus, retourDeTentative, retirerLesRefus |
| `src/app/shared/slides/session/slide-activity.component.ts` | SlideActivityComponent, registerAfterRender |
| `src/app/shared/slides/session/lecture-ecran.ts` | ecranDuRappel, enteteDeQuestionnaire |
| `src/cours/runtime/core/queue.spec.ts` | flushEnCours, transmettre |
| `src/cours/runtime/core/storage.ts` | persistJson, writeJson |

## Entry Points

Start here when exploring this area:

- **`retourDeRefus`** (Function) — `src/app/core/ports/retours-brique.ts:46`
- **`retourDeTentative`** (Function) — `src/app/core/ports/retours-brique.ts:31`
- **`retrouves`** (Function) — `src/app/features/cours/etudiant/cours-etudiant.component.ts:1184`
- **`ecranDuRappel`** (Function) — `src/app/shared/slides/session/lecture-ecran.ts:263`
- **`enteteDeQuestionnaire`** (Function) — `src/app/shared/slides/session/lecture-ecran.ts:123`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SlideActivityComponent` | Class | `src/app/shared/slides/session/slide-activity.component.ts` | 196 |
| `retourDeRefus` | Function | `src/app/core/ports/retours-brique.ts` | 46 |
| `retourDeTentative` | Function | `src/app/core/ports/retours-brique.ts` | 31 |
| `retrouves` | Function | `src/app/features/cours/etudiant/cours-etudiant.component.ts` | 1184 |
| `ecranDuRappel` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 263 |
| `enteteDeQuestionnaire` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 123 |
| `texte` | Function | `src/cours/runtime/core/i18n.ts` | 233 |
| `surRetour` | Function | `src/app/features/cours/etudiant/cours-etudiant.component.ts` | 722 |
| `enqueue` | Function | `src/cours/runtime/core/queue.ts` | 31 |
| `flush` | Function | `src/cours/runtime/core/queue.ts` | 64 |
| `pending` | Function | `src/cours/runtime/core/queue.ts` | 24 |
| `purgerLesAutresEnvois` | Function | `src/cours/runtime/core/queue.ts` | 58 |
| `persistJson` | Function | `src/cours/runtime/core/storage.ts` | 30 |
| `writeJson` | Function | `src/cours/runtime/core/storage.ts` | 21 |
| `buildEnvoiReponse` | Function | `src/testing/factories/queue.factory.ts` | 2 |
| `canNavigate` | Function | `src/cours/runtime/core/deck.ts` | 40 |
| `buildRevelationServie` | Function | `src/testing/factories/cours.factory.ts` | 640 |
| `buildAnswerReviewProps` | Function | `src/testing/factories/visual-slide.factory.ts` | 87 |
| `buildVisualAnswerReviewSlide` | Function | `src/testing/factories/visual-slide.factory.ts` | 106 |
| `buildRattachement` | Function | `src/testing/factories/formations.factory.ts` | 236 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Rattacher → StockageLocal` | cross_community | 7 |
| `ReprendreLesEnvois → Verdicts` | cross_community | 7 |
| `ReprendreLesEnvois → SessionId` | cross_community | 7 |
| `ReprendreLesEnvois → Jeton` | cross_community | 7 |
| `ReprendreLesEnvois → Sujet` | cross_community | 7 |
| `Bind → Texte` | cross_community | 7 |
| `OnScroll → DansLesBornes` | cross_community | 6 |
| `ChargerLaSeance → CreateLock` | cross_community | 6 |
| `ChargerLaSeance → Arm` | cross_community | 6 |
| `ChargerLaSeance → Disarm` | cross_community | 6 |

## How to Explore

1. `context({name: "retourDeRefus"})` — see callers and callees
2. `query({search_query: "etudiant"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
