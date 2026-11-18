import { spawn } from 'node:child_process';
import { setTimeout as patienter } from 'node:timers/promises';

import { RACINE } from './depot.mjs';

/**
 * @typedef {(commande: string, args: string[], options: import('node:child_process').SpawnOptions) => import('node:child_process').ChildProcess} Lanceur
 */

const groupes = new Set();

/**
 * @param {number} pid
 * @returns {boolean}
 */
export function estVivant(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** @type {Lanceur} */
export function lancerEnGroupe(commande, args, options) {
  const enfant = spawn(commande, args, { ...options, detached: true });
  groupes.add(enfant);
  enfant.on('close', () => groupes.delete(enfant));
  return enfant;
}

/**
 * @param {import('node:child_process').ChildProcess} enfant
 * @param {NodeJS.Signals} signal
 * @returns {void}
 */
function signalerLeGroupe(enfant, signal) {
  if (enfant.pid === undefined) return;
  try {
    process.kill(-enfant.pid, signal);
  } catch {
    enfant.kill(signal);
  }
}

/**
 * @returns {Promise<void>}
 */
export async function arreterLesGroupes() {
  const lances = [...groupes];
  for (const enfant of lances) signalerLeGroupe(enfant, 'SIGINT');
  await patienter(3_000);
  for (const enfant of lances) signalerLeGroupe(enfant, 'SIGKILL');
  await patienter(300);
}

/**
 * @param {() => Promise<void>} [arreter]
 * @returns {() => Promise<void>}
 */
export function sortirEn130ALInterruption(arreter = arreterLesGroupes) {
  let interruption = null;
  const interrompre = () => {
    interruption ??= arreter().then(() => process.exit(130));
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, interrompre);
  return () => interruption ?? Promise.resolve();
}

/**
 * @param {string} commande
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string>, stdio?: import('node:child_process').StdioOptions, lancer?: Lanceur, silenceMaxMs?: number }} options
 * @returns {Promise<string>}
 */
export function executer(commande, args, options = {}) {
  const { silenceMaxMs } = options;
  const lancer = options.lancer ?? (silenceMaxMs === undefined ? spawn : lancerEnGroupe);
  return new Promise((tenir, rejeter) => {
    const enfant = lancer(commande, args, {
      cwd: options.cwd ?? RACINE,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? 'inherit',
    });
    let lu = '';
    let muette = false;
    let veille;
    const guetter = () => {
      if (silenceMaxMs === undefined) return;
      clearTimeout(veille);
      veille = setTimeout(() => {
        muette = true;
        signalerLeGroupe(enfant, 'SIGKILL');
      }, silenceMaxMs);
    };
    const lire = (morceau) => {
      lu += String(morceau);
      guetter();
    };
    guetter();
    enfant.stdout?.on('data', lire);
    enfant.stderr?.on('data', lire);
    enfant.on('error', rejeter);
    enfant.on('close', (code) => {
      clearTimeout(veille);
      if (muette) {
        rejeter(
          new Error(`${commande} ${args.join(' ')} → muette depuis ${silenceMaxMs} ms\n${lu}`),
        );
        return;
      }
      if (code === 0) {
        tenir(lu);
        return;
      }
      rejeter(new Error(`${commande} ${args.join(' ')} → code ${code}\n${lu}`));
    });
  });
}
