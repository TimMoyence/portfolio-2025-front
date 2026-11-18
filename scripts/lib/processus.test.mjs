import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import test from 'node:test';

import { RACINE } from './depot.mjs';
import { arreterLesGroupes, estVivant, executer, lancerEnGroupe } from './processus.mjs';

const NODE = process.execPath;

const spawnNode = (script, options) => spawn(NODE, ['-e', script], options);

test("executer refuse un code non nul en nommant la commande, le code et la sortie d'erreur", async () => {
  await assert.rejects(
    executer(NODE, ['-e', "process.stderr.write('base absente'); process.exit(3)"], {
      stdio: ['ignore', 'ignore', 'pipe'],
    }),
    (erreur) => {
      assert.ok(erreur instanceof Error);
      assert.match(erreur.message, /-e .* → code 3\n/);
      assert.match(erreur.message, /base absente/);
      return true;
    },
  );
});

test('executer lance la commande à la racine du front par défaut', async () => {
  const dossier = await executer(NODE, ['-e', 'process.stdout.write(process.cwd())'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.equal(dossier, realpathSync(RACINE));
});

test("executer ajoute l'environnement demandé à celui du processus", async () => {
  const vu = await executer(
    NODE,
    ['-e', 'process.stdout.write(`${process.env.BANC_TEST}:${Boolean(process.env.PATH)}`)'],
    { env: { BANC_TEST: 'oui' }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  assert.equal(vu, 'oui:true');
});

test("executer rend ce que la commande écrit sur les flux qu'on lui confie", async () => {
  const sortie = await executer(
    NODE,
    ['-e', "process.stdout.write('UPDATE 1'); process.stderr.write(' NOTICE')"],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  assert.equal(sortie, 'UPDATE 1 NOTICE');
});

test("executer ne rend que la sortie standard quand la sortie d'erreur reste au terminal", async () => {
  const sortie = await executer(NODE, ['-e', 'process.stdout.write(JSON.stringify([1]))'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  assert.deepEqual(JSON.parse(sortie), [1]);
});

test('executer refuse un code non nul en citant la sortie capturée', async () => {
  await assert.rejects(
    executer(NODE, ['-e', "process.stdout.write('ERROR: relation absente'); process.exit(2)"], {
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
    /→ code 2\nERROR: relation absente/,
  );
});

test('executer lance la commande par le lanceur fourni, avec le dossier, l’environnement et les flux', async () => {
  const lances = [];
  const sortie = await executer('psql', ['-c', 'SELECT 1'], {
    cwd: '/tmp',
    env: { BANC_TEST: 'oui' },
    stdio: ['ignore', 'pipe', 'pipe'],
    lancer: (commande, args, options) => {
      lances.push({ commande, args, options });
      return spawnNode("process.stdout.write('1 ligne')", options);
    },
  });
  assert.equal(sortie, '1 ligne');
  assert.equal(lances.length, 1);
  assert.equal(lances[0].commande, 'psql');
  assert.deepEqual(lances[0].args, ['-c', 'SELECT 1']);
  assert.equal(lances[0].options.cwd, '/tmp');
  assert.equal(lances[0].options.env.BANC_TEST, 'oui');
  assert.deepEqual(lances[0].options.stdio, ['ignore', 'pipe', 'pipe']);
});

const FAMILLE_MUETTE = `
const { spawn } = require('node:child_process');
const petit = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' });
process.stdout.write('petit-enfant:' + petit.pid);
process.on('SIGTERM', () => {});
setInterval(() => {}, 1000);
`;

test('executer arrête toute la descendance d une commande restée muette au-delà du silence toléré, signaux ignorés compris', async () => {
  let petitEnfant = 0;

  await assert.rejects(
    executer(NODE, ['-e', FAMILLE_MUETTE], {
      stdio: ['ignore', 'pipe', 'pipe'],
      silenceMaxMs: 500,
    }),
    (erreur) => {
      assert.match(erreur.message, /→ muette depuis 500 ms\npetit-enfant:\d+/);
      petitEnfant = Number(/petit-enfant:(\d+)/.exec(erreur.message)?.[1]);
      return true;
    },
  );
  await new Promise((suite) => setTimeout(suite, 200));

  assert.equal(estVivant(petitEnfant), false);
});

const PS = '/bin/ps';

const groupeDe = (pid) =>
  execFileSync(PS, ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).trim();

test('executer garde une commande sans silence toléré dans le groupe du lanceur, qu une interruption du terminal atteint', async () => {
  const groupe = await executer(
    NODE,
    [
      '-e',
      "process.stdout.write(require('node:child_process').execFileSync('/bin/ps', ['-o', 'pgid=', '-p', String(process.pid)], { encoding: 'utf8' }).trim())",
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  assert.equal(groupe, groupeDe(process.pid));
});

test('arreterLesGroupes arrête toute la descendance des commandes en cours, signaux ignorés compris, et rend la main', async () => {
  const lances = [];
  const enCours = executer(NODE, ['-e', FAMILLE_MUETTE], {
    stdio: ['ignore', 'pipe', 'pipe'],
    silenceMaxMs: 60_000,
    lancer: (commande, args, options) => {
      const enfant = lancerEnGroupe(commande, args, options);
      lances.push(enfant);
      return enfant;
    },
  });
  const rejet = assert.rejects(enCours);
  await new Promise((suite) => setTimeout(suite, 300));
  const [enfant] = lances;

  await arreterLesGroupes();
  await rejet;

  assert.notEqual(groupeDe(process.pid), String(enfant?.pid));
  assert.equal(estVivant(enfant?.pid ?? 0), false);
  assert.deepEqual(
    execFileSync(PS, ['-A', '-o', 'pgid='], { encoding: 'utf8' })
      .split('\n')
      .map((ligne) => ligne.trim())
      .filter((pgid) => pgid === String(enfant?.pid)),
    [],
  );
});
