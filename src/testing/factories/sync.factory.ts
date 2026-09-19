import type { CreateurFlux } from '../../app/features/cours/cours-flux.token';
import type { ResultatsSeance } from '../../cours/content/types';
import type {
  EtatSession,
  ResultatsListener,
  StatutFlux,
  StatutListener,
  Sync,
  SyncListener,
} from '../../cours/runtime/core/sync';

export interface FluxDouble {
  readonly fabrique: jasmine.Spy<CreateurFlux>;
  readonly flux: jasmine.SpyObj<Sync>;
  diffuser(etat: Partial<EtatSession>): void;
  diffuserResultats(resultats: ResultatsSeance): void;
  diffuserStatut(statut: StatutFlux): void;
}

function buildEtatSession(overrides: Partial<EtatSession>): EtatSession {
  return {
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    participants: 3,
    revision: 0,
    pilotage: {},
    ...overrides,
  };
}

function ecouter<T>(ecoutes: T[]): (ecoute: T) => () => void {
  return (ecoute) => {
    ecoutes.push(ecoute);
    return () => undefined;
  };
}

export function createFluxDouble(): FluxDouble {
  const ecoutes: SyncListener[] = [];
  const ecoutesResultats: ResultatsListener[] = [];
  const ecoutesStatut: StatutListener[] = [];
  const flux = jasmine.createSpyObj<Sync>('Sync', [
    'join',
    'ouvrir',
    'submit',
    'onState',
    'onResultats',
    'onStatut',
    'close',
  ]);
  flux.onState.and.callFake(ecouter(ecoutes));
  flux.onResultats.and.callFake(ecouter(ecoutesResultats));
  flux.onStatut.and.callFake(ecouter(ecoutesStatut));
  return {
    fabrique: jasmine.createSpy<CreateurFlux>('creerFlux').and.returnValue(flux),
    flux,
    diffuser: (etat) => {
      const complet = buildEtatSession(etat);
      for (const ecoute of ecoutes) {
        ecoute(complet);
      }
    },
    diffuserResultats: (resultats) => {
      for (const ecoute of ecoutesResultats) {
        ecoute(resultats);
      }
    },
    diffuserStatut: (statut) => {
      for (const ecoute of ecoutesStatut) {
        ecoute(statut);
      }
    },
  };
}
