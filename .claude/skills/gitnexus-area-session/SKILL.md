---
name: gitnexus-area-session
description: "Skill for the Session area of portfolio-2025-front. 152 symbols across 26 files."
---

# Session

152 symbols | 26 files | Cohesion: 80%

## When to Use

- Working with code in `src/`
- Understanding how directDeLEcran, directDeLEcranCourant, grouperLesReponses work
- Modifying session-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/shared/slides/session/reinjection.ts` | annexeDeLaRevelation, annexeVisible, deGenre, ecranRevele, posesCommunes (+19) |
| `src/app/shared/slides/session/cours-presentation.component.spec.ts` | echelleAffichee, echelleDuContenu, ecranDuPupitre, tailleDuTitre, curseurDe (+14) |
| `src/app/shared/slides/session/evenements-brique.ts` | defi, estValeurDeReponse, identifiant, production, reponse (+12) |
| `src/app/shared/slides/session/lecture-ecran.ts` | activitesDuRappel, activitesDuTravaille, ecransDesIdentifiants, enoncesDesActivites, entreesPortees (+11) |
| `src/app/shared/slides/session/slide-activity.component.ts` | creer, mettreAJour, poser, poserLesDonnees, reprendreLeBrouillon (+10) |
| `src/app/shared/slides/session/slide-activity.component.spec.ts` | evenements, numeriqueEcoutee, monter, questionnaireDuPosteEtudiant, dans (+2) |
| `src/app/shared/slides/session/reponses-libres.service.ts` | cleDeStockage, envoyer, cleLogiqueDe, noter, reprendre (+1) |
| `src/app/shared/slides/visual/presentation-v2.ts` | aUnePresentation, objet, presentationDe, quizImbrique, quizPrincipal |
| `src/cours/runtime/core/identity.ts` | creerCle, enregistrer, memoriserSecretDeReprise, readIdentity, saveIdentity |
| `src/app/shared/slides/session/extrait-du-renvoi.ts` | champsDuCas, estObjet, extraireDuRenvoi, lignesDuTableau, sans |

## Entry Points

Start here when exploring this area:

- **`directDeLEcran`** (Function) — `src/app/features/cours/direct-de-l-ecran.ts:8`
- **`directDeLEcranCourant`** (Function) — `src/app/features/cours/direct-de-l-ecran.ts:23`
- **`grouperLesReponses`** (Function) — `src/app/features/cours/presentateur/panneau-pedagogique/panneau-reponses-libres.component.ts:9`
- **`sourceCorrigeePar`** (Function) — `src/app/features/cours/presentateur/sources-de-correction.ts:5`
- **`ecransDesIdentifiants`** (Function) — `src/app/shared/slides/session/lecture-ecran.ts:249`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CoursEtudiantComponent` | Class | `src/app/features/cours/etudiant/cours-etudiant.component.ts` | 598 |
| `CoursPanneauPedagogiqueComponent` | Class | `src/app/features/cours/presentateur/cours-panneau-pedagogique.component.ts` | 143 |
| `CoursResultatsProjetesComponent` | Class | `src/app/features/cours/presentateur/cours-resultats-projetes.component.ts` | 299 |
| `CoursSceneComponent` | Class | `src/app/features/cours/presentateur/cours-scene.component.ts` | 335 |
| `PanneauReponsesLibresComponent` | Class | `src/app/features/cours/presentateur/panneau-pedagogique/panneau-reponses-libres.component.ts` | 75 |
| `CoursPresentationComponent` | Class | `src/app/shared/slides/session/cours-presentation.component.ts` | 276 |
| `directDeLEcran` | Function | `src/app/features/cours/direct-de-l-ecran.ts` | 8 |
| `directDeLEcranCourant` | Function | `src/app/features/cours/direct-de-l-ecran.ts` | 23 |
| `grouperLesReponses` | Function | `src/app/features/cours/presentateur/panneau-pedagogique/panneau-reponses-libres.component.ts` | 9 |
| `sourceCorrigeePar` | Function | `src/app/features/cours/presentateur/sources-de-correction.ts` | 5 |
| `ecransDesIdentifiants` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 249 |
| `enoncesDesActivites` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 227 |
| `identifiantsDesQuestions` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 184 |
| `planDeMontage` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 107 |
| `questionsDeLEcran` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 159 |
| `titreDeLEcran` | Function | `src/app/shared/slides/session/lecture-ecran.ts` | 170 |
| `aUnePresentation` | Function | `src/app/shared/slides/visual/presentation-v2.ts` | 17 |
| `objet` | Function | `src/app/shared/slides/visual/presentation-v2.ts` | 11 |
| `presentationDe` | Function | `src/app/shared/slides/visual/presentation-v2.ts` | 23 |
| `quizImbrique` | Function | `src/app/shared/slides/visual/presentation-v2.ts` | 42 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → EstObjet` | cross_community | 9 |
| `Rattacher → StockageLocal` | cross_community | 7 |
| `Constructor → Objet` | cross_community | 7 |
| `Constructor → Brouillons` | cross_community | 6 |
| `PosesDeReinjection → ViseUnIdentifiant` | cross_community | 5 |
| `Constructor → Host` | intra_community | 5 |
| `Mount → Objet` | cross_community | 5 |
| `PosesDeReinjection → QuestionAffichee` | cross_community | 4 |
| `PosesDeReinjection → ResultatsDe` | cross_community | 4 |
| `PosesDeReinjection → AnnexeDeLaRevelation` | intra_community | 4 |

## How to Explore

1. `context({name: "directDeLEcran"})` — see callers and callees
2. `query({search_query: "session"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
