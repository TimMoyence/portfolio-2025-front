import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * @param {string} relatif
 * @returns {string}
 */
export const cheminDuDepot = (relatif) => join(RACINE, relatif);

/**
 * @param {string} chemin
 * @returns {string}
 */
export const lireTexte = (chemin) => readFileSync(chemin, 'utf8');
