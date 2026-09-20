export const PROJET_COMPOSE = 'portfolio2025-banc';

export const PORTS = Object.freeze({
  base: 55433,
  redis: 63790,
  api: 3010,
  front: 4010,
});

const PREFIXE_API = '/api/v1/portfolio25';

export const URL_API = `http://127.0.0.1:${PORTS.api}${PREFIXE_API}`;

export const URL_FRONT = `http://localhost:${PORTS.front}`;

export const BASE_DU_BANC = Object.freeze({
  nom: 'portfolio_2025_banc',
  utilisateur: 'postgres',
  motDePasse: 'postgres',
  conteneur: `${PROJET_COMPOSE}-banc-db-1`,
});

const LONGUEUR_SECRET = 48;

const CARACTERES_SPECIAUX = '!@#$%';

/**
 * @param {{ octets: (taille: number) => Uint8Array }} source
 * @returns {string}
 */
export function secretAleatoire(source) {
  return Array.from(source.octets(LONGUEUR_SECRET))
    .map((octet) => octet.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, LONGUEUR_SECRET);
}

/**
 * @param {{ env: Record<string, string | undefined>, source: { octets: (taille: number) => Uint8Array } }} entree
 * @returns {{ email: string, motDePasse: string }}
 */
export function identifiantsDuFormateur({ env, source }) {
  const email = env['BANC_FORMATEUR_EMAIL'] ?? 'formateur.banc@example.test';
  const declare = env['BANC_FORMATEUR_MOTDEPASSE'];
  if (declare !== undefined && declare !== '') {
    return { email, motDePasse: declare };
  }
  const tirage = secretAleatoire(source).slice(0, 16);
  const special = CARACTERES_SPECIAUX[tirage.charCodeAt(0) % CARACTERES_SPECIAUX.length];
  return { email, motDePasse: `Banc${special}${tirage}9` };
}

/**
 * @param {{ nom: string, utilisateur: string, motDePasse: string }} base
 * @param {number} port
 * @returns {Record<string, string>}
 */
export function variablesDeBase(base, port) {
  return {
    DB_HOST: '127.0.0.1',
    DB_PORT: String(port),
    DB_USERNAME: base.utilisateur,
    DB_PASSWORD: base.motDePasse,
    DB_NAME: base.nom,
    DB_SSL: 'false',
    DB_SYNCHRONIZE: 'false',
    DATABASE_URL: '',
  };
}

const INTEGRATIONS_NEUTRALISEES = Object.freeze({
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: '',
  CONTACT_NOTIFICATION_TO: '',
  AUDIT_REPORT_TO: '',
  OPENAI_API_KEY: '',
  OPENWEATHERMAP_API_KEY: '',
  TELEGRAM_BOT_TOKEN: '',
  METRICS_TOKEN: '',
  MORNING_BRIEF_HMAC_KEYS: '',
  MORNING_BRIEF_HMAC_KEY_ID: '',
  MORNING_BRIEF_HMAC_SECRET: '',
});

/**
 * @param {{ secrets: Record<string, string>, ports?: typeof PORTS, base?: typeof BASE_DU_BANC }} entree
 * @returns {Record<string, string>}
 */
export function environnementDeLApi({ secrets, ports = PORTS, base = BASE_DU_BANC }) {
  return {
    ...INTEGRATIONS_NEUTRALISEES,
    ...variablesDeBase(base, ports.base),
    NODE_ENV: 'development',
    PORT: String(ports.api),
    API_PREFIX: PREFIXE_API,
    SWAGGER_PATH: 'docs',
    CORS_ORIGIN: [`http://localhost:${ports.front}`, `http://127.0.0.1:${ports.front}`].join(','),
    JWT_SECRET: secrets.jwt,
    SECURE_KEY_FOR_PASSWORD_HASHING: secrets.motDePasse,
    JWT_EXPIRES_IN: '900s',
    GOOGLE_CLIENT_ID: 'banc.apps.googleusercontent.com',
    PASSWORD_RESET_URL_BASE: `http://localhost:${ports.front}/reset-password`,
    FORMATION_TEACHER_NOTIFICATION_TO: 'banc@example.test',
    FORMATION_REVIEW_BASE_URL: `http://localhost:${ports.front}/cours/revision`,
    FORMATION_REVIEW_TOKEN_SECRET: secrets.revision,
    FORMATIONS_PULSE_SECRET: secrets.jalon,
    REDIS_URL: `redis://127.0.0.1:${ports.redis}`,
    AUDIT_QUEUE_ENABLED: 'false',
    ENABLE_LEGACY_CMS_CONTEXTS: 'false',
  };
}

/**
 * @param {Record<string, string>} environnement
 * @returns {string[]}
 */
export function secretsTropCourts(environnement) {
  const minimum = 32;
  return [
    'JWT_SECRET',
    'SECURE_KEY_FOR_PASSWORD_HASHING',
    'FORMATION_REVIEW_TOKEN_SECRET',
    'FORMATIONS_PULSE_SECRET',
  ].filter((cle) => (environnement[cle] ?? '').length < minimum);
}
