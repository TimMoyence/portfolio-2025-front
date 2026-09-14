import type { CreateurFlux } from '../../app/features/cours/cours-flux.token';
import type { ResultatsSeance } from '../../cours/content/types';
import type {
  EtatSession,
  ResultatsListener,
  Sync,
  SyncListener,
} from '../../cours/runtime/core/sync';

export interface FluxDouble {
  readonly fabrique: jasmine.Spy<CreateurFlux>;
  readonly flux: jasmine.SpyObj<Sync>;
  diffuser(etat: Partial<EtatSession>): void;
  diffuserResultats(resultats: ResultatsSeance): void;
}

function buildEtatSession(overrides: Partial<EtatSession>): EtatSession {
  return {
    etat: 'en_cours',
    modeRythme: 'pilote',
    ecranCourant: 0,
    intervalleLibre: null,
    participants: 3,
    ...overrides,
  };
}

export function createFluxDouble(): FluxDouble {
  const ecoutes: SyncListener[] = [];
  const ecoutesResultats: ResultatsListener[] = [];
  const flux = jasmine.createSpyObj<Sync>('Sync', [
    'join',
    'ouvrir',
    'submit',
    'onState',
    'onResultats',
    'close',
  ]);
  flux.onState.and.callFake((ecoute) => {
    ecoutes.push(ecoute);
    return () => undefined;
  });
  flux.onResultats.and.callFake((ecoute) => {
    ecoutesResultats.push(ecoute);
    return () => undefined;
  });
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
  };
}
