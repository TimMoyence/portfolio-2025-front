export function readJson<T>(cle: string): T | null {
  try {
    const brut = globalThis.localStorage?.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(cle: string, valeur: unknown): void {
  try {
    globalThis.localStorage?.setItem(cle, JSON.stringify(valeur));
  } catch {
    return;
  }
}

export function removeKey(cle: string): void {
  try {
    globalThis.localStorage?.removeItem(cle);
  } catch {
    return;
  }
}
