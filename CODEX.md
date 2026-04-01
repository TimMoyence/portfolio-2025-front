# CODEX.md — Common Budget T&M

## Tu es l'agent de Maria

Maria travaille sur le budget partage Tim & Maria. Tu es son assistant de developpement.
Quand elle te donne un prompt, suis ce flow automatiquement.

## Flow automatique au premier lancement

**Etape 1 — Setup complet (execute sans demander)**

```bash
node portfolio-2025-front/scripts/setup-budget-dev.mjs
```

Ce script fait tout automatiquement :

- Sauvegarde et push le travail local de Maria (commit auto avant rebase)
- Rebase sa branche `Commonbudget` sur `origin/master`
- Clone le backend si absent, cree la branche Commonbudget backend
- Installe PostgreSQL 16, Redis, Node 22, pnpm
- Cree la base de donnees, genere le .env, lance les migrations
- Installe toutes les dependances (front + back)
- Lance les deux serveurs (back :3000, front :4200)
- Analyse les changements de la branche

**Etape 2 — Verification (execute sans demander)**

```bash
# Verifier que l'API repond
curl -sf http://localhost:3000/api/v1/portfolio25/docs > /dev/null && echo "API OK" || echo "API en attente..."

# Verifier que le frontend repond
curl -sf http://localhost:4200 > /dev/null && echo "Frontend OK" || echo "Frontend en attente..."
```

Si les serveurs ne repondent pas encore, attendre 15 secondes et reessayer.

**Etape 3 — Creer le compte Maria (execute sans demander)**

```bash
curl -X POST http://localhost:3000/api/v1/portfolio25/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@commonbudget.tm","password":"MariaB@dget2026!","firstName":"Maria","lastName":"Naumenko","roles":["budget"]}'
```

**Etape 4 — Rapport a Maria**

Afficher :

- Statut du setup (OK / erreurs)
- URL du frontend : http://localhost:4200/atelier/budget
- URL du Swagger : http://localhost:3000/docs
- Identifiants : maria@commonbudget.tm / MariaB@dget2026!
- Puis la liste des taches ci-dessous

## Taches restantes pour Maria

L'integration backend est deja faite sur master. Apres le rebase, le composant `CommonBudgetTmComponent` utilise deja `BUDGET_PORT` pour charger les categories et entries depuis l'API.

### Ce qui reste a faire :

1. **Resolution des conflits de rebase** — Le rebase de la branche Commonbudget sur master peut generer des conflits dans `common-budget-tm.component.ts` car le fichier a ete refactorise pour utiliser l'API. Resoudre en gardant la version master pour toute la logique API, et en integrant les ajouts UI de Maria.

2. **Tests** — Ecrire les tests pour les nouveaux composants/services ajoutes par Maria. Utiliser les factories de `src/testing/factories/budget.factory.ts` (buildBudgetEntry, buildBudgetCategory, createBudgetPortStub).

3. **Ameliorations UI** — Dashboard ameliore, graphes, filtres avances, categories personnalisables (a decider avec Maria).

## Architecture deja en place

### Backend (portfolio-2025-back) — Module Budget DDD complet

```
src/modules/budget/
  domain/      → BudgetGroup, BudgetCategory, BudgetEntry + ports
  application/ → 8 use cases (CRUD, import CSV, partage, resume)
  infrastructure/ → TypeORM entities + repositories
  interfaces/  → BudgetController (8 endpoints, @Roles('budget'))
```

**Endpoints disponibles** (tous protege par JWT + role `budget`) :

| Methode | Route                                 | Description                         |
| ------- | ------------------------------------- | ----------------------------------- |
| POST    | /budget/groups                        | Creer un groupe de budget           |
| POST    | /budget/entries                       | Creer une entree                    |
| GET     | /budget/entries?groupId=&month=&year= | Lister les entrees filtrees         |
| GET     | /budget/summary?groupId=&month=&year= | Resume mensuel par categorie        |
| POST    | /budget/entries/import                | Import CSV                          |
| POST    | /budget/categories                    | Creer une categorie custom          |
| GET     | /budget/categories?groupId=           | Lister categories (defaut + custom) |
| POST    | /budget/share                         | Partager avec un autre utilisateur  |

### Frontend (portfolio-2025-front) — Connecteurs prets

| Fichier                                | Role                                                              |
| -------------------------------------- | ----------------------------------------------------------------- |
| `core/models/budget.model.ts`          | Types TypeScript pour toutes les entites                          |
| `core/ports/budget.port.ts`            | Interface BudgetPort (8 methodes) + token BUDGET_PORT             |
| `core/adapters/budget-http.adapter.ts` | Implementation HTTP, enregistree dans app.config                  |
| `testing/factories/budget.factory.ts`  | buildBudgetEntry(), buildBudgetCategory(), createBudgetPortStub() |

### Tables en base (4 tables, 19 categories seedees)

- `budget_groups` — id, name, owner_id
- `budget_group_members` — group_id, user_id (1-to-N)
- `budget_categories` — group_id (null = defaut), name, color, icon, budget_type, budget_limit
- `budget_entries` — group_id, created_by_user_id, category_id, date, description, amount, type, state

## Commandes utiles

```bash
# Frontend
cd portfolio-2025-front
npm start                    # http://localhost:4200
npm run test -- --watch=false --browsers=ChromeHeadless
npm run lint && npm run typecheck && npm run build

# Backend
cd portfolio-2025-back
pnpm run start:dev           # http://localhost:3000
pnpm test
pnpm run lint && pnpm run typecheck && pnpm run build
```

## Conventions obligatoires

- Tout en francais (code, commits, docs)
- Conventional Commits : `feat(budget):`, `fix(budget):`, `test(budget):`
- TDD : test qui echoue → implementation → test qui passe
- Factories partagees dans `src/testing/factories/` — JAMAIS de mocks dupliques dans les specs
- SSR-safe : `isPlatformBrowser()` avant window/document/localStorage
- OnPush sur tous les composants Angular
- JSDoc sur les services, ports, adapters
