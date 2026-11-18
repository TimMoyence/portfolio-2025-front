import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import { avecDossierPlante } from '../lib/dossier-temporaire.mjs';
import {
  bilanDeKarma,
  fichierDeCouverture,
  fusionnerLesCouvertures,
  lancementsDesTranches,
  nombreDeTranches,
  repartitionIncomplete,
  seuilsNonTenus,
} from './karma-en-tranches.mjs';

const couvertureDe = (chemin, compteurs) => ({
  [chemin]: {
    path: chemin,
    statementMap: Object.fromEntries(
      compteurs.map((_, rang) => [
        rang,
        { start: { line: rang + 1, column: 0 }, end: { line: rang + 1, column: 1 } },
      ]),
    ),
    fnMap: {},
    branchMap: {},
    s: Object.fromEntries(compteurs.map((compte, rang) => [rang, compte])),
    f: {},
    b: {},
  },
});

test('une tranche par cœur, huit au plus, quand rien n est demandé', () => {
  assert.equal(nombreDeTranches(undefined, 4), 4);
  assert.equal(nombreDeTranches(undefined, 18), 8);
  assert.equal(nombreDeTranches('', 1), 1);
});

test('KARMA_TRANCHES impose le nombre de tranches', () => {
  assert.equal(nombreDeTranches('3', 18), 3);
  for (const demande of ['0', '-2', '1.5', 'deux']) {
    assert.throws(() => nombreDeTranches(demande, 4), /KARMA_TRANCHES/, demande);
  }
});

test('chaque tranche lance ng test avec son rang, son dossier de couverture et les options reçues', () => {
  const ngTest = [
    'exec',
    '--',
    'ng',
    'test',
    '--watch=false',
    '--browsers=ChromeHeadlessNoSandbox',
    '--code-coverage',
  ];

  assert.deepEqual(lancementsDesTranches(2, ['--code-coverage'], '/couverture'), [
    { env: { KARMA_TRANCHE: '0/2', KARMA_COUVERTURE: '/couverture/tranches/0' }, args: ngTest },
    { env: { KARMA_TRANCHE: '1/2', KARMA_COUVERTURE: '/couverture/tranches/1' }, args: ngTest },
  ]);
});

test('la fusion lit la couverture de chaque tranche lancée et refuse celle qui manque', () => {
  avecDossierPlante(
    'karma-en-tranches-',
    { 'tranches/0/coverage-final.json': JSON.stringify(couvertureDe('/src/a.ts', [1])) },
    (racine) => {
      const lancements = lancementsDesTranches(2, ['--code-coverage'], racine);

      assert.throws(
        () => fusionnerLesCouvertures(lancements.map(fichierDeCouverture)),
        /tranches\/1\/coverage-final\.json/,
      );
    },
  );
});

test('la couverture fusionnée compte une instruction couverte par une seule tranche', () => {
  avecDossierPlante(
    'karma-en-tranches-',
    {
      'tranches/0/coverage-final.json': JSON.stringify(couvertureDe('/src/a.ts', [1, 0, 0, 0])),
      'tranches/1/coverage-final.json': JSON.stringify(couvertureDe('/src/a.ts', [0, 2, 0, 0])),
    },
    (racine) => {
      const carte = fusionnerLesCouvertures([
        join(racine, 'tranches/0/coverage-final.json'),
        join(racine, 'tranches/1/coverage-final.json'),
      ]);

      assert.deepEqual(carte.getCoverageSummary().toJSON().statements, {
        total: 4,
        covered: 2,
        skipped: 0,
        pct: 50,
      });
    },
  );
});

test('le bilan d une tranche est la dernière ligne « Executed » de Karma, ou son absence', () => {
  const sortie = [
    'Chrome Headless 157 (Mac OS 10.15.7): Executed 1 of 3 SUCCESS (0 secs / 0.1 secs)',
    '\rChrome Headless 157 (Mac OS 10.15.7): Executed 3 of 3 (1 FAILED) (2 secs / 1.9 secs)',
    'TOTAL: 1 FAILED, 2 SUCCESS',
  ].join('\n');

  assert.equal(bilanDeKarma(sortie), 'Executed 3 of 3 (1 FAILED) (2 secs / 1.9 secs)');
  assert.equal(bilanDeKarma('ERROR [karma-server]: port occupé'), 'aucun test exécuté');
});

test('les tranches réunies jouent toute la suite, chaque spec une seule fois', () => {
  const bilan = (jouees, total) =>
    `Executed ${jouees} of ${total} (skipped ${total - jouees}) SUCCESS`;

  assert.equal(repartitionIncomplete([bilan(4, 7), bilan(3, 7)]), null);
  assert.equal(
    repartitionIncomplete([bilan(4, 7), bilan(4, 7)]),
    'les tranches jouent 8 specs pour une suite de 7',
  );
  assert.equal(
    repartitionIncomplete([bilan(3, 7), bilan(3, 6)]),
    'les tranches ne voient pas la même suite : 7, 6',
  );
  assert.equal(
    repartitionIncomplete([bilan(3, 7), 'aucun test exécuté']),
    'les tranches ne voient pas la même suite : 7, aucun',
  );
});

test('un seuil non tenu se nomme avec sa mesure ; un seuil atteint passe', () => {
  const resume = {
    statements: { pct: 71.9 },
    branches: { pct: 58 },
    functions: { pct: 80 },
    lines: { pct: 73 },
  };

  assert.deepEqual(
    seuilsNonTenus(resume, { statements: 72, branches: 58, functions: 64, lines: 73 }),
    ['statements 71.9 % < 72 %'],
  );
});
