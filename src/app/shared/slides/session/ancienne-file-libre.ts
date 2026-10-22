import { enqueue } from '../../../../cours/runtime/core/queue';

export const BASE_DE_L_ANCIENNE_FILE = 'portfolio-formation-offline';
export const MAGASIN_DE_L_ANCIENNE_FILE = 'free-responses';

export interface ReponseLibreDeLAncienneFile {
  readonly key: string;
  readonly sessionId: string;
  readonly studentKey: string;
  readonly screenId: string;
  readonly activityId: string;
  readonly response: string;
  readonly dureeMs: number;
}

function enPromesse<T>(requete: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

function ouvrirSansCreer(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const requete = indexedDB.open(BASE_DE_L_ANCIENNE_FILE);
    requete.onupgradeneeded = () => requete.transaction?.abort();
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => resolve(null);
  });
}

async function lireLAncienneFile(base: IDBDatabase): Promise<ReponseLibreDeLAncienneFile[]> {
  if (!base.objectStoreNames.contains(MAGASIN_DE_L_ANCIENNE_FILE)) return [];
  const magasin = base
    .transaction(MAGASIN_DE_L_ANCIENNE_FILE, 'readonly')
    .objectStore(MAGASIN_DE_L_ANCIENNE_FILE);
  return enPromesse(magasin.getAll() as IDBRequest<ReponseLibreDeLAncienneFile[]>);
}

export async function reprendreLAncienneFileLibre(maintenant: () => Date): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const base = await ouvrirSansCreer();
  if (base === null) return;
  try {
    for (const reponse of await lireLAncienneFile(base)) {
      enqueue({
        nature: 'libre',
        sessionId: reponse.sessionId,
        studentKey: reponse.studentKey,
        screenId: reponse.screenId,
        questionId: reponse.activityId,
        valeur: reponse.response,
        dureeMs: reponse.dureeMs,
        horodatage: maintenant().toISOString(),
      });
    }
  } finally {
    base.close();
  }
  await enPromesse(indexedDB.deleteDatabase(BASE_DE_L_ANCIENNE_FILE));
}
