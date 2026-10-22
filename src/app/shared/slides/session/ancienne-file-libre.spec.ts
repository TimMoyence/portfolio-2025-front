import { removeKey } from '../../../../cours/runtime/core/storage';
import { pending } from '../../../../cours/runtime/core/queue';
import {
  BASE_DE_L_ANCIENNE_FILE,
  MAGASIN_DE_L_ANCIENNE_FILE,
  type ReponseLibreDeLAncienneFile,
  reprendreLAncienneFileLibre,
} from './ancienne-file-libre';

const CLE = 'fp.file-reponses';
const MAINTENANT = new Date('2026-10-22T10:00:00.000Z');

const REFLEXION: ReponseLibreDeLAncienneFile = {
  key: 'S1:K1:E1:R1',
  sessionId: 'S1',
  studentKey: 'K1',
  screenId: 'E1',
  activityId: 'R1',
  response: 'Ma réflexion écrite hors ligne',
  dureeMs: 4200,
};

function requete<T>(demande: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    demande.onsuccess = () => resolve(demande.result);
    demande.onerror = () => reject(demande.error);
  });
}

async function semerLAncienneFile(reponses: readonly ReponseLibreDeLAncienneFile[]): Promise<void> {
  const ouverture = indexedDB.open(BASE_DE_L_ANCIENNE_FILE, 2);
  ouverture.onupgradeneeded = () =>
    ouverture.result.createObjectStore(MAGASIN_DE_L_ANCIENNE_FILE, { keyPath: 'key' });
  const base = await requete(ouverture);
  const transaction = base.transaction(MAGASIN_DE_L_ANCIENNE_FILE, 'readwrite');
  for (const reponse of reponses) transaction.objectStore(MAGASIN_DE_L_ANCIENNE_FILE).put(reponse);
  await new Promise<void>((resolve) => (transaction.oncomplete = () => resolve()));
  base.close();
}

async function basesExistantes(): Promise<string[]> {
  return (await indexedDB.databases()).map(({ name }) => name ?? '');
}

describe('reprendreLAncienneFileLibre', () => {
  beforeEach(async () => {
    removeKey(CLE);
    await requete(indexedDB.deleteDatabase(BASE_DE_L_ANCIENNE_FILE));
  });

  it('verse dans la file les réflexions restées dans l’ancienne base, puis la supprime', async () => {
    await semerLAncienneFile([REFLEXION]);

    await reprendreLAncienneFileLibre(() => MAINTENANT);

    expect(pending()).toEqual([
      {
        id: 1,
        nature: 'libre',
        sessionId: 'S1',
        studentKey: 'K1',
        screenId: 'E1',
        questionId: 'R1',
        valeur: 'Ma réflexion écrite hors ligne',
        dureeMs: 4200,
        horodatage: MAINTENANT.toISOString(),
      },
    ]);
    expect(await basesExistantes()).not.toContain(BASE_DE_L_ANCIENNE_FILE);
  });

  it('ne crée aucune base sur un poste qui n’a jamais eu l’ancienne file', async () => {
    await reprendreLAncienneFileLibre(() => MAINTENANT);

    expect(pending()).toEqual([]);
    expect(await basesExistantes()).not.toContain(BASE_DE_L_ANCIENNE_FILE);
  });
});
