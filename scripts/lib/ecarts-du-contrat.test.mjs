import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ecartsDeLaCopieDeTravail } from './ecarts-du-contrat.mjs';

test('signale un contrat régénéré autrement que la copie de travail, ou un fichier qu aucun commit ne suit', () => {
  assert.deepEqual(
    ecartsDeLaCopieDeTravail(
      [
        ' M contrat/types.gen.ts',
        'MM contrat/zod.gen.ts',
        '?? src/testing/fixtures/b9-01.instantane.json',
        ' D src/testing/fixtures/b2-02.instantane.json',
      ].join('\n'),
    ),
    [
      ' M contrat/types.gen.ts',
      'MM contrat/zod.gen.ts',
      '?? src/testing/fixtures/b9-01.instantane.json',
      ' D src/testing/fixtures/b2-02.instantane.json',
    ],
  );
});

test('accepte un contrat déjà indexé pour le commit qui change son épingle', () => {
  assert.deepEqual(
    ecartsDeLaCopieDeTravail(
      ['M  contrat/types.gen.ts', 'A  contrat/client.gen.ts', ''].join('\n'),
    ),
    [],
  );
});
