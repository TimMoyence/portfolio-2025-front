---
name: gitnexus-area-testing
description: "Skill for the Testing area of portfolio-2025-front. 135 symbols across 51 files."
---

# Testing

135 symbols | 51 files | Cohesion: 88%

## When to Use

- Working with code in `src/`
- Understanding how createSync, bloc, creerOuverture work
- Modifying testing-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/testing/banc-de-brique.ts` | attendreLEnvoiVideRefuse, attendreLaChargeInerte, attendreLeRenvoiEpuise, cliquerOmbre, libelleOmbre (+13) |
| `src/cours/runtime/core/sync.spec.ts` | attendreJusqua, collecter, collecterResultats, reveillerApresUnEtat, ouvrirEnSuivantLesStatuts (+8) |
| `src/testing/flux-sse.ts` | bloc, creerOuverture, couper, deposer, envoyer (+3) |
| `src/testing/reglages-briques.ts` | attendreLeParametreEchappe, attendreParametresAnnonces, glisserCurseur, parametre, animer (+3) |
| `src/cours/runtime/core/sync.ts` | createSync, ouvertureNative, onFin, onResultats, onState (+1) |
| `src/testing/contraste.ts` | canauxDe, fondEffectif, lineaire, luminance, rapportDeContraste (+1) |
| `src/testing/montage-page.ts` | montagePage, pageMontee, composant, fixture, racine (+1) |
| `src/testing/assertions-briques.ts` | attendreChaqueClasseCouverte, attendreAucunEffet, attendreLaCorrectionNicheeEffacee, parcourirLesRolesSansEffet, attendreLaMemeTypographieAuPresentateur (+1) |
| `src/testing/panneau-pedagogique.ts` | preparerLePanneau, noteAffichee, relireLePanneau, repereDuPanneau, saisirLaNoteDuPanneau |
| `src/cours/runtime/core/sync.simulation.spec.ts` | jouer, livres, texteDe |

## Entry Points

Start here when exploring this area:

- **`createSync`** (Function) — `src/cours/runtime/core/sync.ts:425`
- **`bloc`** (Function) — `src/testing/flux-sse.ts:76`
- **`creerOuverture`** (Function) — `src/testing/flux-sse.ts:28`
- **`couper`** (Function) — `src/testing/flux-sse.ts:67`
- **`deposer`** (Function) — `src/testing/flux-sse.ts:53`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createSync` | Function | `src/cours/runtime/core/sync.ts` | 425 |
| `bloc` | Function | `src/testing/flux-sse.ts` | 76 |
| `creerOuverture` | Function | `src/testing/flux-sse.ts` | 28 |
| `couper` | Function | `src/testing/flux-sse.ts` | 67 |
| `deposer` | Function | `src/testing/flux-sse.ts` | 53 |
| `envoyer` | Function | `src/testing/flux-sse.ts` | 63 |
| `vider` | Function | `src/testing/flux-sse.ts` | 11 |
| `buildAppConfig` | Function | `src/testing/factories/app-config.factory.ts` | 9 |
| `createContactPortStubWithDefault` | Function | `src/testing/factories/contact.factory.ts` | 7 |
| `preparerLeGraphique` | Function | `src/testing/graphique-monte.ts` | 6 |
| `bancAdaptateurHttp` | Function | `src/testing/http-attendu.ts` | 14 |
| `preparerLePanneau` | Function | `src/testing/panneau-pedagogique.ts` | 17 |
| `setupTestBed` | Function | `src/testing/setup-test-bed.ts` | 16 |
| `attendreLEnvoiVideRefuse` | Function | `src/testing/banc-de-brique.ts` | 91 |
| `attendreLaChargeInerte` | Function | `src/testing/banc-de-brique.ts` | 113 |
| `attendreLeRenvoiEpuise` | Function | `src/testing/banc-de-brique.ts` | 98 |
| `cliquerOmbre` | Function | `src/testing/banc-de-brique.ts` | 83 |
| `noeudOmbre` | Function | `src/testing/banc-de-brique.ts` | 75 |
| `texteOmbre` | Function | `src/testing/banc-de-brique.ts` | 139 |
| `noteAffichee` | Function | `src/testing/panneau-pedagogique.ts` | 66 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → OnResultats` | cross_community | 6 |
| `Constructor → OnState` | cross_community | 6 |
| `Ouvrir → OnResultats` | cross_community | 6 |
| `Ouvrir → OnState` | cross_community | 6 |
| `ReessayerLaReprise → OnResultats` | cross_community | 6 |
| `ReessayerLaReprise → OnState` | cross_community | 6 |
| `RelireLeDeroule → OnResultats` | cross_community | 5 |
| `RelireLeDeroule → OnState` | cross_community | 5 |
| `EcouterLeFlux → OnResultats` | cross_community | 3 |
| `EcouterLeFlux → OnState` | cross_community | 3 |

## How to Explore

1. `context({name: "createSync"})` — see callers and callees
2. `query({search_query: "testing"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
