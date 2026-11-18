import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

import { cheminDuDepot } from '../lib/depot.mjs';
import { planterDossier, planterExecutable, supprimerDossier } from '../lib/dossier-temporaire.mjs';

const RELAIS = cheminDuDepot('scripts/tests/chrome-sans-tubes.sh');

const FAUX_CHROME = `#!${process.execPath}
const { spawn } = require('node:child_process');
const { writeFileSync } = require('node:fs');
writeFileSync(process.env.TRACE, JSON.stringify(process.argv.slice(2)));
spawn(process.execPath, ['-e', 'setTimeout(() => {}, 3000)'], { detached: true, stdio: 'inherit' }).unref();
process.stdout.write('bavard');
process.exit(7);
`;

test('le relais lance le vrai chrome avec ses arguments et rend ses tubes dès sa sortie, même quand un descendant lui survit', async () => {
  const racine = planterDossier('chrome-sans-tubes-');
  try {
    const fauxChrome = planterExecutable(racine, 'chrome', FAUX_CHROME);
    const trace = join(racine, 'trace.json');
    const debut = Date.now();

    const { code, lu } = await new Promise((tenir) => {
      const enfant = spawn(RELAIS, ['--headless', 'http://localhost:9876/?id=1'], {
        env: { ...process.env, CHROME_REEL: fauxChrome, TRACE: trace },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let sortie = '';
      enfant.stdout.on('data', (morceau) => {
        sortie += String(morceau);
      });
      enfant.on('close', (fin) => tenir({ code: fin, lu: sortie }));
    });

    assert.ok(Date.now() - debut < 2_000, `tubes rendus en ${Date.now() - debut} ms`);
    assert.equal(code, 7);
    assert.equal(lu, '');
    assert.deepEqual(JSON.parse(readFileSync(trace, 'utf8')), [
      '--headless',
      'http://localhost:9876/?id=1',
    ]);
  } finally {
    supprimerDossier(racine);
  }
});

test('le relais refuse de démarrer sans vrai chrome et dit quelle variable poser', () => {
  const lance = spawnSync(RELAIS, ['--headless'], {
    env: { ...process.env, CHROME_REEL: '' },
    encoding: 'utf8',
  });

  assert.notEqual(lance.status, 0);
  assert.match(lance.stderr, /CHROME_BIN/);
});

const CHROME_TROUVE = createRequire(import.meta.url)('karma-chrome-launcher')[
  'launcher:ChromeHeadless'
][1].prototype.DEFAULT_CMD[process.platform];

const SANS_CHROME = Object.fromEntries(
  Object.entries(process.env).filter(([nom]) => !['CHROME_BIN', 'CHROME_REEL'].includes(nom)),
);

const chromesDeKarma = (env) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '-e',
        "require('./karma.conf.cjs')({ set() {} }); process.stdout.write(JSON.stringify([process.env.CHROME_BIN, process.env.CHROME_REEL]))",
      ],
      { cwd: cheminDuDepot('.'), env, encoding: 'utf8' },
    ),
  );

test('karma lance chrome par le relais et garde le chrome trouvé, ou celui de CHROME_BIN, comme vrai chrome', () => {
  assert.deepEqual(chromesDeKarma(SANS_CHROME), [RELAIS, CHROME_TROUVE]);
  assert.deepEqual(chromesDeKarma({ ...SANS_CHROME, CHROME_BIN: '/opt/chrome' }), [
    RELAIS,
    '/opt/chrome',
  ]);
});
