import { readdirSync, readFileSync } from 'node:fs';
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

/**
 * @param {string} dossier
 * @param {RegExp} extensions
 * @returns {{ fichier: string, texte: string }[]}
 */
export const textesDuDossier = (dossier, extensions) =>
  readdirSync(cheminDuDepot(dossier), { recursive: true, encoding: 'utf8' })
    .filter((relatif) => extensions.test(relatif))
    .map((relatif) => ({
      fichier: `${dossier}/${relatif}`,
      texte: lireTexte(join(cheminDuDepot(dossier), relatif)),
    }));
