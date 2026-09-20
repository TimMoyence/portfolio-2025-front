const ROLE_FORMATEUR = 'teacher';

export class AmorcageEchoue extends Error {
  /**
   * @param {string} etape
   * @param {string} detail
   */
  constructor(etape, detail) {
    super(`Amorçage du banc — ${etape} : ${detail}`);
    this.name = 'AmorcageEchoue';
  }
}

/**
 * @param {string} email
 * @param {string} role
 * @returns {string}
 */
export function sqlDePromotion(email, role = ROLE_FORMATEUR) {
  if (!/^[\w.+-]+@[\w.-]+$/.test(email)) {
    throw new AmorcageEchoue('promotion', `adresse inattendue : ${email}`);
  }
  return `UPDATE users SET roles='${role}', email_verified=true WHERE email='${email}'`;
}

/**
 * @param {{ email: string, motDePasse: string }} identifiants
 * @returns {Record<string, string>}
 */
export function corpsDInscription(identifiants) {
  return {
    email: identifiants.email,
    password: identifiants.motDePasse,
    firstName: 'Anne',
    lastName: 'Formateur',
  };
}

/**
 * @param {{
 *   appeler: (url: string, options: Record<string, unknown>) => Promise<{ status: number, text: () => Promise<string> }>,
 *   urlApi: string,
 *   identifiants: { email: string, motDePasse: string },
 * }} entree
 * @returns {Promise<void>}
 */
export async function inscrireFormateur({ appeler, urlApi, identifiants }) {
  const reponse = await appeler(`${urlApi}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corpsDInscription(identifiants)),
  });
  if (reponse.status !== 201 && reponse.status !== 409) {
    throw new AmorcageEchoue('inscription', `${reponse.status} ${await reponse.text()}`);
  }
}

/**
 * @param {{
 *   appeler: (url: string, options: Record<string, unknown>) => Promise<{ status: number, text: () => Promise<string>, json: () => Promise<{ accessToken?: string }> }>,
 *   urlApi: string,
 *   identifiants: { email: string, motDePasse: string },
 * }} entree
 * @returns {Promise<string>}
 */
async function connecterLeFormateur({ appeler, urlApi, identifiants }) {
  const reponse = await appeler(`${urlApi}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: identifiants.email, password: identifiants.motDePasse }),
  });
  if (reponse.status !== 201) {
    throw new AmorcageEchoue('connexion', `${reponse.status} ${await reponse.text()}`);
  }
  const { accessToken } = await reponse.json();
  if (typeof accessToken !== 'string' || accessToken === '') {
    throw new AmorcageEchoue('connexion', 'jeton absent de la réponse');
  }
  return accessToken;
}

/**
 * @param {{
 *   appeler: (url: string, options: Record<string, unknown>) => Promise<{ status: number, text: () => Promise<string>, json: () => Promise<{ accessToken?: string }> }>,
 *   executerSql: (sql: string) => Promise<string>,
 *   urlApi: string,
 *   identifiants: { email: string, motDePasse: string },
 * }} entree
 * @returns {Promise<string>}
 */
export async function amorcerFormateur({ appeler, executerSql, urlApi, identifiants }) {
  await inscrireFormateur({ appeler, urlApi, identifiants });
  const sortie = await executerSql(sqlDePromotion(identifiants.email));
  if (!/UPDATE 1/.test(sortie)) {
    throw new AmorcageEchoue('promotion', `aucune ligne mise à jour (${sortie.trim()})`);
  }
  return connecterLeFormateur({ appeler, urlApi, identifiants });
}
