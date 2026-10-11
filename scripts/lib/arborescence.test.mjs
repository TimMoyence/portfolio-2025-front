import assert from 'node:assert/strict';
import { symlinkSync } from 'node:fs';
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

test('suit les liens symboliques vers un dossier ou un fichier', () => {
  avecDossierPlante('arborescence-', { 'a/vrai.ts': '' }, (racine) => {
    symlinkSync(join(racine, 'a'), join(racine, 'lien'));
    symlinkSync(join(racine, 'a/vrai.ts'), join(racine, 'raccourci.ts'));

    assert.deepEqual(
      listerFichiers(racine, () => true),
      ['a/vrai.ts', 'lien/vrai.ts', 'raccourci.ts'],
    );
  });
});

test('ignore un lien pendant au lieu de lever', () => {
  avecDossierPlante('arborescence-', { 'vrai.ts': '' }, (racine) => {
    symlinkSync(join(racine, 'disparu.ts'), join(racine, '.#vrai.ts'));

    assert.deepEqual(
      listerFichiers(racine, () => true),
      ['vrai.ts'],
    );
  });
});

test('ne redescend pas dans un dossier ancêtre atteint par un lien', () => {
  avecDossierPlante('arborescence-', { 'a/vrai.ts': '' }, (racine) => {
    symlinkSync(racine, join(racine, 'a/boucle'));

    assert.deepEqual(
      listerFichiers(racine, () => true),
      ['a/vrai.ts'],
    );
  });
});

test('rend une liste vide pour une racine absente', () => {
  avecDossierPlante('arborescence-', {}, (racine) => {
    assert.deepEqual(
      listerFichiers(join(racine, 'absente'), () => true),
      [],
    );
  });
});
