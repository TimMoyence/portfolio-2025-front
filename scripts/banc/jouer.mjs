import { spawn } from 'node:child_process';
import { randomFillSync } from 'node:crypto';
import { existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as patienter } from 'node:timers/promises';

import { RACINE as RACINE_FRONT } from '../lib/depot.mjs';
import { messageDErreur } from '../../src/server/lecture-api.ts';
import { executer } from '../lib/processus.mjs';
import { amorcerFormateur } from './amorcage.mts';
import { attendreQue, sondeHttp } from './attente.mjs';
import {
  BASE_DU_BANC,
  PORTS,
  PROJET_COMPOSE,
  URL_API,
  URL_FRONT,
  environnementDeLApi,
  environnementDuCompose,
  identifiantsDuFormateur,
  racineDuBack,
  secretAleatoire,
  secretsTropCourts,
  variablesDeBase,
} from './configuration.mjs';

const RACINE_BACK = racineDuBack({ env: process.env, racineFront: RACINE_FRONT });

const COMPOSE = resolve(RACINE_FRONT, 'scripts/banc/banc.compose.yaml');

const DOSSIER_JOURNAUX = resolve(RACINE_FRONT, 'test-results/banc');

const JOURNAL_API = resolve(DOSSIER_JOURNAUX, 'api.log');

const source = { octets: (taille) => randomFillSync(new Uint8Array(taille)) };

const enfants = new Set();

/**
 * @param {string} commande
 * @param {string[]} args
 * @param {Record<string, unknown>} options
 * @returns {import('node:child_process').ChildProcess}
 */
function lancerSuivi(commande, args, options) {
  const enfant = spawn(commande, args, { ...options, detached: true });
  enfants.add(enfant);
  enfant.on('close', () => enfants.delete(enfant));
  return enfant;
}

/**
 * @param {NodeJS.Signals} signal
 * @returns {void}
 */
function signalerLesGroupes(signal) {
  for (const enfant of enfants) {
    if (enfant.pid === undefined || enfant.exitCode !== null) continue;
    try {
      process.kill(-enfant.pid, signal);
    } catch {
      enfant.kill(signal);
    }
  }
}

/**
 * @returns {Promise<void>}
 */
async function arreterLesEnfants() {
  signalerLesGroupes('SIGINT');
  await patienter(3_000);
  signalerLesGroupes('SIGKILL');
  await patienter(300);
}

/**
 * @param {string} commande
 * @param {string[]} args
 * @param {Parameters<typeof executer>[2]} [options]
 * @returns {Promise<string>}
 */
const executerSuivi = (commande, args, options = {}) =>
  executer(commande, args, { ...options, lancer: lancerSuivi });

/**
 * @param {string[]} args
 * @returns {Promise<string>}
 */
function compose(args) {
  return executerSuivi('docker', ['compose', '-p', PROJET_COMPOSE, '-f', COMPOSE, ...args], {
    env: environnementDuCompose(RACINE_BACK),
  });
}

/**
 * @param {string} sql
 * @returns {Promise<string>}
 */
