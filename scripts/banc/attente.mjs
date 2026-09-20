export class AttenteEpuisee extends Error {
  /**
   * @param {string} quoi
   * @param {number} essais
   * @param {string} dernier
   */
  constructor(quoi, essais, dernier) {
    super(`${quoi} n'a pas répondu après ${essais} tentatives — dernier état : ${dernier}`);
    this.name = 'AttenteEpuisee';
  }
}

/**
 * @param {{
 *   quoi: string,
 *   sonder: () => Promise<boolean>,
 *   essais: number,
 *   patienter: (ms: number) => Promise<void>,
 *   intervalleMs?: number,
 * }} entree
 * @returns {Promise<number>}
 */
export async function attendreQue({ quoi, sonder, essais, patienter, intervalleMs = 500 }) {
  let dernier = 'aucune tentative';
  for (let tentative = 1; tentative <= essais; tentative += 1) {
    try {
      if (await sonder()) return tentative;
      dernier = 'sonde négative';
    } catch (erreur) {
      dernier = erreur instanceof Error ? erreur.message : String(erreur);
    }
    if (tentative < essais) await patienter(intervalleMs);
  }
  throw new AttenteEpuisee(quoi, essais, dernier);
}

/**
 * @param {{ appeler: (url: string) => Promise<{ ok: boolean, status: number }>, url: string }} entree
 * @returns {() => Promise<boolean>}
 */
export function sondeHttp({ appeler, url }) {
  return async () => {
    const reponse = await appeler(url);
    return reponse.ok;
  };
}
