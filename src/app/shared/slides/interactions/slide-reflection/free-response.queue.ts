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

function database(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function enqueueFreeResponse(response: PendingFreeResponse): Promise<void> {
  const db = await database();
  if (db === null) {
    fallback.set(response.key, response);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(response);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function pendingFreeResponses(
  sessionId: string,
): Promise<readonly PendingFreeResponse[]> {
  const db = await database();
  if (db === null) {
    return [...fallback.values()].filter((response) => response.sessionId === sessionId);
  }
  return new Promise((resolve) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () =>
      resolve(
        (request.result as PendingFreeResponse[]).filter(
          (response) => response.sessionId === sessionId,
        ),
      );
    request.onerror = () => resolve([]);
  });
}

export async function removeFreeResponse(key: string): Promise<void> {
  fallback.delete(key);
  const db = await database();
  if (db === null) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}
