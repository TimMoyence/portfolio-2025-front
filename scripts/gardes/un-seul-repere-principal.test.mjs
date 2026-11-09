import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { RACINE, cheminDuDepot } from '../lib/depot.mjs';

const COQUILLE = 'src/app/app.component.ts';

function gabarits(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) return gabarits(chemin);
    return /\.(html|ts)$/.test(entree.name) && !entree.name.endsWith('.spec.ts') ? [chemin] : [];
  });
}

test('seule la coquille de l’application ouvre un repère main : une page n’en imbrique pas un second', () => {
  const imbriques = gabarits(cheminDuDepot('src/app'))
    .map((chemin) => relative(RACINE, chemin))
    .filter((chemin) => chemin !== COQUILLE)
    .filter((chemin) => /<main[\s>]/.test(readFileSync(join(RACINE, chemin), 'utf8')));

  assert.deepEqual(imbriques, []);
  assert.match(readFileSync(cheminDuDepot(COQUILLE), 'utf8'), /<main id="main-content"/);
});
