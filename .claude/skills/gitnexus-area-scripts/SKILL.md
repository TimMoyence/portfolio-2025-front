---
name: gitnexus-area-scripts
description: "Skill for the Scripts area of portfolio-2025-front. 121 symbols across 20 files."
---

# Scripts

121 symbols | 20 files | Cohesion: 90%

## When to Use

- Working with code in `scripts/`
- Understanding how analyserCorrige, analyserFrontiere, analyserImportsDuPupitre work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/setup-workspace.mjs` | applyBrewEnv, cloneBackend, commandExists, ensureBrewFormula, ensureFormulaBin (+19) |
| `scripts/guard-cours-runtime.mjs` | analyserCorrige, analyserFrontiere, analyserImportsDuPupitre, analyserRevelationEnDur, cibleRelative (+16) |
| `scripts/guard-no-comments.mjs` | isolatedGitEnv, analyzeFile, collectFiles, ratchetCeiling, rootDependencies (+9) |
| `scripts/guard-i18n-sync.test.mjs` | ciblesBrutes, exceptionsJustifiees, idsIdentiques, texteTraduction, decoderEntites (+5) |
| `scripts/update-seo-lastmod.mjs` | checkExitCode, collectLastmodDiffs, findMissingSources, lastCommitDate, main (+2) |
| `scripts/ci-portes.test.mjs` | analyserScripts, etapesDuJob, lireContexte, portesDuChantier, estNommeeDans (+1) |
| `scripts/guard-no-comments.test.mjs` | gitIn, withRepo, ts, L, narrative |
| `scripts/validate-formation.mjs` | checkRequirement, collectFormations, countWords, main, validateOffer |
| `scripts/lib/dossier-temporaire.mjs` | ecrireFichiers, planterDossier, avecDossierPlante, supprimerDossier |
| `scripts/lib/comment-scope.mjs` | extensionOf, hasJsdocTypes, isInScope, languageOf |

## Entry Points

Start here when exploring this area:

- **`analyserCorrige`** (Function) — `scripts/guard-cours-runtime.mjs:255`
- **`analyserFrontiere`** (Function) — `scripts/guard-cours-runtime.mjs:205`
- **`analyserImportsDuPupitre`** (Function) — `scripts/guard-cours-runtime.mjs:185`
- **`analyserRevelationEnDur`** (Function) — `scripts/guard-cours-runtime.mjs:300`
- **`collecterFichiers`** (Function) — `scripts/guard-cours-runtime.mjs:63`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `analyserCorrige` | Function | `scripts/guard-cours-runtime.mjs` | 255 |
| `analyserFrontiere` | Function | `scripts/guard-cours-runtime.mjs` | 205 |
| `analyserImportsDuPupitre` | Function | `scripts/guard-cours-runtime.mjs` | 185 |
| `analyserRevelationEnDur` | Function | `scripts/guard-cours-runtime.mjs` | 300 |
| `collecterFichiers` | Function | `scripts/guard-cours-runtime.mjs` | 63 |
| `estFichierDeTest` | Function | `scripts/guard-cours-runtime.mjs` | 80 |
| `estPupitreFormateur` | Function | `scripts/guard-cours-runtime.mjs` | 102 |
| `estSurfaceCours` | Function | `scripts/guard-cours-runtime.mjs` | 88 |
| `formatViolations` | Function | `scripts/guard-cours-runtime.mjs` | 353 |
| `main` | Function | `scripts/guard-cours-runtime.mjs` | 371 |
| `runGuard` | Function | `scripts/guard-cours-runtime.mjs` | 326 |
| `specifications` | Function | `scripts/guard-cours-runtime.mjs` | 110 |
| `lireTexte` | Function | `scripts/lib/depot.mjs` | 16 |
| `cheminDuDepot` | Function | `scripts/lib/depot.mjs` | 10 |
| `ecrireFichiers` | Function | `scripts/lib/dossier-temporaire.mjs` | 15 |
| `planterDossier` | Function | `scripts/lib/dossier-temporaire.mjs` | 28 |
| `chargerMoteur` | Function | `scripts/lib/moteur-formules.mjs` | 17 |
| `isolatedGitEnv` | Function | `scripts/guard-no-comments.mjs` | 92 |
| `avecDossierPlante` | Function | `scripts/lib/dossier-temporaire.mjs` | 41 |
| `supprimerDossier` | Function | `scripts/lib/dossier-temporaire.mjs` | 8 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → IsEmptyBraces` | cross_community | 8 |
| `Main → IsLineComment` | cross_community | 8 |
| `Main → DelimitedBlocks` | cross_community | 6 |
| `Main → CreateSf` | cross_community | 6 |
| `Main → SlashSlashBlocks` | cross_community | 6 |
| `Main → ExtensionOf` | cross_community | 6 |
| `Main → IsolatedGitEnv` | cross_community | 5 |
| `Main → DeclaredDependencies` | cross_community | 4 |
| `Main → Run` | intra_community | 4 |
| `Main → PrependToPath` | intra_community | 4 |

## How to Explore

1. `context({name: "analyserCorrige"})` — see callers and callees
2. `query({search_query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
