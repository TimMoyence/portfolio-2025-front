---
name: gitnexus-area-services
description: "Skill for the Services area of portfolio-2025-front. 54 symbols across 12 files."
---

# Services

54 symbols | 12 files | Cohesion: 88%

## When to Use

- Working with code in `src/`
- Understanding how authGuard, error, factory work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/core/services/auth-state.service.ts` | adoptToken, armRefresh, login, restoreSession, scheduleRefresh (+15) |
| `src/app/core/services/cookie-consent.service.ts` | getDefaultPreferences, getPolicyVersion, getPreferences, getRegionScope, normalizePreferences (+9) |
| `src/app/core/services/auth-state.service.spec.ts` | atteindreLePremierRenouvellement, attendreLeDeuxiemeEssaiApres, avancer, restaurer, restaurerSansJetonApresUnRefus (+1) |
| `src/app/core/services/verrou-inter-onglets.ts` | factory, creerVerrouInterOnglets, gestionnaireDuNavigateur |
| `src/app/core/guards/auth.guard.spec.ts` | attendreLAccesUneFoisConnecte, garderLeProfil |
| `src/app/shared/services/a11y-dialog.service.spec.ts` | tabulation, tabulerSansConteneur |
| `src/app/shared/components/navbar/navbar.component.ts` | handleGlobalKeydown, trapFocusInMobileMenu |
| `src/app/core/guards/auth.guard.ts` | authGuard |
| `src/app/core/services/cookie-consent.service.spec.ts` | consentirAuxPreferencesSansAnalyse |
| `src/app/core/adapters/cookie-consent-http.adapter.ts` | recordConsent |

## Entry Points

Start here when exploring this area:

- **`authGuard`** (Function) — `src/app/core/guards/auth.guard.ts:4`
- **`error`** (Function) — `src/app/core/services/auth-state.service.ts:147`
- **`factory`** (Function) — `src/app/core/services/verrou-inter-onglets.ts:20`
- **`creerVerrouInterOnglets`** (Function) — `src/app/core/services/verrou-inter-onglets.ts:5`
- **`adoptToken`** (Method) — `src/app/core/services/auth-state.service.ts:219`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `authGuard` | Function | `src/app/core/guards/auth.guard.ts` | 4 |
| `error` | Function | `src/app/core/services/auth-state.service.ts` | 147 |
| `factory` | Function | `src/app/core/services/verrou-inter-onglets.ts` | 20 |
| `creerVerrouInterOnglets` | Function | `src/app/core/services/verrou-inter-onglets.ts` | 5 |
| `adoptToken` | Method | `src/app/core/services/auth-state.service.ts` | 219 |
| `armRefresh` | Method | `src/app/core/services/auth-state.service.ts` | 161 |
| `login` | Method | `src/app/core/services/auth-state.service.ts` | 86 |
| `restoreSession` | Method | `src/app/core/services/auth-state.service.ts` | 117 |
| `scheduleRefresh` | Method | `src/app/core/services/auth-state.service.ts` | 167 |
| `suivreLaRestauration` | Method | `src/app/core/services/auth-state.service.ts` | 136 |
| `recordConsent` | Method | `src/app/core/adapters/cookie-consent-http.adapter.ts` | 14 |
| `recordConsent` | Method | `src/app/core/ports/cookie-consent.port.ts` | 6 |
| `getDefaultPreferences` | Method | `src/app/core/services/cookie-consent.service.ts` | 62 |
| `getPolicyVersion` | Method | `src/app/core/services/cookie-consent.service.ts` | 102 |
| `getPreferences` | Method | `src/app/core/services/cookie-consent.service.ts` | 57 |
| `getRegionScope` | Method | `src/app/core/services/cookie-consent.service.ts` | 106 |
| `normalizePreferences` | Method | `src/app/core/services/cookie-consent.service.ts` | 116 |
| `saveConsent` | Method | `src/app/core/services/cookie-consent.service.ts` | 66 |
| `withdrawConsent` | Method | `src/app/core/services/cookie-consent.service.ts` | 98 |
| `writeConsent` | Method | `src/app/core/services/cookie-consent.service.ts` | 138 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RefreshUnderLock → ClearRefreshTimer` | cross_community | 10 |
| `RefreshUnderLock → HttpStatusOf` | cross_community | 8 |
| `OnRefreshError → ScheduleRefresh` | cross_community | 7 |
| `RefreshUnderLock → CrossWindowLock` | cross_community | 7 |
| `DoRefresh → ClearRefreshTimer` | cross_community | 7 |
| `OnRefreshError → _token` | intra_community | 5 |
| `HandleGlobalKeydown → RestoreFocus` | cross_community | 5 |
| `HandleGlobalKeydown → SetDropdownOpen` | cross_community | 4 |
| `HandleGlobalKeydown → FocusFirstDescendant` | cross_community | 4 |
| `HandleGlobalKeydown → SaveFocus` | cross_community | 4 |

## How to Explore

1. `context({name: "authGuard"})` — see callers and callees
2. `query({search_query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
