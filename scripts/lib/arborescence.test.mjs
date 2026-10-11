import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import { listerFichiers } from './arborescence.mjs';
import { avecDossierPlante } from './dossier-temporaire.mjs';

test('liste en ordre les fichiers retenus de toute l arborescence, en chemins relatifs', () => {
  avecDossierPlante(
    'arborescence-',
    {
      'b.ts': '',
      'a/c.html': '',
      'a/profond/d.ts': '',
      'a/ignore.md': '',
    },
    (racine) => {
      assert.deepEqual(
        listerFichiers(racine, (nom) => !nom.endsWith('.md')),
        ['a/c.html', 'a/profond/d.ts', 'b.ts'],
      );
    },
  );
});

test('rend une liste vide pour une racine absente', () => {
  avecDossierPlante('arborescence-', {}, (racine) => {
    assert.deepEqual(
      listerFichiers(join(racine, 'absente'), () => true),
      [],
    );
  });
});
