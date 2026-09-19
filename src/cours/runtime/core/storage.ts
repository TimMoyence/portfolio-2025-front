const PREFIXE = 'fp.';
const DELAI_BROUILLON_MS = 1000;
const MOTIF_CLE_BROUILLON = /^fp\.[^.]+\.[^.]+\.fp-[a-z0-9-]+\..+$/;

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

export function persistJson(cle: string, valeur: unknown): boolean {
  try {
    return writeJson(cle, valeur);
  } catch {
    return false;
  }
}

export function removeKey(cle: string): void {
  try {
    stockageLocal()?.removeItem(cle);
  } catch {
    return;
  }
}

function clesDesBrouillons(): string[] {
  const stockage = stockageLocal();
  if (stockage === null) {
    return [];
  }
  try {
    return Array.from({ length: stockage.length }, (_, rang) => stockage.key(rang)).filter(
      (cle): cle is string => cle !== null && MOTIF_CLE_BROUILLON.test(cle),
    );
  } catch {
    return [];
  }
}

export interface Brouillons {
  lire(brique: string, id: string): unknown;
  ecrire(brique: string, id: string, valeur: unknown): void;
  purger(): void;
}

function prefixeDeSeance(sessionId: string, participantId: string): string {
  return `${PREFIXE}${sessionId}.${participantId}.`;
}

export function creerBrouillons(
  sessionId: string,
  participantId: string,
  delaiMs = DELAI_BROUILLON_MS,
): Brouillons {
  const prefixe = prefixeDeSeance(sessionId, participantId);
  const enAttente = new Map<string, ReturnType<typeof setTimeout>>();
  const cle = (brique: string, id: string): string => `${prefixe}${brique}.${id}`;
  return {
    lire: (brique, id) => readJson<unknown>(cle(brique, id)),
    ecrire(brique, id, valeur) {
      const complete = cle(brique, id);
      const precedent = enAttente.get(complete);
      if (precedent !== undefined) {
        clearTimeout(precedent);
      }
      enAttente.set(
        complete,
        setTimeout(() => {
          enAttente.delete(complete);
          persistJson(complete, valeur);
        }, delaiMs),
      );
    },
    purger() {
      for (const minuteur of enAttente.values()) {
        clearTimeout(minuteur);
      }
      enAttente.clear();
      for (const existante of clesDesBrouillons()) {
        if (existante.startsWith(prefixe)) {
          removeKey(existante);
        }
      }
    },
  };
}

export function purgerLesAutresBrouillons(sessionId: string, participantId: string): void {
  const prefixe = prefixeDeSeance(sessionId, participantId);
  for (const existante of clesDesBrouillons()) {
    if (!existante.startsWith(prefixe)) {
      removeKey(existante);
    }
  }
}
