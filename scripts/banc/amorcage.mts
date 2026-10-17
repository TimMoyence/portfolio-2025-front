const ROLE_FORMATEUR = 'teacher';

export class AmorcageEchoue extends Error {
  constructor(etape: string, detail: string) {
    super(`Amorçage du banc — ${etape} : ${detail}`);
    this.name = 'AmorcageEchoue';
  }
}

interface IdentifiantsDuFormateur {
  readonly email: string;
  readonly motDePasse: string;
}

interface RequeteJson {
  readonly method: 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

interface ReponseDeLApi {
  readonly status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

interface AppelDeLApi {
  readonly appeler: (url: string, options: RequeteJson) => Promise<ReponseDeLApi>;
  readonly urlApi: string;
  readonly identifiants: IdentifiantsDuFormateur;
}

export function sqlDePromotion(email: string, role: string = ROLE_FORMATEUR): string {
  if (!/^[\w.+-]+@[\w.-]+$/.test(email)) {
    throw new AmorcageEchoue('promotion', `adresse inattendue : ${email}`);
  }
  return `UPDATE users SET roles='${role}', email_verified=true WHERE email='${email}'`;
}

export function corpsDInscription(identifiants: IdentifiantsDuFormateur): Record<string, string> {
  return {
    email: identifiants.email,
    password: identifiants.motDePasse,
    firstName: 'Anne',
    lastName: 'Formateur',
  };
}

function estUnSucces(status: number): boolean {
  return status >= 200 && status < 300;
}

function posterJson(
  appeler: AppelDeLApi['appeler'],
  url: string,
  corps: unknown,
): Promise<ReponseDeLApi> {
  return appeler(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(corps),
  });
}

export async function inscrireFormateur({
  appeler,
  urlApi,
  identifiants,
}: AppelDeLApi): Promise<void> {
  const reponse = await posterJson(
    appeler,
    `${urlApi}/auth/register`,
    corpsDInscription(identifiants),
  );
  if (!estUnSucces(reponse.status)) {
    throw new AmorcageEchoue('inscription', `${reponse.status} ${await reponse.text()}`);
  }
}

export async function connecterLeFormateur({
  appeler,
  urlApi,
  identifiants,
}: AppelDeLApi): Promise<string> {
  const reponse = await posterJson(appeler, `${urlApi}/auth/login`, {
    email: identifiants.email,
    password: identifiants.motDePasse,
  });
  if (!estUnSucces(reponse.status)) {
    throw new AmorcageEchoue('connexion', `${reponse.status} ${await reponse.text()}`);
  }
  const { accessToken } = (await reponse.json()) as { accessToken?: unknown };
  if (typeof accessToken !== 'string' || accessToken === '') {
    throw new AmorcageEchoue('connexion', 'jeton absent de la réponse');
  }
  return accessToken;
}

export async function amorcerFormateur({
  appeler,
  executerSql,
  urlApi,
  identifiants,
}: AppelDeLApi & { readonly executerSql: (sql: string) => Promise<string> }): Promise<string> {
  await inscrireFormateur({ appeler, urlApi, identifiants });
  const sortie = await executerSql(sqlDePromotion(identifiants.email));
  if (!/UPDATE 1/.test(sortie)) {
    throw new AmorcageEchoue('promotion', `aucune ligne mise à jour (${sortie.trim()})`);
  }
  return connecterLeFormateur({ appeler, urlApi, identifiants });
}
