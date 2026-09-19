export interface PendingFreeResponse {
  readonly key: string;
  readonly sessionId: string;
  readonly screenId: string;
  readonly activityId: string;
  readonly response: string;
  readonly dureeMs: number;
}

const DATABASE = 'portfolio-formation-offline';
const STORE = 'free-responses';
const fallback = new Map<string, PendingFreeResponse>();

function ouvrirLaBase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function avecLaBase<T>(
  operation: (base: IDBDatabase) => Promise<T>,
  sansBase: () => T,
): Promise<T> {
  const base = await ouvrirLaBase();
  if (base === null) {
    return sansBase();
  }
  try {
    return await operation(base);
  } finally {
    base.close();
  }
}

export function enqueueFreeResponse(response: PendingFreeResponse): Promise<void> {
  return avecLaBase(
    (base) =>
      new Promise<void>((resolve, reject) => {
        const transaction = base.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).put(response);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      }),
    () => {
      fallback.set(response.key, response);
    },
  );
}

export function pendingFreeResponses(sessionId: string): Promise<readonly PendingFreeResponse[]> {
  const deLaSeance = (responses: readonly PendingFreeResponse[]): PendingFreeResponse[] =>
    responses.filter((response) => response.sessionId === sessionId);
  return avecLaBase(
    (base) =>
      new Promise<readonly PendingFreeResponse[]>((resolve) => {
        const request = base.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        request.onsuccess = () => resolve(deLaSeance(request.result as PendingFreeResponse[]));
        request.onerror = () => resolve([]);
      }),
    () => deLaSeance([...fallback.values()]),
  );
}

export function removeFreeResponse(key: string): Promise<void> {
  fallback.delete(key);
  return avecLaBase(
    (base) =>
      new Promise<void>((resolve) => {
        const transaction = base.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      }),
    () => undefined,
  );
}
