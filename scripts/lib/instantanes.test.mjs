import assert from 'node:assert/strict';
import { test } from 'node:test';

import { instantanesObsoletes } from './instantanes.mjs';

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
