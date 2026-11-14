import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const SUFFIXE_D_INSTANTANE = '.instantane.json';

/**
 * @param {string} chemin
 * @param {string} dossier
 * @returns {string}
 */
export const rangementDuFront = (chemin, dossier) => chemin.slice(dossier.length + 1);

/**
 * @param {string} dossier
 * @returns {string[]}
 */
export const instantanesDuFront = (dossier) =>
  readdirSync(dossier, { recursive: true })
    .filter((relatif) => relatif.endsWith(SUFFIXE_D_INSTANTANE))
    .sort((un, autre) => un.localeCompare(autre));

/**
 * @param {string} dossier
 * @returns {Map<string, string>}
 */
export const instantanesParCours = (dossier) =>
  new Map(
    instantanesDuFront(dossier).map((relatif) => [
      basename(relatif, SUFFIXE_D_INSTANTANE),
      join(dossier, relatif),
    ]),
  );

const RANGEMENT_D_INSTANTANE = /^([a-z0-9][a-z0-9-]*\/)*[a-z0-9][a-z0-9-]*\.instantane\.json$/;

/**
 * @param {{ readonly tree: readonly { readonly path: string, readonly type: string }[], readonly truncated: boolean }} arbre
 * @param {string} dossier
 * @returns {{ nom: string, chemin: string }[]}
 */
export const instantanesDuDossier = ({ tree, truncated }, dossier) => {
  if (truncated) {
    throw new Error(`l’arbre de ${dossier} est tronqué par GitHub : instantanés incomplets`);
  }
  const vus = new Map();
  return tree
    .filter(
      ({ path, type }) =>
        type === 'blob' && path.startsWith(`${dossier}/`) && path.endsWith(SUFFIXE_D_INSTANTANE),
    )
    .map(({ path }) => {
      const nom = path.slice(path.lastIndexOf('/') + 1);
      if (!RANGEMENT_D_INSTANTANE.test(rangementDuFront(path, dossier))) {
        throw new Error(`${path} : nom d’instantané refusé`);
      }
      const deja = vus.get(nom);
      if (deja !== undefined) {
        throw new Error(`${nom} servi deux fois : ${deja} et ${path}`);
      }
      vus.set(nom, path);
      return { nom, chemin: path };
    });
};

/**
 * @param {readonly string[]} locaux
 * @param {readonly string[]} distants
 * @returns {string[]}
 */
export const instantanesObsoletes = (locaux, distants) => {
  const servis = new Set(distants);
  return locaux.filter((nom) => nom.endsWith(SUFFIXE_D_INSTANTANE) && !servis.has(nom));
};

/**
 * @param {readonly (readonly [string, string])[]} instantanes
 * @returns {{ slug: string, duree: number }[]}
 */
export const coursServis = (instantanes) =>
  [...instantanes]
    .sort(([un], [autre]) => un.localeCompare(autre))
    .map(([nom, corps]) => {
      const { id, duree } = JSON.parse(corps)?.sujet ?? {};
      if (typeof id !== 'string' || id === '') {
        throw new Error(`${nom} : instantané sans sujet.id`);
      }
      if (!Number.isInteger(duree) || duree <= 0) {
        throw new Error(`${nom} : instantané sans sujet.duree en minutes entières`);
      }
      return { slug: id, duree };
    });
