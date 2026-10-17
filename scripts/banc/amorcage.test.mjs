import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AmorcageEchoue,
  amorcerFormateur,
  corpsDInscription,
  inscrireFormateur,
  sqlDePromotion,
} from './amorcage.mts';

const IDENTIFIANTS = { email: 'formateur.banc@example.test', motDePasse: 'Banc!abcdef12349' };

function apiSimulee(reponses) {
  const vues = [];
  return {
    vues,
    appeler: (url, options) => {
      vues.push({
        url,
        methode: options.method,
        entetes: options.headers,
        corps: JSON.parse(String(options.body)),
      });
      const prochaine = reponses.shift();
      return Promise.resolve({
        status: prochaine.status,
        text: () => Promise.resolve(prochaine.corps ?? ''),
        json: () => Promise.resolve(prochaine.json ?? {}),
      });
    },
  };
}

function inscriptionPuisConnexion() {
  return [{ status: 200 }, { status: 200, json: { accessToken: 'jeton-du-banc' } }];
}

function amorcerSur(api, executerSql = () => Promise.resolve('UPDATE 1')) {
  return amorcerFormateur({
    appeler: api.appeler,
    executerSql,
    urlApi: '/api',
    identifiants: IDENTIFIANTS,
  });
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

test('inscrireFormateur accepte tout 2xx : le 200 du back qui tait un compte present, le 201 du back en prod', async () => {
  for (const status of [200, 201]) {
    const api = apiSimulee([{ status }]);

    await inscrireFormateur({ appeler: api.appeler, urlApi: '/api', identifiants: IDENTIFIANTS });

    assert.equal(api.vues[0].url, '/api/auth/register', String(status));
  }
});

test('inscrireFormateur remonte le statut et le corps de toute autre reponse', async () => {
  for (const [status, corps] of [
    [500, 'panne base'],
    [409, 'compte deja present'],
    [302, 'redirection'],
  ]) {
    const api = apiSimulee([{ status, corps }]);

    await assert.rejects(
      inscrireFormateur({ appeler: api.appeler, urlApi: '/api', identifiants: IDENTIFIANTS }),
      new RegExp(`inscription : ${status} ${corps}`),
    );
  }
});

test('amorcerFormateur accepte la connexion en 201 du back en prod', async () => {
  const api = apiSimulee([
    { status: 201 },
    { status: 201, json: { accessToken: 'jeton-du-banc' } },
  ]);

  assert.equal(await amorcerSur(api), 'jeton-du-banc');
});

test('amorcerFormateur refuse une connexion hors 2xx', async () => {
  const api = apiSimulee([
    { status: 200 },
    { status: 401, corps: 'identifiants refuses', json: { accessToken: 'jeton-du-banc' } },
  ]);

  await assert.rejects(amorcerSur(api), /connexion : 401 identifiants refuses/);
});

test('amorcerFormateur enchaine inscription, promotion et connexion', async () => {
  const api = apiSimulee(inscriptionPuisConnexion());
  const requetes = [];

  const jeton = await amorcerSur(api, (sql) => {
    requetes.push(sql);
    return Promise.resolve('UPDATE 1');
  });

  assert.equal(jeton, 'jeton-du-banc');
  assert.deepEqual(
    api.vues.map((vue) => vue.url),
    ['/api/auth/register', '/api/auth/login'],
  );
  assert.equal(requetes.length, 1);
});

test("amorcerFormateur poste l'inscription et la connexion en JSON", async () => {
  const api = apiSimulee(inscriptionPuisConnexion());

  await amorcerSur(api);

  const json = { 'content-type': 'application/json' };
  assert.deepEqual(api.vues, [
    {
      url: '/api/auth/register',
      methode: 'POST',
      entetes: json,
      corps: corpsDInscription(IDENTIFIANTS),
    },
    {
      url: '/api/auth/login',
      methode: 'POST',
      entetes: json,
      corps: { email: IDENTIFIANTS.email, password: IDENTIFIANTS.motDePasse },
    },
  ]);
});

test('amorcerFormateur echoue quand la promotion ne touche aucune ligne', async () => {
  const api = apiSimulee([{ status: 200 }]);

  await assert.rejects(
    amorcerSur(api, () => Promise.resolve('UPDATE 0')),
    /aucune ligne mise a jour|aucune ligne mise à jour/,
  );
});

test('amorcerFormateur refuse une connexion sans jeton', async () => {
  const api = apiSimulee([{ status: 200 }, { status: 200, json: {} }]);

  await assert.rejects(amorcerSur(api), /jeton absent/);
});
