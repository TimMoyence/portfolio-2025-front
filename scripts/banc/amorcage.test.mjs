import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AmorcageEchoue,
  amorcerFormateur,
  corpsDInscription,
  inscrireFormateur,
  sqlDePromotion,
} from './amorcage.mjs';

const IDENTIFIANTS = { email: 'formateur.banc@example.test', motDePasse: 'Banc!abcdef12349' };

function apiSimulee(reponses) {
  const vues = [];
  return {
    vues,
    appeler: (url, options) => {
      vues.push({ url, corps: JSON.parse(String(options.body)) });
      const prochaine = reponses.shift();
      return Promise.resolve({
        status: prochaine.status,
        text: () => Promise.resolve(prochaine.corps ?? ''),
        json: () => Promise.resolve(prochaine.json ?? {}),
      });
    },
  };
}

test('sqlDePromotion ne construit une requete que pour une adresse reconnue', () => {
  assert.match(sqlDePromotion(IDENTIFIANTS.email), /SET roles='teacher'/);
  assert.throws(() => sqlDePromotion("x'; DROP TABLE users; --"), AmorcageEchoue);
});

test("corpsDInscription reprend l'identite du formateur du banc", () => {
  assert.deepEqual(corpsDInscription(IDENTIFIANTS), {
    email: IDENTIFIANTS.email,
    password: IDENTIFIANTS.motDePasse,
    firstName: 'Anne',
    lastName: 'Formateur',
  });
});

test('inscrireFormateur accepte une creation comme un compte deja present', async () => {
  for (const status of [201, 409]) {
    const api = apiSimulee([{ status }]);
    await inscrireFormateur({ appeler: api.appeler, urlApi: '/api', identifiants: IDENTIFIANTS });
    assert.equal(api.vues[0].url, '/api/auth/register');
  }
});

test('inscrireFormateur remonte le corps de la reponse quand l API refuse', async () => {
  const api = apiSimulee([{ status: 500, corps: 'panne base' }]);

  await assert.rejects(
    inscrireFormateur({ appeler: api.appeler, urlApi: '/api', identifiants: IDENTIFIANTS }),
    /inscription : 500 panne base/,
  );
});

test('amorcerFormateur enchaine inscription, promotion et connexion', async () => {
  const api = apiSimulee([
    { status: 201 },
    { status: 201, json: { accessToken: 'jeton-du-banc' } },
  ]);
  const requetes = [];

  const jeton = await amorcerFormateur({
    appeler: api.appeler,
    executerSql: (sql) => {
      requetes.push(sql);
      return Promise.resolve('UPDATE 1');
    },
    urlApi: '/api',
    identifiants: IDENTIFIANTS,
  });

  assert.equal(jeton, 'jeton-du-banc');
  assert.deepEqual(
    api.vues.map((vue) => vue.url),
    ['/api/auth/register', '/api/auth/login'],
  );
  assert.equal(requetes.length, 1);
});

test('amorcerFormateur echoue quand la promotion ne touche aucune ligne', async () => {
  const api = apiSimulee([{ status: 201 }]);

  await assert.rejects(
    amorcerFormateur({
      appeler: api.appeler,
      executerSql: () => Promise.resolve('UPDATE 0'),
      urlApi: '/api',
      identifiants: IDENTIFIANTS,
    }),
    /aucune ligne mise a jour|aucune ligne mise à jour/,
  );
});

test('amorcerFormateur refuse une connexion sans jeton', async () => {
  const api = apiSimulee([{ status: 201 }, { status: 201, json: {} }]);

  await assert.rejects(
    amorcerFormateur({
      appeler: api.appeler,
      executerSql: () => Promise.resolve('UPDATE 1'),
      urlApi: '/api',
      identifiants: IDENTIFIANTS,
    }),
    /jeton absent/,
  );
});
