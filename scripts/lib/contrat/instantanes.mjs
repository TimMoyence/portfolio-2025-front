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

/**
 * @param {readonly (readonly [string, string])[]} instantanes
 * @returns {string[]}
 */
export const coursServis = (instantanes) =>
  [...instantanes]
    .sort(([un], [autre]) => un.localeCompare(autre))
    .map(([nom, corps]) => {
      const id = JSON.parse(corps)?.sujet?.id;
      if (typeof id !== 'string' || id === '') {
        throw new Error(`${nom} : instantané sans sujet.id`);
      }
      return id;
    });
