import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

import { cheminDuDepot, lireTexte } from '../lib/depot.mjs';
import {
  BASE_DU_BANC,
  PORTS,
  PROJET_COMPOSE,
  environnementDeLApi,
  environnementDuCompose,
  identifiantsDuFormateur,
  racineDuBack,
  secretAleatoire,
  secretsTropCourts,
  variablesDeBase,
} from './configuration.mjs';

const GRAINE = 20260920;

const COMPOSE_DU_BANC = fileURLToPath(new URL('./banc.compose.yaml', import.meta.url));

const SECRETS = {
  jwt: 'a'.repeat(48),
  motDePasse: 'b'.repeat(48),
  revision: 'c'.repeat(48),
  jalon: 'd'.repeat(48),
};

const sourceConstante = (octet) => ({
  octets: (taille) => new Uint8Array(taille).fill(octet),
});

test('variablesDeBase dirige TypeORM vers la base dédiée du banc', () => {
  const variables = variablesDeBase(BASE_DU_BANC, PORTS.base);

  assert.equal(variables.DB_NAME, 'portfolio_2025_banc');
  assert.equal(variables.DB_PORT, String(PORTS.base));
  assert.equal(variables.DATABASE_URL, '');
});

test("environnementDeLApi neutralise les integrations sortantes de l'API", () => {
  const environnement = environnementDeLApi({ secrets: SECRETS });

  for (const cle of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'OPENAI_API_KEY'])
    assert.equal(environnement[cle], '', cle);
  assert.equal(environnement.AUDIT_QUEUE_ENABLED, 'false');
});

test("environnementDeLApi ne transmet plus les cles des apps de l'atelier retirees", () => {
  const environnement = environnementDeLApi({ secrets: SECRETS });

  for (const cle of ['OPENWEATHERMAP_API_KEY', 'TELEGRAM_BOT_TOKEN'])
    assert.equal(Object.hasOwn(environnement, cle), false, cle);
});

test('environnementDeLApi autorise le front du banc et sert son propre prefixe', () => {
  const environnement = environnementDeLApi({ secrets: SECRETS });

  assert.equal(
    environnement.CORS_ORIGIN,
    `http://localhost:${PORTS.front},http://127.0.0.1:${PORTS.front}`,
  );
  assert.equal(environnement.PORT, String(PORTS.api));
  assert.equal(environnement.API_PREFIX, '/api/v1/portfolio25');
});

test('secretsTropCourts nomme chaque secret sous le minimum attendu par la validation', () => {
  const environnement = environnementDeLApi({ secrets: { ...SECRETS, jwt: 'court' } });

  assert.deepEqual(secretsTropCourts(environnement), ['JWT_SECRET']);
  assert.deepEqual(secretsTropCourts(environnementDeLApi({ secrets: SECRETS })), []);
});

test("identifiantsDuFormateur reprend le mot de passe fourni par l'environnement", () => {
  const identifiants = identifiantsDuFormateur({
    env: { BANC_FORMATEUR_EMAIL: 'qa@example.test', BANC_FORMATEUR_MOTDEPASSE: 'DejaChoisi!2026' },
    source: sourceConstante(7),
  });

  assert.deepEqual(identifiants, { email: 'qa@example.test', motDePasse: 'DejaChoisi!2026' });
});

test('le mot de passe engendre satisfait toujours la regle du DTO d inscription', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 255 }), (octet) => {
      const { motDePasse } = identifiantsDuFormateur({ env: {}, source: sourceConstante(octet) });

      assert.ok(motDePasse.length >= 12, motDePasse);
      assert.match(motDePasse, /[A-Z]/);
      assert.match(motDePasse, /\d/);
      assert.match(motDePasse, /[^A-Za-z0-9]/);
    }),
    { seed: GRAINE, numRuns: 256 },
  );
});

test('secretAleatoire rend toujours une chaine hexadecimale de la longueur attendue', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 255 }), (octet) => {
      const secret = secretAleatoire(sourceConstante(octet));

      assert.equal(secret.length, 48);
      assert.match(secret, /^[0-9a-f]+$/);
    }),
    { seed: GRAINE, numRuns: 64 },
  );
});

test('secretAleatoire écrit chaque octet en deux chiffres hexadécimaux minuscules, dans l ordre', () => {
  const motif = [0x00, 0x0f, 0xa0, 0xff];
  const source = {
    octets: (taille) =>
      Uint8Array.from({ length: taille }, (_, rang) => motif[rang % motif.length]),
  };

  assert.equal(secretAleatoire(source), '000fa0ff'.repeat(6));
});

test('racineDuBack prend le dépôt back voisin du front par défaut', () => {
  assert.equal(
    racineDuBack({ env: {}, racineFront: '/depots/portfolio-2025-front' }),
    '/depots/portfolio-2025-back',
  );
});

test('racineDuBack suit BANC_RACINE_BACK, relatif au front, pour jouer un worktree du back', () => {
  assert.equal(
    racineDuBack({
      env: { BANC_RACINE_BACK: '../wt-back-b2-02' },
      racineFront: '/depots/wt-front-b2-02',
    }),
    '/depots/wt-back-b2-02',
  );
  assert.equal(
    racineDuBack({ env: { BANC_RACINE_BACK: '' }, racineFront: '/depots/portfolio-2025-front' }),
    '/depots/portfolio-2025-back',
  );
});

test("aucun script du package.json n'appelle le compose du banc hors de jouer.mjs", () => {
  const { scripts } = JSON.parse(lireTexte(cheminDuDepot('package.json')));

  assert.deepEqual(
    Object.entries(scripts).filter(([, commande]) => commande.includes('banc.compose.yaml')),
    [],
  );
});

test('la base du banc étend celle du back que désigne BANC_RACINE_BACK, worktree compris', () => {
  const back = mkdtempSync(join(tmpdir(), 'banc-back-'));
  mkdirSync(join(back, 'test'));
  writeFileSync(
    join(back, 'test/db-integration.compose.yaml'),
    'services:\n  db-integration:\n    image: postgres:16-temoin-du-worktree\n',
  );
  const compose = spawnSync(
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- outil de depot lance depuis le poste dev / la CI : figer un chemin absolu casserait les installations Homebrew (/opt/homebrew/bin), nvm ou corepack
    'docker',
    ['compose', '-p', PROJET_COMPOSE, '-f', COMPOSE_DU_BANC, 'config', '--format', 'json'],
    { encoding: 'utf8', env: { ...process.env, ...environnementDuCompose(back) } },
  );
  rmSync(back, { recursive: true, force: true });

  assert.deepEqual(
    {
      statut: compose.status,
      erreur: compose.stderr.trim(),
      image:
        compose.status === 0 ? JSON.parse(compose.stdout).services['banc-db'].image : undefined,
    },
    { statut: 0, erreur: '', image: 'postgres:16-temoin-du-worktree' },
  );
});
