import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { racineDuBack } from '../../banc/configuration.mjs';
import { RACINE, lireTexte } from '../depot.mjs';
import { git } from '../git.cjs';

/**
 * @typedef {{ readonly tree: readonly { readonly path: string, readonly type: string }[], readonly truncated: boolean }} Arbre
 * @typedef {{ readonly arbre: () => Promise<Arbre>, readonly fichier: (chemin: string) => Promise<string>, readonly openapi: string | Record<string, unknown> }} Source
 */

const COMMIT_COMPLET = /^[0-9a-f]{40}$/;

/**
 * @param {string} racineBack
 * @param {string} commit
 * @returns {boolean}
 */
const contientLeCommit = (racineBack, commit) =>
  existsSync(join(racineBack, '.git')) &&
  git(racineBack, ['cat-file', '--batch-check=%(objecttype)'], {
    input: `${commit}^{commit}\n`,
  }).trim() === 'commit';

/**
 * @param {string} racineBack
 * @param {string} commit
 * @returns {Source}
 */
const sourceLocale = (racineBack, commit) => {
  const fichier = (chemin) => git(racineBack, ['show', `${commit}:${chemin}`]);
  return {
    arbre: async () => ({
      truncated: false,
      tree: git(racineBack, ['ls-tree', '-r', '-z', '--full-tree', commit])
        .split('\0')
        .filter((entree) => entree !== '')
        .map((entree) => {
          const [meta, path] = entree.split('\t');
          return { path, type: meta.split(' ')[1] };
        }),
    }),
    fichier: async (chemin) => fichier(chemin),
    openapi: JSON.parse(fichier('openapi.json')),
  };
};

/**
 * @param {{ depot: string, commit: string }} epingle
 * @param {typeof fetch} telecharger
 * @returns {Source}
 */
const sourceGitHub = ({ depot, commit }, telecharger) => {
  const jeton = process.env['GITHUB_TOKEN'];
  const brut = (chemin) => `https://raw.githubusercontent.com/${depot}/${commit}/${chemin}`;
  const lire = async (url) => {
    const reponse = await telecharger(url, {
      headers:
        jeton && url.startsWith('https://api.github.com/')
          ? { authorization: `Bearer ${jeton}` }
          : {},
    });
    if (!reponse.ok) {
      throw new Error(`${url} : ${reponse.status}`);
    }
    return reponse;
  };
  return {
    arbre: async () =>
      (await lire(`https://api.github.com/repos/${depot}/git/trees/${commit}?recursive=1`)).json(),
    fichier: async (chemin) => (await lire(brut(chemin))).text(),
    openapi: brut('openapi.json'),
  };
};

/**
 * @param {{ depot: string, commit: string }} epingle
 * @param {string} racineBack
 * @param {typeof fetch} [telecharger]
 * @returns {Source}
 */
export const sourceDuContrat = (epingle, racineBack, telecharger = fetch) => {
  if (!COMMIT_COMPLET.test(epingle.commit)) {
    throw new Error(
      `contrat.json : l’épingle « ${epingle.commit} » n’est pas un commit complet de 40 caractères`,
    );
  }
  return contientLeCommit(racineBack, epingle.commit)
    ? sourceLocale(racineBack, epingle.commit)
    : sourceGitHub(epingle, telecharger);
};

/**
 * @param {{ env?: Record<string, string | undefined>, racineFront?: string }} [poste]
 * @returns {Source}
 */
export const sourceEpinglee = ({ env = process.env, racineFront = RACINE } = {}) =>
  sourceDuContrat(
    JSON.parse(lireTexte(join(racineFront, 'contrat.json'))),
    racineDuBack({ env, racineFront }),
  );
