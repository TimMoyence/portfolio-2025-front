# CODEX.md — Budget Common T&M

## Projet

Application de budget partage entre Tim et Maria. Le frontend Angular 19 existe deja sur la branche `Commonbudget`.
Le backend NestJS 11 est sur `master` avec un module budget complet (DDD).

## Setup

```bash
node portfolio-2025-front/scripts/setup-budget-dev.mjs
```

Ce script :

- Rebase ta branche Commonbudget sur master
- Clone et configure le backend (PostgreSQL, Redis, .env, migrations)
- Lance les deux serveurs
- Affiche les taches d'integration

## Architecture

### Backend (portfolio-2025-back)

- DDD : `domain/ -> application/ -> infrastructure/ -> interfaces/`
- Endpoints budget : POST /budget/groups, POST|GET /budget/entries, GET /budget/summary, POST /budget/entries/import, POST|GET /budget/categories, POST /budget/share
- Auth : JWT Bearer token, role `budget` requis
- Swagger : http://localhost:3000/docs

### Frontend (portfolio-2025-front)

- Ports/Adapters : `BudgetPort` dans `core/ports/budget.port.ts`
- Adapter HTTP : `core/adapters/budget-http.adapter.ts` (deja configure)
- Models : `core/models/budget.model.ts`
- Injection : `BUDGET_PORT` enregistre dans `app.config.ts`
- Factories test : `src/testing/factories/budget.factory.ts`

## Commandes

```bash
# Frontend
cd portfolio-2025-front
npm start                    # http://localhost:4200
npm run test:ci              # Tests headless
npm run lint && npm run typecheck && npm run build

# Backend
cd portfolio-2025-back
pnpm run start:dev           # http://localhost:3000
pnpm test                    # Jest
pnpm run lint && pnpm run typecheck && pnpm run build
```

## Conventions

- Tout en francais (code, commits, docs)
- Conventional Commits : feat(budget):, fix(budget):, test(budget):
- TDD obligatoire : test qui echoue -> implementation -> test qui passe
- Factories dans `src/testing/factories/` (front) et `test/factories/` (back)
- SSR-safe : `isPlatformBrowser()` avant window/document/localStorage
- OnPush sur tous les composants
