---
name: gitnexus-area-adapters
description: "Skill for the Adapters area of portfolio-2025-front. 113 symbols across 30 files."
---

# Adapters

113 symbols | 30 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how getApiBaseUrl, factory, handleFormSubmit work
- Modifying adapters-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/core/adapters/formations-http.adapter.ts` | ecritureEtudiante, entetes, declarerJalon, enregistrerReponseLibre, envoyerDefi (+35) |
| `src/app/core/adapters/formations-http.adapter.spec.ts` | erreursApres, refusDeReponseLibre, erreursDeReponse, refusPour, appeler (+19) |
| `src/app/core/adapters/audit-request-http.adapter.ts` | AuditRequestHttpAdapter, onCompleted, onFailed, onHeartbeat, onProgress (+1) |
| `src/app/core/adapters/auth-http.adapter.ts` | AuthHttpAdapter, changePassword, setPassword, updateProfile, verifyEmail |
| `src/app/core/ports/auth.port.ts` | AuthPort, changePassword, setPassword, updateProfile, verifyEmail |
| `src/app/core/ports/formations.port.ts` | FormationsPort, RattachementRefuse, ReponseLibreRefusee, ReponseRefusee, SujetRefuse |
| `src/app/features/profile/profile.component.ts` | changePassword, saveProfile, setPassword |
| `src/app/features/cours/etudiant/cours-etudiant.component.ts` | lireRefus, lireLeSujet |
| `src/app/core/adapters/formations-fil.ts` | ecranDuFil, revelationDuFil |
| `src/app/core/adapters/article-http.adapter.ts` | ArticleHttpAdapter |

## Entry Points

Start here when exploring this area:

- **`getApiBaseUrl`** (Function) — `src/app/core/http/api-config.ts:3`
- **`factory`** (Function) — `src/app/features/cours/cours-flux.token.ts:40`
- **`handleFormSubmit`** (Function) — `src/app/shared/utils/form-submit.utils.ts:11`
- **`onCompleted`** (Function) — `src/app/core/adapters/audit-request-http.adapter.ts:62`
- **`onFailed`** (Function) — `src/app/core/adapters/audit-request-http.adapter.ts:73`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ArticleHttpAdapter` | Class | `src/app/core/adapters/article-http.adapter.ts` | 7 |
| `AuditRequestHttpAdapter` | Class | `src/app/core/adapters/audit-request-http.adapter.ts` | 17 |
| `AuthHttpAdapter` | Class | `src/app/core/adapters/auth-http.adapter.ts` | 7 |
| `ContactHttpAdapter` | Class | `src/app/core/adapters/contact-http.adapter.ts` | 9 |
| `CookieConsentHttpAdapter` | Class | `src/app/core/adapters/cookie-consent-http.adapter.ts` | 9 |
| `FormationCatalogueHttpAdapter` | Class | `src/app/core/adapters/formation-catalogue-http.adapter.ts` | 8 |
| `FormationsHttpAdapter` | Class | `src/app/core/adapters/formations-http.adapter.ts` | 177 |
| `LeadMagnetHttpAdapter` | Class | `src/app/core/adapters/lead-magnet-http.adapter.ts` | 9 |
| `PresentationHttpAdapter` | Class | `src/app/core/adapters/presentation-http.adapter.ts` | 10 |
| `RattachementRefuse` | Class | `src/app/core/ports/formations.port.ts` | 238 |
| `ReponseLibreRefusee` | Class | `src/app/core/ports/formations.port.ts` | 307 |
| `ReponseRefusee` | Class | `src/app/core/ports/formations.port.ts` | 294 |
| `SujetRefuse` | Class | `src/app/core/ports/formations.port.ts` | 255 |
| `getApiBaseUrl` | Function | `src/app/core/http/api-config.ts` | 3 |
| `factory` | Function | `src/app/features/cours/cours-flux.token.ts` | 40 |
| `handleFormSubmit` | Function | `src/app/shared/utils/form-submit.utils.ts` | 11 |
| `onCompleted` | Function | `src/app/core/adapters/audit-request-http.adapter.ts` | 62 |
| `onFailed` | Function | `src/app/core/adapters/audit-request-http.adapter.ts` | 73 |
| `onHeartbeat` | Function | `src/app/core/adapters/audit-request-http.adapter.ts` | 85 |
| `onProgress` | Function | `src/app/core/adapters/audit-request-http.adapter.ts` | 53 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DeclarerJalon → ReponseRefusee` | cross_community | 4 |
| `DeclarerJalon → CodeDuProbleme` | cross_community | 4 |
| `ChargerLaSeance → SujetRefuse` | cross_community | 4 |
| `EnvoyerDefi → ReponseRefusee` | cross_community | 4 |
| `EnvoyerDefi → CodeDuProbleme` | cross_community | 4 |
| `EnvoyerProduction → ReponseRefusee` | cross_community | 4 |
| `EnvoyerProduction → CodeDuProbleme` | cross_community | 4 |
| `TenterEnigme → ReponseRefusee` | cross_community | 4 |
| `TenterEnigme → CodeDuProbleme` | cross_community | 4 |
| `Defier → ReponseRefusee` | cross_community | 4 |

## How to Explore

1. `context({name: "getApiBaseUrl"})` — see callers and callees
2. `query({search_query: "adapters"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
