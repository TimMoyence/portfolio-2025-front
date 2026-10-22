---
paths:
  - 'src/**/*.spec.ts'
  - 'src/testing/**'
---

# Tests du front

- Un objet ou un stub récurrent vient d'une factory de `src/testing/factories/` : `buildX(overrides?)` pour un objet (`buildAuthUser`, `buildAppConfig`), `createXPortStub()` pour un port (`createAuthPortStub`, `createFormationsPortStub`). Un nouveau port crée sa factory de stub ; jamais un stub recopié dans un spec.
- `setupTestBed(options?)` (`src/testing/setup-test-bed.ts`) pose `APP_CONFIG` via `buildAppConfig()`, `MEMOIRE_DU_RENOUVELLEMENT` et `VERROU_INTER_ONGLETS` en mémoire, puis `provideHttpClient()` et `provideHttpClientTesting()`. Options : `appConfig` (surcharges), `http: false` (le spec fournit son double), `router: true`. Le reste passe à `configureTestingModule`, dont il renvoie la valeur ; les `providers` de l'appelant surchargent le socle.
- `setupTestBed` ne fournit pas `AUTH_PORT` : le spec passe `{ provide: AUTH_PORT, useValue: createAuthPortStub() }` et garde la référence.
- `<html>` est partagé par toute l'exécution Karma : un spec qui pose `anim-ready` appelle `isolateAnimReady()` (`src/testing/anim-ready.ts`).
