import assert from 'node:assert/strict';
import { test } from 'node:test';

import { coursServis, instantanesObsoletes } from './instantanes.mjs';

test('REF-F1 · liste les cours servis par l’identifiant de leur instantané, dans l’ordre des fichiers', () => {
  const instantane = (id) => JSON.stringify({ graine: 0, sujet: { id, titre: id } });

  assert.deepEqual(
    coursServis([
      ['b3-01.instantane.json', instantane('b3-01-donnee-brute-decision')],
      ['b1-04.instantane.json', instantane('b1-04-series-deux-variables')],
      ['b2-01.instantane.json', instantane('b2-01-traitement-information-chiffree')],
    ]),
    [
      'b1-04-series-deux-variables',
      'b2-01-traitement-information-chiffree',
      'b3-01-donnee-brute-decision',
    ],
  );
});

test('REF-F1 · refuse un instantané sans identifiant de cours', () => {
  assert.throws(
    () => coursServis([['b1-09.instantane.json', JSON.stringify({ sujet: {} })]]),
    /b1-09\.instantane\.json/,
  );
});

test('retire les instantanés que le back ne sert plus, et eux seuls', () => {
  assert.deepEqual(
    instantanesObsoletes(
      [
        'b2-01.instantane.json',
        'b2-02.instantane.json',
        'b3-01.classeurs.manifest.json',
        'etat.ts',
      ],
      ['b2-01.instantane.json', 'b3-02.instantane.json'],
    ),
    ['b2-02.instantane.json'],
  );
});
