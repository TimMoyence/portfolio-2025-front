import assert from 'node:assert/strict';
import test from 'node:test';
import fc from 'fast-check';

import { AttenteEpuisee, attendreQue, sondeHttp } from './attente.mjs';

const GRAINE = 20260920;

function patienteurCompte() {
  const appels = [];
  return {
    appels,
    patienter: (ms) => {
      appels.push(ms);
      return Promise.resolve();
    },
  };
}

test('attendreQue rend le rang de la premiere sonde positive', async () => {
  const { appels, patienter } = patienteurCompte();
  let restants = 2;

  const rang = await attendreQue({
    quoi: 'API',
    sonder: () => Promise.resolve(restants-- <= 0),
    essais: 5,
    patienter,
  });

  assert.equal(rang, 3);
  assert.equal(appels.length, 2);
});

test('attendreQue reessaie apres une sonde qui jette et nomme la derniere erreur', async () => {
  const { patienter } = patienteurCompte();

  await assert.rejects(
    attendreQue({
      quoi: "L'API du banc",
      sonder: () => Promise.reject(new Error('ECONNREFUSED 3010')),
      essais: 3,
      patienter,
    }),
    (erreur) => {
      assert.ok(erreur instanceof AttenteEpuisee);
      assert.match(erreur.message, /L'API du banc/);
      assert.match(erreur.message, /ECONNREFUSED 3010/);
      assert.match(erreur.message, /3 tentatives/);
      return true;
    },
  );
});

test('sondeHttp ne juge positive qu une reponse ok', async () => {
  const vue = [];
  const sonde = sondeHttp({
    appeler: (url) => {
      vue.push(url);
      return Promise.resolve({ ok: vue.length > 1, status: vue.length > 1 ? 200 : 503 });
    },
    url: 'http://127.0.0.1:3010/health',
  });

  assert.equal(await sonde(), false);
  assert.equal(await sonde(), true);
  assert.deepEqual(vue, ['http://127.0.0.1:3010/health', 'http://127.0.0.1:3010/health']);
});

test('pour tout nombre d echecs inferieur au budget, attendreQue finit par reussir', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 8 }),
      fc.integer({ min: 9, max: 20 }),
      async (echecs, essais) => {
        const { appels, patienter } = patienteurCompte();
        let vus = 0;

        const rang = await attendreQue({
          quoi: 'sonde',
          sonder: () => Promise.resolve(vus++ >= echecs),
          essais,
          patienter,
          intervalleMs: 10,
        });

        assert.equal(rang, echecs + 1);
        assert.equal(appels.length, echecs);
      },
    ),
    { seed: GRAINE, numRuns: 64 },
  );
});
