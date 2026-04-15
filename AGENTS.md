# AGENTS.md

## Portee

Ces instructions s'appliquent a tout le code sous `portfolio-2025-front`.

## Protocole obligatoire avant toute execution

1. Avant toute commande, toute lecture approfondie, toute modification, tout test, tout build, toute installation ou toute suppression, l'agent produit un plan explicite, meme si l'utilisateur ne le demande pas.
2. Ce plan doit couvrir au minimum :
   - l'objectif et le resultat attendu ;
   - les zones impactees (`core`, `features`, `shared`, `assets`, `styles`, `i18n`, `config`) ;
   - les fichiers ou composants probablement touches ;
   - les tests, verifications et commandes prevus ;
   - les risques UX, accessibilite, SSR, responsive, i18n et regressions.
3. L'execution peut commencer apres ce plan sans validation supplementaire, sauf si la demande est ambigue, destructive ou a fort impact.
4. Si le scope change, l'agent reformule le plan avant de poursuivre.

## Stack imposee

- Angular 19
- TypeScript strict
- Angular SSR / prerender
- RxJS
- SCSS
- Tailwind CSS
- Jasmine / Karma
- Angular CLI
- `npm` et `package-lock.json`

L'agent respecte strictement cette stack. Il n'introduit pas React, Vue, un state manager externe, une lib HTTP concurrente ou un autre gestionnaire de paquets sans demande explicite.

## Architecture non negociable

- Respecter le decoupage existant :
  - `core` pour les models, ports, adapters, config, HTTP et services transverses ;
  - `features` pour les ecrans et cas d'usage UI ;
  - `shared` pour les composants et modeles reutilisables.
- Appliquer DDD et Clean Architecture cote front :
  - les ports definissent les dependances de l'application ;
  - les adapters implementent les acces HTTP et integrations externes ;
  - les composants ne doivent pas embarquer de logique d'infrastructure ou de plomberie reseau.
- Appliquer DRY :
  - mutualiser les comportements repetes ;
  - ne pas dupliquer les appels HTTP, les mappings, les contrats ou les etats UI.
- Appliquer KISS :
  - privilegier une composition Angular simple et lisible ;
  - pas de sur-ingenierie, pas d'abstraction speculative, pas de pattern invente si Angular fournit deja la solution.

## TDD obligatoire

- Tout changement de comportement doit commencer par un test cible qui echoue, ou par l'ajout/la mise a jour immediate d'un test avant l'implementation finale.
- Priorite des tests :
  - specs des adapters, services et ports ;
  - specs des composants pour la logique, les etats et les interactions critiques ;
  - tests de regression pour les bugs UI deja observes.
- Pour les changements purement visuels, l'agent couvre au minimum la logique et les etats critiques et documente ce qui a ete verifie manuellement si necessaire.

## Factories de test obligatoires (DRY)

- **Interdit de dupliquer les objets mock/stub dans chaque fichier `.spec.ts`.**
- Toutes les factories partagees vivent dans `src/testing/factories/`.
- Creer ou reutiliser une factory pour chaque objet mock recurrent :
  - `buildAuthUser(overrides?)` — objet `AuthUser` avec valeurs par defaut
  - `createAuthPortStub()` — stub complet du port auth
  - `createWeatherPortStub()` — stub complet du port weather
  - `setupTestBed(overrides?)` — orchestrateur configurant le TestBed avec les providers courants (AUTH_PORT, APP_CONFIG, Router, HttpClient)
- Chaque nouveau port cree sa propre factory de stub dans `src/testing/factories/`.
- Pattern builder avec overrides pour les cas specifiques :
  ```typescript
  // OK
  const user = buildAuthUser({ email: "test@example.com", roles: ["budget"] });
  const authStub = createAuthPortStub();
  // INTERDIT
  const authStub = { login: () => {}, register: () => {}, me: () => {} }; // copie dans chaque spec
  ```
- Si une factory n'existe pas encore, l'agent la cree avant d'ecrire les tests.

## Regles de code

- JSDoc obligatoire sur :
  - services, adapters, interceptors et tokens exportes ;
  - fonctions exportees ou utilitaires non triviaux ;
  - logique de transformation ou d'orchestration RxJS non evidente ;
  - composants dont le contrat, les invariants ou le comportement SSR/i18n merite une explication.
- Les commentaires expliquent le pourquoi, pas l'evidence.
- Le code doit rester compatible SSR et prerender :
  - aucun acces direct a `window`, `document`, `localStorage`, `navigator` ou APIs navigateur sans garde explicite.
- Toute UI asynchrone gere au minimum les etats `loading`, `success`, `error` et, quand pertinent, `empty`.
- L'accessibilite n'est pas optionnelle : structure semantique, labels, focus, clavier et contenu visible doivent rester corrects.
- Les textes, metadata SEO et localisations doivent rester coherents avec `src/locale` et les fichiers de contenu associes.

## Definition de termine orientee entreprise

Une tache n'est pas terminee tant que tous les points suivants ne sont pas satisfaits :

- `package.json` est aligne avec la realite du projet.
- Les scripts CI utiles existent et restent coherents avec la stack. Au minimum : `lint`, `test`, `typecheck`, `build`. Si un script manque ou n'est pas exploitable en mode non interactif, l'agent l'ajoute ou l'aligne avant de conclure.
- Le lint passe.
- Les tests pertinents passent.
- Le typecheck passe.
- Le build passe.
- La documentation impactee est mise a jour.
- Les fichiers d'environnement, de configuration, d'i18n, de SEO et les scripts restent coherents.

