import { spawn } from 'node:child_process';

import { RACINE } from './depot.mjs';

/**
 * @typedef {(commande: string, args: string[], options: import('node:child_process').SpawnOptions) => import('node:child_process').ChildProcess} Lanceur
 */

/**
 * @param {string} commande
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string>, stdio?: import('node:child_process').StdioOptions, lancer?: Lanceur }} options
 * @returns {Promise<string>}
 */
export function executer(commande, args, options = {}) {
  const lancer = options.lancer ?? spawn;
  return new Promise((tenir, rejeter) => {
    const enfant = lancer(commande, args, {
      cwd: options.cwd ?? RACINE,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: options.stdio ?? 'inherit',
    });
    let lu = '';
    const lire = (morceau) => {
      lu += String(morceau);
    };
    enfant.stdout?.on('data', lire);
    enfant.stderr?.on('data', lire);
    enfant.on('error', rejeter);
    enfant.on('close', (code) => {
      if (code === 0) {
        tenir(lu);
        return;
      }
      rejeter(new Error(`${commande} ${args.join(' ')} → code ${code}\n${lu}`));
    });
  });
}
