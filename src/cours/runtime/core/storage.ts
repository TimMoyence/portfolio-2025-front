function stockageLocal(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
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

export function removeKey(cle: string): void {
  try {
    stockageLocal()?.removeItem(cle);
  } catch {
    return;
  }
}