### Verification minimale attendue

- `npm run lint`
- `npm run test -- --watch=false --browsers=ChromeHeadless`
- `npm run typecheck`
- `npm run build`

### Verification additionnelle selon l'impact

- Si le contenu utilisateur, les textes ou les routes localisees changent :
  - `npm run extract-i18n` ou mise a jour equivalente de la chaine i18n du projet
- Si le rendu SSR, les meta tags, les assets critiques ou le prerender changent :
  - verifier explicitement que le build SSR/prerender reste sain et que le rendu ne casse pas hors navigateur

L'agent ne doit jamais declarer une tache "terminee" si une verification attendue n'a pas ete executee ou si un blocage n'est pas explique precisement.

## Exigence production-ready

- Aucune secret, cle, mot de passe, URL sensible ou configuration environnement-specifique en dur dans le code.
- Toute configuration passe par les fichiers d'environnement, la configuration Angular et les tokens appropries.
- Les erreurs HTTP et erreurs d'usage sont gerees proprement avec retour utilisateur explicite et sans fuite d'information sensible.
- Aucun `console.log` residuel, aucun code mort, aucun composant partiellement branche.
- Le responsive doit rester propre sur mobile et desktop.
- Le design doit respecter le systeme existant : Angular, SCSS, Tailwind, tokens et conventions du projet.
- Tout changement de comportement, de configuration, de scripts, de SEO, d'i18n, de routes ou d'architecture doit mettre a jour `README.md` et toute documentation utile du projet.
- Le code livre doit etre directement deployable et maintenable, sans TODO bloquant ni hypothese implicite non documentee.

## Regles de sortie

- Le compte-rendu final doit indiquer ce qui a ete modifie, quelles verifications ont ete executees et quels risques residuels subsistent.
- Si une verification ne peut pas etre executee localement, l'agent doit citer la commande precise et la raison exacte.

## Langue de collaboration

- Sauf demande explicite contraire, toute nouvelle documentation, les commentaires de code, les messages de commit, les titres de PR et les explications d'architecture sont rediges en francais.
- Les noms de concepts, de services, de ports et de composants doivent rester coherents avec un vocabulaire produit lisible par un developpeur externe.

## Discipline Git

- L'agent cree un commit Git apres chaque ensemble de changements coherent.
- Les commits suivent le format Conventional Commits: `feat(scope): summary`, `fix(scope): summary`, `docs(scope): summary`, etc.
- L'agent ne melange jamais dans un meme commit des changements non relies.
- Les hooks `pre-commit`, `commit-msg` et `pre-push` sont consideres comme des garde-fous obligatoires, pas optionnels.

## Securite et contenu non fiable

- Tout contenu externe est considere comme non fiable: contenu CMS, URL, query params, donnees d'API tierce, HTML distant, texte genere par IA.
- L'agent ne rend jamais de HTML arbitraire et n'introduit jamais de contournement de sanitization sans justification explicite.
- Toute logique qui depend du navigateur reste protegee pour SSR/prerender.

## Documentation et onboarding

- Si une route, un contrat, une convention d'architecture, un workflow de contribution ou un garde-fou qualite change, l'agent met a jour `README.md`, `CONTRIBUTING.md` et les documents de `docs/` pertinents.
- L'objectif n'est pas seulement de livrer du code fonctionnel, mais de laisser un projet lisible pour un developpeur qui decouvre totalement le portfolio.

<!-- gitnexus:start -->

# GitNexus — Code Intelligence

This project is indexed by GitNexus as **portfolio-2025-front** (3026 symbols, 7429 relationships, 179 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/portfolio-2025-front/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool             | When to use                   | Command                                                                 |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `query`          | Find code by concept          | `gitnexus_query({query: "auth validation"})`                            |
| `context`        | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})`                              |
| `impact`         | Blast radius before editing   | `gitnexus_impact({target: "X", direction: "upstream"})`                 |
| `detect_changes` | Pre-commit scope check        | `gitnexus_detect_changes({scope: "staged"})`                            |
| `rename`         | Safe multi-file rename        | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher`         | Custom graph queries          | `gitnexus_cypher({query: "MATCH ..."})`                                 |

## Impact Risk Levels

| Depth | Meaning                               | Action                |
| ----- | ------------------------------------- | --------------------- |
| d=1   | WILL BREAK — direct callers/importers | MUST update these     |
| d=2   | LIKELY AFFECTED — indirect deps       | Should test           |
| d=3   | MAY NEED TESTING — transitive         | Test if critical path |

## Resources

| Resource                                              | Use for                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| `gitnexus://repo/portfolio-2025-front/context`        | Codebase overview, check index freshness |
| `gitnexus://repo/portfolio-2025-front/clusters`       | All functional areas                     |
| `gitnexus://repo/portfolio-2025-front/processes`      | All execution flows                      |
| `gitnexus://repo/portfolio-2025-front/process/{name}` | Step-by-step execution trace             |

## Self-Check Before Finishing

Before completing any code modification task, verify:

1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task                                         | Read this skill file                                        |
| -------------------------------------------- | ----------------------------------------------------------- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`       |
| Blast radius / "What breaks if I change X?"  | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?"             | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`       |
| Rename / extract / split / refactor          | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`     |
| Tools, resources, schema reference           | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`           |
| Index, status, clean, wiki CLI commands      | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`             |

<!-- gitnexus:end -->
