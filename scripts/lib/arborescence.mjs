import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} racine
 * @param {(nom: string) => boolean} retenir
 * @param {ReadonlySet<string>} ancetres
 * @returns {string[]}
 */
function parcourir(racine, retenir, ancetres) {
  const reel = realpathSync(racine);
  if (ancetres.has(reel)) {
    return [];
  }
  const chaine = new Set(ancetres).add(reel);
  return readdirSync(racine)
    .flatMap((nom) => {
      const chemin = join(racine, nom);
      if (!existsSync(chemin)) {
        return [];
      }
      const entree = statSync(chemin);
      if (entree.isDirectory()) {
        return parcourir(chemin, retenir, chaine).map((relatif) => `${nom}/${relatif}`);
      }
      return entree.isFile() && retenir(nom) ? [nom] : [];
    })
    .sort();
}

/**
 * @param {string} racine
 * @param {(nom: string) => boolean} retenir
 * @returns {string[]}
 */
export function listerFichiers(racine, retenir) {
  return existsSync(racine) ? parcourir(racine, retenir, new Set()) : [];
}
