---
name: gitnexus-area-auth
description: "Skill for the Auth area of portfolio-2025-front. 39 symbols across 11 files."
---

# Auth

39 symbols | 11 files | Cohesion: 96%

## When to Use

- Working with code in `src/`
- Understanding how loadGoogleGis, error, error work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/auth/auth.component.ts` | error, handleGoogleAuth, setGoogleError, handleLoginSubmit, handleSignupSubmit (+12) |
| `src/app/core/adapters/auth-http.adapter.ts` | login, register, requestPasswordReset, resetPassword, googleAuth |
| `src/app/core/ports/auth.port.ts` | login, register, requestPasswordReset, resetPassword, googleAuth |
| `src/app/features/auth/forgot-password.component.ts` | submit, ForgotPasswordComponent |
| `src/app/features/auth/formulaire-de-mot-de-passe.ts` | envoyer, FormulaireDeMotDePasse |
| `src/app/features/auth/reset-password.component.ts` | submit, ResetPasswordComponent |
| `src/app/features/auth/formulaire-auth.component.spec.ts` | bouton, racine |
| `src/app/core/utils/google-gis.ts` | loadGoogleGis |
| `src/app/features/auth/verify-email.component.ts` | error |
| `src/app/shared/utils/form-submit.utils.ts` | error |

## Entry Points

Start here when exploring this area:

- **`loadGoogleGis`** (Function) — `src/app/core/utils/google-gis.ts:2`
- **`error`** (Function) — `src/app/features/auth/auth.component.ts:330`
- **`error`** (Function) — `src/app/features/auth/verify-email.component.ts:49`
- **`error`** (Function) — `src/app/shared/utils/form-submit.utils.ts:21`
- **`extractErrorMessage`** (Function) — `src/app/shared/utils/http-error.utils.ts:4`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ForgotPasswordComponent` | Class | `src/app/features/auth/forgot-password.component.ts` | 15 |
| `FormulaireDeMotDePasse` | Class | `src/app/features/auth/formulaire-de-mot-de-passe.ts` | 7 |
| `ResetPasswordComponent` | Class | `src/app/features/auth/reset-password.component.ts` | 20 |
| `AuthComponent` | Class | `src/app/features/auth/auth.component.ts` | 77 |
| `loadGoogleGis` | Function | `src/app/core/utils/google-gis.ts` | 2 |
| `error` | Function | `src/app/features/auth/auth.component.ts` | 330 |
| `error` | Function | `src/app/features/auth/verify-email.component.ts` | 49 |
| `error` | Function | `src/app/shared/utils/form-submit.utils.ts` | 21 |
| `extractErrorMessage` | Function | `src/app/shared/utils/http-error.utils.ts` | 4 |
| `onSuccess` | Function | `src/app/features/auth/auth.component.ts` | 279 |
| `next` | Function | `src/app/features/auth/auth.component.ts` | 329 |
| `callback` | Function | `src/app/features/auth/auth.component.ts` | 317 |
| `onSuccess` | Function | `src/app/features/auth/auth.component.ts` | 237 |
| `handleGoogleAuth` | Method | `src/app/features/auth/auth.component.ts` | 293 |
| `setGoogleError` | Method | `src/app/features/auth/auth.component.ts` | 340 |
| `login` | Method | `src/app/core/adapters/auth-http.adapter.ts` | 12 |
| `register` | Method | `src/app/core/adapters/auth-http.adapter.ts` | 17 |
| `login` | Method | `src/app/core/ports/auth.port.ts` | 17 |
| `register` | Method | `src/app/core/ports/auth.port.ts` | 18 |
| `handleLoginSubmit` | Method | `src/app/features/auth/auth.component.ts` | 268 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnSuccess → HasControlCharacter` | intra_community | 4 |
| `Soumettre → HandleFormSubmit` | cross_community | 3 |
| `Soumettre → Login` | intra_community | 3 |
| `Soumettre → Login` | intra_community | 3 |
| `Soumettre → Register` | intra_community | 3 |
| `Soumettre → Register` | intra_community | 3 |
| `Submit → HandleFormSubmit` | cross_community | 3 |

## How to Explore

1. `context({name: "loadGoogleGis"})` — see callers and callees
2. `query({search_query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
