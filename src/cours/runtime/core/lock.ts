export type LockRegime = 'ouvert' | 'focus' | 'examen';

export type IncidentType =
  | 'visibility'
  | 'blur'
  | 'copy'
  | 'paste'
  | 'contextmenu'
  | 'blocked_shortcut'
  | 'devtools_key'
  | 'fast_answer';

export interface Incident {
  type: IncidentType;
  horodatage: string;
  detail?: Readonly<Record<string, unknown>>;
}

export type IncidentListener = (incident: Incident) => void;

export interface LockOptions {
  seuilReponseRapideMs?: number;
}

export interface Lock {
  arm(): void;
  disarm(): void;
  incidents(): readonly Incident[];
  onIncident(listener: IncidentListener): () => void;
  recordAnswerDuration(dureeMs: number): void;
}

type Nettoyeur = () => void;

const CAPACITE_JOURNAL_MAX = 200;
const SEUIL_REPONSE_RAPIDE_MS_DEFAUT = 1200;
const TOUCHES_BLOQUEES: readonly string[] = ['p', 's', 'u'];

function ecouter(cible: EventTarget, type: string, ecouteur: EventListener): Nettoyeur {
  cible.addEventListener(type, ecouteur);
  return () => cible.removeEventListener(type, ecouteur);
}

function environnementNavigateurDisponible(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

export function createLock(regime: LockRegime, options: LockOptions = {}): Lock {
  const seuilReponseRapideMs = options.seuilReponseRapideMs ?? SEUIL_REPONSE_RAPIDE_MS_DEFAUT;
  const ecoutes = new Set<IncidentListener>();
  const journal: Incident[] = [];
  let estArme = false;
  let nettoyeurs: Nettoyeur[] = [];

  const consigner = (type: IncidentType, detail?: Readonly<Record<string, unknown>>): void => {
    const incident: Incident =
      detail === undefined
        ? { type, horodatage: new Date().toISOString() }
        : { type, horodatage: new Date().toISOString(), detail };
    journal.push(incident);
    if (journal.length > CAPACITE_JOURNAL_MAX) {
      journal.shift();
    }
    for (const ecoute of ecoutes) {
      ecoute(incident);
    }
  };

  const surVisibilite = (): void => {
    if (document.hidden) {
      consigner('visibility');
    }
  };

  const surPerteFocus = (): void => {
    consigner('blur');
  };

  const bloquerEtConsigner =
    (type: IncidentType) =>
    (event: Event): void => {
      event.preventDefault();
      consigner(type);
    };

  const surTouche = (event: Event): void => {
    const clavier = event as KeyboardEvent;
    if (clavier.key === 'F12') {
      consigner('devtools_key');
      return;
    }
    const touche = clavier.key.toLowerCase();
    if ((clavier.ctrlKey || clavier.metaKey) && TOUCHES_BLOQUEES.includes(touche)) {
      clavier.preventDefault();
      consigner('blocked_shortcut', { touche });
    }
  };

  return {
    arm(): void {
      if (estArme || regime === 'ouvert' || !environnementNavigateurDisponible()) {
        return;
      }
      estArme = true;
      nettoyeurs = [
        ecouter(document, 'visibilitychange', surVisibilite),
        ecouter(window, 'blur', surPerteFocus),
      ];
      if (regime === 'examen') {
        nettoyeurs.push(
          ecouter(document, 'copy', bloquerEtConsigner('copy')),
          ecouter(document, 'paste', bloquerEtConsigner('paste')),
          ecouter(document, 'contextmenu', bloquerEtConsigner('contextmenu')),
          ecouter(document, 'keydown', surTouche),
        );
      }
    },
    disarm(): void {
      for (const retirer of nettoyeurs) {
        retirer();
      }
      nettoyeurs = [];
      estArme = false;
    },
    incidents(): readonly Incident[] {
      return [...journal];
    },
    onIncident(listener: IncidentListener): () => void {
      ecoutes.add(listener);
      return () => {
        ecoutes.delete(listener);
      };
    },
    recordAnswerDuration(dureeMs: number): void {
      if (!estArme || regime !== 'examen') {
        return;
      }
      if (dureeMs < seuilReponseRapideMs) {
        consigner('fast_answer', { dureeMs });
      }
    },
  };
}
