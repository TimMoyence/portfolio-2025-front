import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} racine
 * @param {(nom: string) => boolean} retenir
 * @returns {string[]}
 */
export function listerFichiers(racine, retenir) {
  if (!existsSync(racine)) {
    return [];
  }
  return readdirSync(racine)
    .flatMap((nom) => {
      const entree = statSync(join(racine, nom));
      if (entree.isDirectory()) {
        return listerFichiers(join(racine, nom), retenir).map((relatif) => `${nom}/${relatif}`);
      }
      return entree.isFile() && retenir(nom) ? [nom] : [];
    })
    .sort();
}
