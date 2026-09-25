import { spawn } from 'node:child_process';
import { randomFillSync } from 'node:crypto';
import { existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { setTimeout as patienter } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { amorcerFormateur } from './amorcage.mjs';
import { attendreQue, sondeHttp } from './attente.mjs';
import {
  BASE_DU_BANC,
  PORTS,
  PROJET_COMPOSE,
  URL_API,
  URL_FRONT,
  environnementDeLApi,
  identifiantsDuFormateur,
  secretAleatoire,
  secretsTropCourts,
  variablesDeBase,
} from './configuration.mjs';

const RACINE_FRONT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const RACINE_BACK = resolve(RACINE_FRONT, '../portfolio-2025-back');

const COMPOSE = resolve(RACINE_FRONT, 'scripts/banc/banc.compose.yaml');

const DOSSIER_JOURNAUX = resolve(RACINE_FRONT, 'test-results/banc');

const JOURNAL_API = resolve(DOSSIER_JOURNAUX, 'api.log');

const source = { octets: (taille) => randomFillSync(new Uint8Array(taille)) };

/**
 * @param {string} commande
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string>, silencieux?: boolean }} options
 * @returns {Promise<void>}
 */
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

function executer(commande, args, options = {}) {
  return new Promise((tenir, rejeter) => {
    const enfant = lancerSuivi(commande, args, {
      cwd: options.cwd ?? RACINE_FRONT,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.silencieux ? ['ignore', 'ignore', 'pipe'] : 'inherit',
    });
    let erreurs = '';
    enfant.stderr?.on('data', (morceau) => {
      erreurs += String(morceau);
    });
    enfant.on('error', rejeter);
    enfant.on('close', (code) => {
      if (code === 0) {
        tenir();
        return;
      }
      rejeter(new Error(`${commande} ${args.join(' ')} → code ${code}\n${erreurs}`));
    });
  });
}

/**
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function compose(args) {
  return executer('docker', ['compose', '-p', PROJET_COMPOSE, '-f', COMPOSE, ...args]);
}

/**
 * @param {string} sql
 * @returns {Promise<string>}
 */
function executerSql(sql) {
  return new Promise((tenir, rejeter) => {
    const enfant = lancerSuivi(
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
    let sortie = '';
    enfant.stdout.on('data', (morceau) => {
      sortie += String(morceau);
    });
    enfant.stderr.on('data', (morceau) => {
      sortie += String(morceau);
    });
    enfant.on('error', rejeter);
    enfant.on('close', (code) =>
      code === 0 ? tenir(sortie) : rejeter(new Error(`psql → code ${code}\n${sortie}`)),
    );
  });
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
  await executer('pnpm', ['build'], { cwd: RACINE_BACK });
  if (existsSync(ENTREE_DE_L_API)) return;
  await executer('pnpm', ['build'], { cwd: RACINE_BACK });
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
    await executer(
      'pnpm',
      ['exec', 'typeorm', 'migration:run', '-d', 'dist/database/data-source.js'],
      { cwd: RACINE_BACK, env: variablesDeBase(BASE_DU_BANC, PORTS.base), silencieux: true },
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
    await executer('npm', ['run', 'build:banc']);

    annoncer('scénarios');
    await executer(
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

jouer().catch((erreur) => {
  process.stderr.write(`\n${erreur instanceof Error ? erreur.message : String(erreur)}\n`);
  process.exitCode = 1;
});
