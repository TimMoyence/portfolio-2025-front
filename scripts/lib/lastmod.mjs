/**
 * @param {string} texte
 * @returns {Set<string>}
 */
export const revsIgnorees = (texte) =>
  new Set(
    texte
      .split('\n')
      .map((ligne) => ligne.split('#')[0].trim().toLowerCase())
      .filter((ligne) => /^[0-9a-f]{40}$/.test(ligne)),
  );

/**
 * @param {string} journal
 * @param {ReadonlySet<string>} ignorees
 * @returns {string | null}
 */
export const datePortee = (journal, ignorees) =>
  journal
    .split('\n')
    .map((ligne) => ligne.trim().split(/\s+/))
    .find(([sha, date]) => sha && date && !ignorees.has(sha))?.[1] ?? null;
