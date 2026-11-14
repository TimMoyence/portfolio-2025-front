import type { TypeDIncident as IncidentType } from '../../../../../contrat/types.gen';
import type { RegimeVerrou } from '../../../content/types';
import { abonner, diffuserA } from '../saisie/ecoutes';

export type { TypeDIncident as IncidentType } from '../../../../../contrat/types.gen';

export interface Incident {
  type: IncidentType;
  horodatage: string;
}

export type IncidentListener = (incident: Incident) => void;

export interface Lock {
  arm(): void;
  disarm(): void;
  incidents(): readonly Incident[];
  onIncident(listener: IncidentListener): () => void;
}

type Nettoyeur = () => void;

const CAPACITE_JOURNAL_MAX = 200;

function ecouter(cible: EventTarget, type: string, ecouteur: EventListener): Nettoyeur {
  cible.addEventListener(type, ecouteur);
  return () => cible.removeEventListener(type, ecouteur);
}

function environnementNavigateurDisponible(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

export function createLock(regime: RegimeVerrou): Lock {
  const ecoutes = new Set<IncidentListener>();
  const journal: Incident[] = [];
  let estArme = false;
  let nettoyeurs: Nettoyeur[] = [];

  const consigner = (type: IncidentType): void => {
    const incident: Incident = { type, horodatage: new Date().toISOString() };
    journal.push(incident);
    if (journal.length > CAPACITE_JOURNAL_MAX) {
      journal.shift();
    }
    diffuserA(ecoutes, incident);
  };

  const surVisibilite = (): void => {
    if (document.hidden) {
      consigner('tab_hidden');
    }
  };

  const surPerteFocus = (): void => {
    consigner('window_blur');
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
      return abonner(ecoutes, listener);
    },
  };
}
