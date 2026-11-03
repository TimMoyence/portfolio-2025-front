import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { test } from 'node:test';

import { RACINE } from '../lib/depot.mjs';
import { git } from '../lib/git.cjs';

const PLAFOND = 12;

const DOSSIERS_DONT_UN_OUTIL_FIXE_LA_FORME = {
  '.': 'racine : chaque outil y cherche sa config, racine-du-depot.test.mjs en juge la liste',
};

const parOrdreAlphabetique = (a, b) => a.localeCompare(b);

const fichiersDuDepot = () =>
  git(RACINE, ['ls-files', '--cached', '--others', '--exclude-standard'])
    .split('\n')
    .filter((chemin) => chemin && existsSync(join(RACINE, chemin)));

function entreesParDossier(fichiers) {
  const entrees = new Map();
  const ajouter = (dossier, entree) =>
    entrees.set(dossier, (entrees.get(dossier) ?? new Set()).add(entree));
  for (const fichier of fichiers) {
    let enfant = fichier;
    for (let parent = dirname(fichier); ; parent = dirname(parent)) {
      ajouter(parent, enfant === fichier ? basename(enfant) : `${basename(enfant)}/`);
      if (parent === '.') break;
      enfant = parent;
    }
  }
  return entrees;
}

const entrees = entreesParDossier(fichiersDuDepot());

test(`aucun dossier ne dépasse ${PLAFOND} entrées, fichiers et sous-dossiers compris`, () => {
  const trop = [...entrees]
    .filter(
      ([dossier, contenu]) =>
        contenu.size > PLAFOND && !Object.hasOwn(DOSSIERS_DONT_UN_OUTIL_FIXE_LA_FORME, dossier),
    )
    .map(
      ([dossier, contenu]) =>
        `${dossier} : ${contenu.size} entrées, plafond ${PLAFOND} — découpe-le par sujet avec la skill atelier:ranger`,
    )
    .sort(parOrdreAlphabetique);

  assert.deepEqual(trop, []);
});

test('un spec vit à côté de son code, jamais dans un dossier __tests__', () => {
  const dossiers = [...entrees.keys()]
    .filter((dossier) => dossier.split('/').includes('__tests__'))
    .sort(parOrdreAlphabetique);

  assert.deepEqual(dossiers, []);
});

test('compte chaque fichier une fois, sous son nom, dans son dossier', () => {
  assert.deepEqual(
    [...(entrees.get('scripts/gardes') ?? [])].filter((entree) =>
      entree.startsWith('arborescence'),
    ),
    ['arborescence.test.mjs'],
  );
});
