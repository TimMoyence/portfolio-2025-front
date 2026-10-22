export const SUFFIXE_D_INSTANTANE = '.instantane.json';

/**
 * @param {readonly string[]} locaux
 * @param {readonly string[]} distants
 * @returns {string[]}
 */
export const instantanesObsoletes = (locaux, distants) => {
  const servis = new Set(distants);
  return locaux.filter((nom) => nom.endsWith(SUFFIXE_D_INSTANTANE) && !servis.has(nom));
};
