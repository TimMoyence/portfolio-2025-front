export type StorageIncidentCause = 'indisponible' | 'refus';

export interface StorageIncident {
  cle: string;
  cause: StorageIncidentCause;
  horodatage: string;
}

const CAPACITE_JOURNAL_MAX = 200;
const journal: StorageIncident[] = [];

function stockageLocal(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function consigner(cle: string, cause: StorageIncidentCause): void {
  journal.push({ cle, cause, horodatage: new Date().toISOString() });
  if (journal.length > CAPACITE_JOURNAL_MAX) {
    journal.shift();
  }
}

export function readJson<T>(cle: string): T | null {
  try {
    const brut = stockageLocal()?.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(cle: string, valeur: unknown): boolean {
  const stockage = stockageLocal();
  if (stockage === null) {
    return false;
  }
  stockage.setItem(cle, JSON.stringify(valeur));
  return true;
}

export function persistJson(cle: string, valeur: unknown): boolean {
  try {
    if (writeJson(cle, valeur)) {
      return true;
    }
    consigner(cle, 'indisponible');
  } catch {
    consigner(cle, 'refus');
  }
  return false;
}

export function storageIncidents(): readonly StorageIncident[] {
  return [...journal];
}

export function clearStorageIncidents(): void {
  journal.length = 0;
}

export function removeKey(cle: string): void {
  try {
    stockageLocal()?.removeItem(cle);
  } catch {
    return;
  }
}
