import type { CreateurFlux } from '../../app/features/cours/cours-flux.token';
import type { ResultatsSeance } from '../../cours/content/types';
import type {
  EtatSession,
  RaisonDeFin,
  ResultatsDuFlux,
  StatutFlux,
  Sync,
} from '../../cours/runtime/core/sync';

export interface FluxDouble {
  readonly fabrique: jasmine.Spy<CreateurFlux>;
  readonly flux: jasmine.SpyObj<Sync>;
  diffuser(etat: Partial<EtatSession>): void;
  diffuserResultats(resultats: ResultatsSeance & Partial<ResultatsDuFlux>): void;
  diffuserStatut(statut: StatutFlux): void;
  diffuserFin(raison: RaisonDeFin | null): void;
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

interface Auditoire<T> {
  readonly ecouter: (ecoute: (valeur: T) => void) => () => void;
  readonly diffuser: (valeur: T) => void;
}

function auditoire<T>(): Auditoire<T> {
  const ecoutes: ((valeur: T) => void)[] = [];
  return {
    ecouter: (ecoute) => {
      ecoutes.push(ecoute);
      return () => undefined;
    },
    diffuser: (valeur) => {
      for (const ecoute of ecoutes) {
        ecoute(valeur);
      }
    },
  };
}

export function createFluxDouble(): FluxDouble {
  const etats = auditoire<EtatSession>();
  const resultats = auditoire<ResultatsDuFlux>();
  const statuts = auditoire<StatutFlux>();
  const fins = auditoire<RaisonDeFin | null>();
  const flux = jasmine.createSpyObj<Sync>('Sync', [
    'ouvrir',
    'onState',
    'onResultats',
    'onStatut',
    'onFin',
    'close',
  ]);
  flux.onState.and.callFake(etats.ecouter);
  flux.onResultats.and.callFake(resultats.ecouter);
  flux.onStatut.and.callFake(statuts.ecouter);
  flux.onFin.and.callFake(fins.ecouter);
  return {
    fabrique: jasmine.createSpy<CreateurFlux>('creerFlux').and.returnValue(flux),
    flux,
    diffuser: (etat) => etats.diffuser(buildEtatSession(etat)),
    diffuserResultats: (partiels) =>
      resultats.diffuser({ jalons: {}, enigmes: [], bareme: null, ...partiels }),
    diffuserStatut: statuts.diffuser,
    diffuserFin: fins.diffuser,
  };
}
