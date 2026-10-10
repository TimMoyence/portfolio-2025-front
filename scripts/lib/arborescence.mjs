import { existsSync, readdirSync } from 'node:fs';
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
  return readdirSync(racine, { withFileTypes: true })
    .flatMap((entree) => {
      if (entree.isDirectory()) {
        return listerFichiers(join(racine, entree.name), retenir).map(
          (relatif) => `${entree.name}/${relatif}`,
        );
      }
      return entree.isFile() && retenir(entree.name) ? [entree.name] : [];
    })
    .sort();
}