function executerSql(sql) {
  return executerSuivi(
    'docker',
    [
      'exec',
      BASE_DU_BANC.conteneur,
      'psql',
      '-U',
      BASE_DU_BANC.utilisateur,
      '-d',
      BASE_DU_BANC.nom,
      '-c',
      sql,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

/**
 * @param {Record<string, string>} environnement
 * @returns {import('node:child_process').ChildProcess}
 */
function lancerLApi(environnement) {
  mkdirSync(DOSSIER_JOURNAUX, { recursive: true });
  const journal = openSync(JOURNAL_API, 'w');
  return lancerSuivi('node', ['dist/main.js'], {
    cwd: RACINE_BACK,
    env: { ...process.env, ...environnement },
    stdio: ['ignore', journal, journal],
  });
}

/**
 * @returns {Promise<void>}
 */
async function redescendre() {
  await arreterLesEnfants();
  await compose(['down', '-v', '--remove-orphans']).catch(() => undefined);
}

const ENTREE_DE_L_API = resolve(RACINE_BACK, 'dist/main.js');

/**
 * @returns {Promise<void>}
 */
async function construireLeBack() {
  await executerSuivi('pnpm', ['build'], { cwd: RACINE_BACK });
  if (existsSync(ENTREE_DE_L_API)) return;
  await executerSuivi('pnpm', ['build'], { cwd: RACINE_BACK });
  if (existsSync(ENTREE_DE_L_API)) return;
  throw new Error(
    `${ENTREE_DE_L_API} reste absent après deux constructions : une autre commande reconstruit le back en même temps (pnpm build y efface dist). Relancez le banc seul.`,
  );
}

/**
 * @returns {void}
 */
function exigerLeDepotBack() {
  if (existsSync(resolve(RACINE_BACK, 'package.json'))) return;
  throw new Error(
    `Le banc a besoin du dépôt back à côté du front : ${RACINE_BACK} est introuvable.`,
  );
}

/**
 * @returns {Record<string, string>}
 */
function environnementDuBanc() {
  const environnement = environnementDeLApi({
    secrets: {
      jwt: secretAleatoire(source),
      motDePasse: secretAleatoire(source),
      revision: secretAleatoire(source),
      jalon: secretAleatoire(source),
    },
  });
  const courts = secretsTropCourts(environnement);
  if (courts.length > 0) {
    throw new Error(`Secrets du banc trop courts : ${courts.join(', ')}`);
  }
  return environnement;
}

/**
 * @param {string} etape
 * @returns {void}
 */
function annoncer(etape) {
  process.stdout.write(`\n=== banc : ${etape} ===\n`);
}

async function jouer() {
  exigerLeDepotBack();
  const environnement = environnementDuBanc();
  const identifiants = identifiantsDuFormateur({ env: process.env, source });

  try {
    annoncer('base et cache');
    await compose(['down', '-v', '--remove-orphans']);
    await compose(['up', '-d', '--wait']);

    annoncer('construction du back');
    await construireLeBack();

    annoncer('migrations');
    await executerSuivi(
      'pnpm',
      ['exec', 'typeorm', 'migration:run', '-d', 'dist/database/data-source.js'],
      {
        cwd: RACINE_BACK,
        env: variablesDeBase(BASE_DU_BANC, PORTS.base),
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );

    annoncer('API');
    const api = lancerLApi(environnement);
    api.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        process.stderr.write(`API arrêtée (code ${code}) — journal : ${JOURNAL_API}\n`);
      }
    });
    await attendreQue({
      quoi: "L'API du banc",
      sonder: sondeHttp({ appeler: (url) => fetch(url), url: `${URL_API}/health` }),
      essais: 60,
      patienter,
    });

    annoncer('compte formateur');
    const jetonFormateur = await amorcerFormateur({
      appeler: (url, options) => fetch(url, options),
      executerSql,
      urlApi: URL_API,
      identifiants,
    });

    annoncer('construction du front');
    await executerSuivi('npm', ['run', 'build:banc']);

    annoncer('scénarios');
    await executerSuivi(
      'npx',
      ['playwright', 'test', '--project=banc', '--workers=1', ...process.argv.slice(2)],
      {
        env: {
          BANC_URL_API: URL_API,
          BANC_URL_FRONT: URL_FRONT,
          BANC_FORMATEUR_EMAIL: identifiants.email,
          BANC_FORMATEUR_MOTDEPASSE: identifiants.motDePasse,
          BANC_JETON_FORMATEUR: jetonFormateur,
        },
      },
    );
  } catch (erreur) {
    if (existsSync(JOURNAL_API)) {
      process.stderr.write(
        `\n--- fin du journal de l'API ---\n${readFileSync(JOURNAL_API, 'utf8').split('\n').slice(-20).join('\n')}\n`,
      );
    }
    throw erreur;
  } finally {
    annoncer('démontage');
    await redescendre();
  }
}

let interruption = null;

const interrompre = () => {
  interruption ??= (async () => {
    annoncer('interruption');
    await redescendre();
    process.exit(130);
  })();
};

process.on('SIGINT', interrompre);
process.on('SIGTERM', interrompre);

const action = process.argv[2] === '--nettoyer' ? redescendre : jouer;

action().catch((erreur) => {
  process.stderr.write(`\n${messageDErreur(erreur)}\n`);
  process.exitCode = 1;
});
