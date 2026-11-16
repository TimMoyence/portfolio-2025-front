import assert from 'node:assert/strict';
import { relative } from 'node:path';
import { test } from 'node:test';

import { planterDossier, supprimerDossier } from '../dossier-temporaire.mjs';
import { git } from '../git.cjs';
import { sourceDuContrat, sourceEpinglee } from './source.mjs';

const DEPOT = 'proprietaire/back';
const INSTANTANE = 'test/fixtures/formations/b1/b1-01 cours.instantane.json';
const OPENAPI = { openapi: '3.0.0', info: { title: 'back', version: '1' } };

const backAvecUnCommit = (t) => {
  const racine = planterDossier('source-du-contrat-', {
    [INSTANTANE]: '{"sujet":{"id":"b1-01"}}\n',
    'openapi.json': JSON.stringify(OPENAPI),
  });
  t.after(() => supprimerDossier(racine));
  git(racine, ['init', '--quiet']);
  git(racine, ['add', '.']);
  git(racine, [
    '-c',
    'user.name=banc',
    '-c',
    'user.email=banc@exemple.test',
    'commit',
    '--quiet',
    '--no-gpg-sign',
    '-m',
    'contrat',
  ]);
  return { racine, commit: git(racine, ['rev-parse', 'HEAD']).trim() };
};

const telechargementInterdit = () => {
  throw new Error('le contrat local ne passe pas par le réseau');
};

test('lit l’arbre, les fichiers et openapi.json au commit épinglé du back voisin, sans réseau', async (t) => {
  const { racine, commit } = backAvecUnCommit(t);
  git(racine, ['rm', '--quiet', '-r', '.']);

  const source = sourceDuContrat({ depot: DEPOT, commit }, racine, telechargementInterdit);

  assert.deepEqual(await source.arbre(), {
    truncated: false,
    tree: [
      { path: 'openapi.json', type: 'blob' },
      { path: INSTANTANE, type: 'blob' },
    ],
  });
  assert.equal(await source.fichier(INSTANTANE), '{"sujet":{"id":"b1-01"}}\n');
  assert.deepEqual(source.openapi, OPENAPI);
});

test('passe par GitHub quand le back voisin ne contient pas le commit épinglé', async (t) => {
  const { racine } = backAvecUnCommit(t);
  const commit = 'f'.repeat(40);
  const lues = [];
  const telecharger = async (url) => {
    lues.push(url);
    return new Response(url.includes('/git/trees/') ? '{"tree":[],"truncated":false}' : 'corps');
  };

  const source = sourceDuContrat({ depot: DEPOT, commit }, racine, telecharger);

  assert.deepEqual(await source.arbre(), { tree: [], truncated: false });
  assert.equal(await source.fichier(INSTANTANE), 'corps');
  assert.equal(source.openapi, `https://raw.githubusercontent.com/${DEPOT}/${commit}/openapi.json`);
  assert.deepEqual(lues, [
    `https://api.github.com/repos/${DEPOT}/git/trees/${commit}?recursive=1`,
    `https://raw.githubusercontent.com/${DEPOT}/${commit}/${INSTANTANE}`,
  ]);
});

test('passe par GitHub quand le back voisin est absent', async () => {
  const commit = 'e'.repeat(40);
  const source = sourceDuContrat(
    { depot: DEPOT, commit },
    '/chemin/sans/back',
    async () => new Response('corps'),
  );

  assert.equal(await source.fichier('openapi.json'), 'corps');
  assert.equal(source.openapi, `https://raw.githubusercontent.com/${DEPOT}/${commit}/openapi.json`);
});

const frontEpingle = (t, commit) => {
  const racine = planterDossier('front-epingle-', {
    'contrat.json': JSON.stringify({ depot: DEPOT, commit }),
  });
  t.after(() => supprimerDossier(racine));
  return racine;
};

test('lit l’épingle du contrat.json du front dans le back que désigne BANC_RACINE_BACK', (t) => {
  const { racine, commit } = backAvecUnCommit(t);
  const front = frontEpingle(t, commit);

  const source = sourceEpinglee({
    env: { BANC_RACINE_BACK: relative(front, racine) },
    racineFront: front,
  });

  assert.deepEqual(source.openapi, OPENAPI);
});

test('lit l’épingle sur GitHub quand le front n’a pas de back voisin', (t) => {
  const commit = 'c'.repeat(40);

  const source = sourceEpinglee({ env: {}, racineFront: frontEpingle(t, commit) });

  assert.equal(source.openapi, `https://raw.githubusercontent.com/${DEPOT}/${commit}/openapi.json`);
});

test('refuse une épingle qui n’est pas un commit complet, que le back local et GitHub résoudraient chacun à sa façon', (t) => {
  const { racine } = backAvecUnCommit(t);

  assert.throws(() => sourceDuContrat({ depot: DEPOT, commit: 'master' }, racine), {
    message: 'contrat.json : l’épingle « master » n’est pas un commit complet de 40 caractères',
  });
});

test('refuse une réponse en échec de GitHub, avec son adresse et son statut', async () => {
  const commit = 'd'.repeat(40);
  const source = sourceDuContrat(
    { depot: DEPOT, commit },
    '/chemin/sans/back',
    async () => new Response('absent', { status: 404 }),
  );

  await assert.rejects(source.fichier('openapi.json'), {
    message: `https://raw.githubusercontent.com/${DEPOT}/${commit}/openapi.json : 404`,
  });
});
