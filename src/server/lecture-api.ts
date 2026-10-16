import type { z } from 'zod';

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

export interface MessagesDeLecture {
  readonly refus: (statut: number) => string;
  readonly injoignable: (message: string) => string;
}

export async function lireJsonJournalise(
  dependances: { readonly fetch: typeof fetch; readonly journal: Pick<Console, 'warn'> },
  url: string,
  messages: MessagesDeLecture,
): Promise<{ readonly corps: unknown } | null> {
  try {
    const lecture = await lireJsonSousDelai(dependances.fetch, url, DELAI_DE_LECTURE_MS);
    if (!lecture.ok) {
      dependances.journal.warn(messages.refus(lecture.statut));
      return null;
    }
    return { corps: lecture.corps };
  } catch (erreur) {
    dependances.journal.warn(messages.injoignable(messageDErreur(erreur)));
    return null;
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

export function champsHorsContrat(erreur: z.ZodError): string {
  const champs = erreur.issues.flatMap((issue) => {
    const chemin = issue.path.map(String);
    return issue.code === 'unrecognized_keys'
      ? issue.keys.map((cle) => [...chemin, cle].join('.'))
      : [chemin.join('.')];
  });
  return [...new Set(champs)].join(', ');
}
