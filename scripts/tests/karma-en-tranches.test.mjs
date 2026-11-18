import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { cheminDuDepot } from '../lib/depot.mjs';
import { estVivant } from '../lib/processus.mjs';
import {
  avecDossierPlante,
  ecrireFichiers,
  planterDossier,
  planterExecutable,
  supprimerDossier,
} from '../lib/dossier-temporaire.mjs';
import {
  bilanDeKarma,
  fichierDeCouverture,
  fusionnerLesCouvertures,
  graineDeLaPasse,
  lancementsDesTranches,
  nombreDeTranches,
  repartitionIncomplete,
  ressourcesAbsentes,
  seuilsNonTenus,
  specsDuFront,
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

test('chaque tranche lance ng test avec son rang, son dossier de couverture, les specs dans l ordre reçu et les options reçues, hors du cache disque que les tranches se disputeraient', () => {
  const ngTest = [
    'exec',
    '--',
    'ng',
    'test',
    '--watch=false',
    '--browsers=ChromeHeadlessNoSandbox',
    '--include=src/a.spec.ts',
    '--include=src/b/c.spec.ts',
    '--code-coverage',
  ];

  const env = (rang) => ({
    CI: 'true',
    KARMA_TRANCHE: `${rang}/2`,
    KARMA_COUVERTURE: `/couverture/tranches/${rang}`,
    KARMA_GRAINE: '4242',
  });

  assert.deepEqual(
    lancementsDesTranches(2, ['--code-coverage'], '/couverture', '4242', [
      'src/a.spec.ts',
      'src/b/c.spec.ts',
    ]),
    [
      { env: env(0), args: ngTest, silenceMaxMs: 300_000 },
      { env: env(1), args: ngTest, silenceMaxMs: 300_000 },
    ],
  );
});

test('une passe nomme une seule fois chaque fichier qu une spec demande et que les tests ne servent pas', () => {
  const tranche = (chemin) =>
    `18 11 2026 14:21:19.980:WARN [web-server]: 404: ${chemin}\nExecuted 1 of 2 SUCCESS`;

  assert.deepEqual(
    ressourcesAbsentes([
      tranche('/_karma_webpack_/images/x.webp'),
      tranche('/_karma_webpack_/assets/audit.jpg'),
      tranche('/_karma_webpack_/images/x.webp'),
    ]),
    ['/_karma_webpack_/assets/audit.jpg', '/_karma_webpack_/images/x.webp'],
  );
  assert.deepEqual(ressourcesAbsentes(['Executed 2 of 2 SUCCESS']), []);
});

test('les tranches refusent une spec ciblée, qu ng test joindrait à toute la suite sans le dire', () => {
  assert.throws(
    () =>
      lancementsDesTranches(2, ['--include=src/a.spec.ts'], '/couverture', '1', ['src/b.spec.ts']),
    /--include.*ng test --include/,
  );
});

test('les specs du front se listent triées par unité de code, pour que la graine mélange le même ordre d enregistrement à chaque passe', () => {
  const specs = specsDuFront();

  assert.ok(specs.includes('src/app/app.routes.spec.ts'));
  assert.ok(specs.every((spec) => spec.startsWith('src/') && spec.endsWith('.spec.ts')));
  assert.deepEqual(
    specs,
    specs.toSorted((gauche, droite) => Number(gauche > droite) - Number(gauche < droite)),
  );
});

test('une passe tire sa graine d ordre, que KARMA_GRAINE impose pour rejouer un échec', () => {
  assert.equal(
    graineDeLaPasse(undefined, () => 0.5),
    '50000',
  );
  assert.equal(
    graineDeLaPasse('', () => 0),
    '0',
  );
  assert.equal(
    graineDeLaPasse('987', () => 0.5),
    '987',
  );
  for (const demande of ['-1', '1.5', 'abc']) {
    assert.throws(() => graineDeLaPasse(demande, () => 0), /KARMA_GRAINE/, demande);
  }
});

test('la fusion lit la couverture de chaque tranche lancée et refuse celle qui manque', () => {
  avecDossierPlante(
    'karma-en-tranches-',
    { 'tranches/0/coverage-final.json': JSON.stringify(couvertureDe('/src/a.ts', [1])) },
    (racine) => {
      const lancements = lancementsDesTranches(2, ['--code-coverage'], racine, '1', []);

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
  const sortie = (jouees, total, empreinte = `${total}-a1`) =>
    [
      `Chrome Headless 157 (Mac OS 10.15.7) LOG: 'empreinte de la suite : ${empreinte}'`,
      `Chrome Headless 157 (Mac OS 10.15.7): Executed ${jouees} of ${total} (skipped ${total - jouees}) SUCCESS`,
    ].join('\n');

  assert.equal(repartitionIncomplete([sortie(4, 7), sortie(3, 7)]), null);
  assert.equal(
    repartitionIncomplete([sortie(4, 7), sortie(4, 7)]),
    'les tranches jouent 8 specs pour une suite de 7',
  );
  assert.equal(
    repartitionIncomplete([sortie(3, 7), sortie(3, 6)]),
    'les tranches ne voient pas les mêmes specs : 7-a1, 6-a1',
  );
  assert.equal(
    repartitionIncomplete([sortie(4, 7), sortie(3, 7, '7-b2')]),
    'les tranches ne voient pas les mêmes specs : 7-a1, 7-b2',
  );
  assert.equal(
    repartitionIncomplete([sortie(3, 7), 'Executed 4 of 7 SUCCESS']),
    'les tranches ne voient pas les mêmes specs : 7-a1, aucune',
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

const FAUX_NPM = `#!${process.execPath}
const { spawn } = require('node:child_process');
require('node:fs').appendFileSync(process.env.CHEFS, process.pid + '\\n');
spawn(process.execPath, ['-e', "process.on('SIGINT', () => {}); require('node:fs').appendFileSync(process.env.PIDS, process.pid + '\\\\n'); setInterval(() => {}, 1000)"], { stdio: 'ignore' });
process.on('SIGINT', () => process.exit(130));
setInterval(() => {}, 1000);
`;

const attendre = (duree) => new Promise((suite) => setTimeout(suite, duree));

const lignesDe = (fichier) =>
  existsSync(fichier) ? readFileSync(fichier, 'utf8').trim().split('\n') : [];

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  test(
    `un ${signal} reçu par les tranches arrête leurs groupes, chefs et descendants têtus compris, et sort en 130, même quand chaque tranche meurt du premier signal et qu un second signal suit, sans toucher la couverture d une passe voisine`,
    { timeout: 30_000 },
    async () => {
      const racine = planterDossier('karma-en-tranches-cli-');
      const pids = join(racine, 'pids');
      const chefs = join(racine, 'chefs');
      const sentinelle = cheminDuDepot(`coverage/portfolio-app/voisine-${process.pid}-${signal}`);
      ecrireFichiers('/', { [sentinelle]: 'couverture d une passe voisine' });
      planterExecutable(racine, 'npm', FAUX_NPM);
      const cli = spawn(
        process.execPath,
        [cheminDuDepot('scripts/tests/karma-en-tranches.cli.mjs')],
        {
          env: {
            ...process.env,
            PATH: `${racine}:${process.env.PATH}`,
            KARMA_TRANCHES: '2',
            PIDS: pids,
            CHEFS: chefs,
          },
          stdio: 'ignore',
        },
      );
      const lances = () => [...lignesDe(pids), ...lignesDe(chefs)].map(Number);
      try {
        let code = null;
        const fin = new Promise((tenir) => cli.on('close', tenir)).then((sortie) => {
          code = sortie;
          return sortie;
        });
        while (lignesDe(pids).length < 2 && code === null) {
          await attendre(50);
        }
        const avantLeSignal = lances();

        cli.kill(signal);
        await attendre(200);
        cli.kill(signal);

        assert.equal(await fin, 130);
        assert.deepEqual(avantLeSignal.filter(estVivant), []);
        assert.ok(existsSync(sentinelle));
      } finally {
        cli.kill('SIGKILL');
        for (const pid of lances().filter(estVivant)) process.kill(pid, 'SIGKILL');
        supprimerDossier(racine);
        supprimerDossier(sentinelle);
      }
    },
  );
}
