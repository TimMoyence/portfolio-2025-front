---
name: gitnexus-area-presentateur
description: "Skill for the Presentateur area of portfolio-2025-front. 161 symbols across 38 files."
---

# Presentateur

161 symbols | 38 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how buildRapportSeance, buildRegleNotation, buildResultatQuestion work
- Modifying presentateur-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/cours/presentateur/cours-presentateur.component.ts` | resultatsDuRapport, avancerLeStatut, charger, constructor, lireLeDeroule (+35) |
| `src/app/features/cours/presentateur/cours-presentateur.component.spec.ts` | resultatsDeLaQuestion, derouleDeSeance, ouvrirSurLEcran, cible, annoncer (+12) |
| `src/app/features/cours/presentateur/cours-synthese.component.ts` | CoursSyntheseComponent, confusionsFrequentesDe, compterLesFreins, lire, lireLeRapport (+6) |
| `src/app/features/cours/presentateur/cours-synthese.component.spec.ts` | resultatsDeDeuxQuestions, resultatsDe, derouleDesDeuxQuestions, etudiant, csvDAna (+4) |
| `src/app/features/cours/presentateur/cours-panneau-pedagogique.component.ts` | cleDAnnotation, fusionnerLesAnnotations, lire, constructor, envoyer (+3) |
| `src/testing/factories/formations.factory.ts` | buildRapportSeance, buildRegleNotation, buildResultatQuestion, buildResultatsSeance, buildDerouleCours (+2) |
| `src/app/features/cours/presentateur/cours-scene.component.spec.ts` | derouleDeSeance, apercu, miniaturesDuRenvoyant, monter, monterEtStabiliser (+2) |
| `src/app/features/cours/presentateur/cours-panneau-activite.component.spec.ts` | resultats, cliquer, bouton, revelerUneSeuleFois, texte |
| `src/app/features/cours/presentateur/cours-scene.component.ts` | ecouterLeFlux, lireLeDeroule, etat, constructor, suivreLeFlux |
| `src/testing/banc-du-pupitre.ts` | buildEcranDeMission, buildEcranDeVoteCorrige, buildEcranDeVoteJumele, monterSurLeBanc |

## Entry Points

Start here when exploring this area:

- **`buildRapportSeance`** (Function) — `src/testing/factories/formations.factory.ts:180`
- **`buildRegleNotation`** (Function) — `src/testing/factories/formations.factory.ts:73`
- **`buildResultatQuestion`** (Function) — `src/testing/factories/formations.factory.ts:32`
- **`buildResultatsSeance`** (Function) — `src/testing/factories/formations.factory.ts:51`
- **`buildEcranDeMission`** (Function) — `src/testing/banc-du-pupitre.ts:125`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CoursSyntheseComponent` | Class | `src/app/features/cours/presentateur/cours-synthese.component.ts` | 203 |
| `CoursPanneauActiviteComponent` | Class | `src/app/features/cours/presentateur/cours-panneau-activite.component.ts` | 315 |
| `PanneauLectureClasseComponent` | Class | `src/app/features/cours/presentateur/panneau-pedagogique/panneau-lecture-classe.component.ts` | 71 |
| `CoursPanneauQuestionComponent` | Class | `src/app/features/cours/presentateur/cours-panneau-question.component.ts` | 158 |
| `CoursPresentateurComponent` | Class | `src/app/features/cours/presentateur/cours-presentateur.component.ts` | 701 |
| `buildRapportSeance` | Function | `src/testing/factories/formations.factory.ts` | 180 |
| `buildRegleNotation` | Function | `src/testing/factories/formations.factory.ts` | 73 |
| `buildResultatQuestion` | Function | `src/testing/factories/formations.factory.ts` | 32 |
| `buildResultatsSeance` | Function | `src/testing/factories/formations.factory.ts` | 51 |
| `buildEcranDeMission` | Function | `src/testing/banc-du-pupitre.ts` | 125 |
| `buildEcranDeVoteCorrige` | Function | `src/testing/banc-du-pupitre.ts` | 81 |
| `buildEcranDeVoteJumele` | Function | `src/testing/banc-du-pupitre.ts` | 100 |
| `buildVoteQuestion` | Function | `src/testing/factories/cours.factory.ts` | 102 |
| `buildDerouleCours` | Function | `src/testing/factories/formations.factory.ts` | 227 |
| `buildEcranDeroule` | Function | `src/testing/factories/formations.factory.ts` | 193 |
| `chantierApresRendu` | Function | `src/app/features/cours/presentateur/chantier-apres-rendu.ts` | 2 |
| `enoncesDuDeroule` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 188 |
| `etat` | Function | `src/app/features/cours/presentateur/cours-presentateur.component.ts` | 1013 |
| `resultats` | Function | `src/app/features/cours/presentateur/cours-presentateur.component.ts` | 1014 |
| `ecransMontes` | Function | `src/testing/vue-de-seance.ts` | 34 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → OnResultats` | cross_community | 6 |
| `Constructor → OnState` | cross_community | 6 |
| `Constructor → OnStatut` | cross_community | 6 |
| `Constructor → Retenir` | cross_community | 6 |
| `Ouvrir → OnResultats` | cross_community | 6 |
| `Ouvrir → OnState` | cross_community | 6 |
| `Ouvrir → OnStatut` | cross_community | 6 |
| `Ouvrir → Retenir` | cross_community | 6 |
| `ReessayerLaReprise → OnResultats` | cross_community | 6 |
| `ReessayerLaReprise → OnState` | cross_community | 6 |

## How to Explore

1. `context({name: "buildRapportSeance"})` — see callers and callees
2. `query({search_query: "presentateur"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
