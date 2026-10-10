export const DELAI_DE_LECTURE_MS = 2_000;
const DUREE_DU_CACHE_MS = 300_000;

export type LectureJson =
  { readonly ok: true; readonly corps: unknown } | { readonly ok: false; readonly statut: number };

export async function lireJsonSousDelai(
  recuperer: typeof fetch,
  url: string,
  delaiMs: number,
): Promise<LectureJson> {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), delaiMs);
  try {
    const reponse = await recuperer(url, {
      headers: { accept: 'application/json' },
      signal: controleur.signal,
    });
    if (!reponse.ok) {
      return { ok: false, statut: reponse.status };
    }
    return { ok: true, corps: await reponse.json() };
  } finally {
    clearTimeout(minuterie);
  }
}

export function garderEnCache<T>(
  maintenant: () => number,
  lire: () => Promise<T>,
): () => Promise<T> {
  let cache: { readonly expireA: number; readonly valeur: T } | null = null;
  return async () => {
    if (cache !== null && cache.expireA > maintenant()) {
      return cache.valeur;
    }
    const valeur = await lire();
    cache = { expireA: maintenant() + DUREE_DU_CACHE_MS, valeur };
    return valeur;
  };
}

export function messageDErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur);
}
