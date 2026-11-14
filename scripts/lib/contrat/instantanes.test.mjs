import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import * as instantanes from './instantanes.mjs';

const {
  coursServis,
  instantanesDuDossier,
  instantanesDuFront,
  instantanesObsoletes,
  instantanesParCours,
  rangementDuFront,
} = instantanes;

const frontEnSousDossiers = (t) => {
  const front = mkdtempSync(join(tmpdir(), 'instantanes-du-front-'));
  t.after(() => rmSync(front, { recursive: true }));
  mkdirSync(join(front, 'b1'));
  mkdirSync(join(front, 'b3'));
  for (const fichier of [
    'b1/b1-04.instantane.json',
    'b3/b3-03.classeurs.manifest.json',
    'b2-01.instantane.json',
  ]) {
    writeFileSync(join(front, fichier), '{}');
  }
  return front;
};

const DOSSIER = 'test/fixtures/formations';
const fichier = (path) => ({ path, type: 'blob' });
const arbre = (...entrees) => ({ tree: entrees, truncated: false });

test('CTR-01 · lit les instantanés de tous les sous-dossiers du back, et eux seuls', () => {
  assert.deepEqual(
    instantanesDuDossier(
      arbre(
        { path: `${DOSSIER}/b1`, type: 'tree' },
        fichier(`${DOSSIER}/b1/b1-04.instantane.json`),
        fichier(`${DOSSIER}/b3/b3-03.instantane.json`),
        fichier(`${DOSSIER}/b2-01.instantane.json`),
        fichier(`${DOSSIER}/b3/b3-03.classeurs.manifest.json`),
        fichier('test/fixtures/autres/b9-01.instantane.json'),
      ),
      DOSSIER,
    ),
    [
      { nom: 'b1-04.instantane.json', chemin: `${DOSSIER}/b1/b1-04.instantane.json` },
      { nom: 'b3-03.instantane.json', chemin: `${DOSSIER}/b3/b3-03.instantane.json` },
      { nom: 'b2-01.instantane.json', chemin: `${DOSSIER}/b2-01.instantane.json` },
    ],
  );
});

test('CTR-01 · refuse deux instantanés de même nom en nommant leurs deux chemins', () => {
  assert.throws(
    () =>
      instantanesDuDossier(
        arbre(
          fichier(`${DOSSIER}/b2/b2-09.instantane.json`),
          fichier(`${DOSSIER}/archives/b2-09.instantane.json`),
        ),
        DOSSIER,
      ),
    {
      message: `b2-09.instantane.json servi deux fois : ${DOSSIER}/b2/b2-09.instantane.json et ${DOSSIER}/archives/b2-09.instantane.json`,
    },
  );
});

test('CTR-01 · refuse un nom d’instantané qui sortirait du dossier du front', () => {
  assert.throws(
    () => instantanesDuDossier(arbre(fichier(`${DOSSIER}/b1/..instantane.json`)), DOSSIER),
    { message: `${DOSSIER}/b1/..instantane.json : nom d’instantané refusé` },
  );
});

test('CTR-01 · refuse un sous-dossier au nom non simple, que la casse confondrait avec son voisin sur le disque du front', () => {
  for (const sousDossier of ['B1', 'b.1', 'b1 ']) {
    assert.throws(
      () =>
        instantanesDuDossier(
          arbre(
            fichier(`${DOSSIER}/${sousDossier}/b1-01.instantane.json`),
            fichier(`${DOSSIER}/b1/b1-02.instantane.json`),
          ),
          DOSSIER,
        ),
      { message: `${DOSSIER}/${sousDossier}/b1-01.instantane.json : nom d’instantané refusé` },
      sousDossier,
    );
  }
});

test('CTR-01 · refuse un arbre que GitHub a tronqué, dont les instantanés absents seraient retirés du front', () => {
  assert.throws(
    () =>
      instantanesDuDossier(
        { tree: [fichier(`${DOSSIER}/b1/b1-01.instantane.json`)], truncated: true },
        DOSSIER,
      ),
    { message: `l’arbre de ${DOSSIER} est tronqué par GitHub : instantanés incomplets` },
  );
});

test('CTR-01 · range l instantané du front sous le même sous-dossier qu au back', () => {
  assert.equal(
    rangementDuFront(`${DOSSIER}/b1/b1-04.instantane.json`, DOSSIER),
    'b1/b1-04.instantane.json',
  );
});

test('CTR-01 · lit les instantanés du front dans tous ses sous-dossiers, et eux seuls', (t) => {
  assert.deepEqual(instantanesDuFront(frontEnSousDossiers(t)), [
    'b1/b1-04.instantane.json',
    'b2-01.instantane.json',
  ]);
});

test('CTR-01 · nomme chaque instantané du front par son cours, avec son chemin', (t) => {
  const front = frontEnSousDossiers(t);

  assert.deepEqual(
    [...instantanesParCours(front)],
    [
      ['b1-04', join(front, 'b1/b1-04.instantane.json')],
      ['b2-01', join(front, 'b2-01.instantane.json')],
    ],
  );
});

const instantaneDuCours = (id, duree) =>
  JSON.stringify({ graine: 0, sujet: { id, titre: id, duree } });

test('REF-F1 · PUB-01 · liste les cours servis par leur identifiant et leur durée servie, dans l’ordre des fichiers', () => {
  assert.deepEqual(
    coursServis([
      ['b3-01.instantane.json', instantaneDuCours('b3-01-donnee-brute-decision', 176)],
      ['b1-04.instantane.json', instantaneDuCours('b1-04-series-deux-variables', 121)],
      ['b2-01.instantane.json', instantaneDuCours('b2-01-traitement-information-chiffree', 202)],
    ]),
    [
      { slug: 'b1-04-series-deux-variables', duree: 121 },
      { slug: 'b2-01-traitement-information-chiffree', duree: 202 },
      { slug: 'b3-01-donnee-brute-decision', duree: 176 },
    ],
  );
});

test('REF-F1 · refuse un instantané sans identifiant de cours', () => {
  assert.throws(
    () => coursServis([['b1-09.instantane.json', JSON.stringify({ sujet: { duree: 121 } })]]),
    /b1-09\.instantane\.json/,
  );
});

test('PUB-01 · refuse un instantané sans durée servie, en minutes entières', () => {
  for (const duree of [undefined, 0, -5, 120.5, '121']) {
    assert.throws(
      () => coursServis([['b1-09.instantane.json', instantaneDuCours('b1-09-x', duree)]]),
      /b1-09\.instantane\.json : instantané sans sujet\.duree/,
      String(duree),
    );
  }
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

test('CTR-01 · retire l instantané resté à plat quand le back le range dans un bloc, et garde ses rangés', () => {
  assert.deepEqual(
    instantanesObsoletes(
      [
        'b1/b1-04.instantane.json',
        'b1-04.instantane.json',
        'b2/b2-09.instantane.json',
        'b3/b3-03.classeurs.manifest.json',
      ],
      ['b1/b1-04.instantane.json', 'b2/b2-09.instantane.json'],
    ),
    ['b1-04.instantane.json'],
  );
});
