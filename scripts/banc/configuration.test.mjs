import assert from 'node:assert/strict';
import test from 'node:test';
import fc from 'fast-check';

import {
  BASE_DU_BANC,
  PORTS,
  environnementDeLApi,
  identifiantsDuFormateur,
  secretAleatoire,
  secretsTropCourts,
  variablesDeBase,
} from './configuration.mjs';

const GRAINE = 20260920;

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

  for (const cle of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'OPENAI_API_KEY', 'TELEGRAM_BOT_TOKEN'])
    assert.equal(environnement[cle], '', cle);
  assert.equal(environnement.AUDIT_QUEUE_ENABLED, 'false');
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
