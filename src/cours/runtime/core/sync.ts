import type { FreeRange, PacingMode } from '../../content/types';
import type { Identity } from './identity';
import { enqueue } from './queue';

export type StatutSession = 'attente' | 'en_cours' | 'terminee';

export interface EtatSession {
  etat: StatutSession;
  modeRythme: PacingMode;
  ecranCourant: number;
  intervalleLibre: FreeRange | null;
  participants: number;
}

export type SyncListener = (etat: EtatSession) => void;

export interface SyncOptions {
  baseUrl: string;
  sessionId: string;
  creerSource?: (url: string) => EventSource;
}

export interface Sync {
  join(identite: Identity): void;
  submit(questionId: string, valeur: unknown, dureeMs: number): void;
  onState(listener: SyncListener): () => void;
  close(): void;
}

const DELAI_INITIAL_MS = 1000;
const DELAI_MAX_MS = 30000;

const STATUTS_VALIDES: readonly StatutSession[] = ['attente', 'en_cours', 'terminee'];
const MODES_RYTHME_VALIDES: readonly PacingMode[] = ['pilote', 'libre'];

function estMembre<T extends string>(valeurs: readonly T[], valeur: unknown): valeur is T {
  return typeof valeur === 'string' && (valeurs as readonly string[]).includes(valeur);
}

function estFreeRange(valeur: unknown): valeur is FreeRange {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return typeof candidat['premier'] === 'number' && typeof candidat['dernier'] === 'number';
}

function estEtatSession(valeur: unknown): valeur is EtatSession {
  if (typeof valeur !== 'object' || valeur === null) {
    return false;
  }
  const candidat = valeur as Record<string, unknown>;
  return (
    estMembre(STATUTS_VALIDES, candidat['etat']) &&
    estMembre(MODES_RYTHME_VALIDES, candidat['modeRythme']) &&
    typeof candidat['ecranCourant'] === 'number' &&
    typeof candidat['participants'] === 'number' &&
    (candidat['intervalleLibre'] === null || estFreeRange(candidat['intervalleLibre']))
  );
}

function parseCharge(brut: Event): unknown {
  try {
    return JSON.parse((brut as MessageEvent).data);
  } catch {
    return null;
  }
}

function fabriqueParDefaut(): ((url: string) => EventSource) | null {
  if (typeof EventSource === 'undefined') {
    return null;
  }
  return (url: string) => new EventSource(url);
}

export function createSync(options: SyncOptions): Sync {
  const fabrique = options.creerSource ?? fabriqueParDefaut();
  const ecoutes = new Set<SyncListener>();

  let source: EventSource | null = null;
  let identite: Identity | null = null;
  let ferme = false;
  let delai = DELAI_INITIAL_MS;
  let relanceId: ReturnType<typeof setTimeout> | null = null;

  const urlFlux = (): string =>
    `${options.baseUrl}/sessions/${encodeURIComponent(options.sessionId)}/stream`;

  const detruireSource = (): void => {
    source?.close();
    source = null;
  };

  const annulerRelance = (): void => {
    if (relanceId !== null) {
      clearTimeout(relanceId);
      relanceId = null;
    }
  };

  const planifierRelance = (): void => {
    if (ferme) {
      return;
    }
    const delaiCourant = delai;
    delai = Math.min(delai * 2, DELAI_MAX_MS);
    annulerRelance();
    relanceId = setTimeout(() => {
      relanceId = null;
      ouvrir();
    }, delaiCourant);
  };

  const onEtat = (event: Event): void => {
    const charge = parseCharge(event);
    if (!estEtatSession(charge)) {
      return;
    }
    for (const ecoute of ecoutes) {
      ecoute(charge);
    }
  };

  const onHeartbeat = (): void => {
    delai = DELAI_INITIAL_MS;
  };

  const onFin = (): void => {
    ferme = true;
    annulerRelance();
    detruireSource();
  };

  function ouvrir(): void {
    if (ferme || !fabrique) {
      return;
    }
    const nouvelleSource = fabrique(urlFlux());
    source = nouvelleSource;
    nouvelleSource.addEventListener('etat', onEtat);
    nouvelleSource.addEventListener('heartbeat', onHeartbeat);
    nouvelleSource.addEventListener('fin', onFin);
    nouvelleSource.onopen = () => {
      delai = DELAI_INITIAL_MS;
    };
    nouvelleSource.onerror = () => {
      nouvelleSource.close();
      if (source === nouvelleSource) {
        source = null;
      }
      planifierRelance();
    };
  }

  return {
    join(nouvelleIdentite) {
      identite = nouvelleIdentite;
      annulerRelance();
      detruireSource();
      delai = DELAI_INITIAL_MS;
      ferme = false;
      ouvrir();
    },
    submit(questionId, valeur, dureeMs) {
      if (!identite) {
        throw new Error("Rejoignez la session avant d'envoyer une réponse");
      }
      enqueue({
        sessionId: options.sessionId,
        studentKey: identite.studentKey,
        questionId,
        valeur,
        dureeMs,
        horodatage: new Date().toISOString(),
      });
    },
    onState(listener) {
      ecoutes.add(listener);
      return () => {
        ecoutes.delete(listener);
      };
    },
    close() {
      ferme = true;
      annulerRelance();
      detruireSource();
    },
  };
}
