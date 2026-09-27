---
name: gitnexus-area-factories
description: "Skill for the Factories area of portfolio-2025-front. 74 symbols across 24 files."
---

# Factories

74 symbols | 24 files | Cohesion: 76%

## When to Use

- Working with code in `src/`
- Understanding how creerMetadonneesBrique, buildCardsortPlan, buildEscapeParcours work
- Modifying factories-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/testing/factories/cours.factory.ts` | buildCardsortPlan, buildEscapeParcours, buildExitBillet, buildProCas, buildProCasAQuestionsLibres (+18) |
| `src/testing/factories/visual-slide.factory.ts` | buildRecitVisuel, buildVisualChartSlide, buildVisualImageHeroSlide, buildVisualNestedQuizSlide, buildVisualQuizSlide (+4) |
| `src/testing/factories/formations.factory.ts` | buildAnnotationFormateur, buildEtatParticipant, buildSpacedQuestionPublique, buildStrategiePublique, buildSyntheseConcept (+3) |
| `src/testing/factories/lead-magnet.factory.ts` | buildToolkitPageData, createLeadMagnetPortStub, createLeadMagnetPortStubWithError, espionnerLeadMagnetPort |
| `src/testing/factories/cookie-consent.factory.ts` | createCookieConsentPortStub, createMockAppConfig, buildCookiePreferences, createCookieConsentServiceStub |
| `src/app/features/cours/etudiant/cours-etudiant.component.spec.ts` | servirUnQcmVisuelEnPremier, servi, sujetDeSeance |
| `src/app/core/adapters/formations-http.adapter.spec.ts` | appels, ecritures |
| `src/testing/factories/instantane-b2-01.factory.ts` | buildDonneesParBrique, buildInstantaneDeSubstitution |
| `src/testing/toolkit-de-formation.ts` | decrireToolkitDeFormation, rendu |
| `src/testing/factories/presentation.factory.ts` | buildInteractionsResponse, createPresentationPortStub |

## Entry Points

Start here when exploring this area:

- **`creerMetadonneesBrique`** (Function) — `src/cours/content/types.ts:315`
- **`buildCardsortPlan`** (Function) — `src/testing/factories/cours.factory.ts:466`
- **`buildEscapeParcours`** (Function) — `src/testing/factories/cours.factory.ts:514`
- **`buildExitBillet`** (Function) — `src/testing/factories/cours.factory.ts:145`
- **`buildProCas`** (Function) — `src/testing/factories/cours.factory.ts:229`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `creerMetadonneesBrique` | Function | `src/cours/content/types.ts` | 315 |
| `buildCardsortPlan` | Function | `src/testing/factories/cours.factory.ts` | 466 |
| `buildEscapeParcours` | Function | `src/testing/factories/cours.factory.ts` | 514 |
| `buildExitBillet` | Function | `src/testing/factories/cours.factory.ts` | 145 |
| `buildProCas` | Function | `src/testing/factories/cours.factory.ts` | 229 |
| `buildProCasAQuestionsLibres` | Function | `src/testing/factories/cours.factory.ts` | 248 |
| `buildQuoteCitation` | Function | `src/testing/factories/cours.factory.ts` | 201 |
| `buildRecallQuestion` | Function | `src/testing/factories/cours.factory.ts` | 129 |
| `buildStoryRecit` | Function | `src/testing/factories/cours.factory.ts` | 212 |
| `buildTableBuildPlan` | Function | `src/testing/factories/cours.factory.ts` | 392 |
| `buildAnnotationFormateur` | Function | `src/testing/factories/formations.factory.ts` | 248 |
| `buildEtatParticipant` | Function | `src/testing/factories/formations.factory.ts` | 169 |
| `buildSpacedQuestionPublique` | Function | `src/testing/factories/formations.factory.ts` | 152 |
| `buildStrategiePublique` | Function | `src/testing/factories/formations.factory.ts` | 130 |
| `buildSyntheseConcept` | Function | `src/testing/factories/formations.factory.ts` | 140 |
| `buildVerdictProduction` | Function | `src/testing/factories/formations.factory.ts` | 106 |
| `buildVerdictTentative` | Function | `src/testing/factories/formations.factory.ts` | 121 |
| `createFormationsPortStub` | Function | `src/testing/factories/formations.factory.ts` | 291 |
| `buildChallengeProbleme` | Function | `src/testing/factories/cours.factory.ts` | 173 |
| `buildConcept4Definition` | Function | `src/testing/factories/cours.factory.ts` | 266 |

## How to Explore

1. `context({name: "creerMetadonneesBrique"})` — see callers and callees
2. `query({search_query: "factories"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
