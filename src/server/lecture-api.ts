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

export function messageDErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : String(erreur);
}
