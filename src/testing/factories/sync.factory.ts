import type { CreateurFlux } from '../../app/features/cours/cours-flux.token';
import { abonner, diffuserA, type Ecoute } from '../../cours/runtime/core/ecoutes';
import type {
  EtatSession,
  RaisonDeFin,
  ResultatsDuFlux,
  StatutFlux,
  Sync,
} from '../../cours/runtime/core/sync';
import { buildResultatsDuFlux } from './formations.factory';

export interface FluxDouble {
  readonly fabrique: jasmine.Spy<CreateurFlux>;
  readonly flux: jasmine.SpyObj<Sync>;
  diffuser(etat: Partial<EtatSession>): void;
  diffuserResultats(resultats: Partial<ResultatsDuFlux>): void;
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
    majLe: '2026-09-19T08:00:00.000Z',
    ...overrides,
  };
}

export function createFluxDouble(): FluxDouble {
  const etats = new Set<Ecoute<EtatSession>>();
  const resultats = new Set<Ecoute<ResultatsDuFlux>>();
  const statuts = new Set<Ecoute<StatutFlux>>();
  const fins = new Set<Ecoute<RaisonDeFin | null>>();
  const flux = jasmine.createSpyObj<Sync>('Sync', [
    'ouvrir',
    'onState',
    'onResultats',
    'onStatut',
    'onFin',
    'close',
  ]);
  flux.onState.and.callFake((ecoute) => abonner(etats, ecoute));
  flux.onResultats.and.callFake((ecoute) => abonner(resultats, ecoute));
  flux.onStatut.and.callFake((ecoute) => abonner(statuts, ecoute));
  flux.onFin.and.callFake((ecoute) => abonner(fins, ecoute));
  return {
    fabrique: jasmine.createSpy<CreateurFlux>('creerFlux').and.returnValue(flux),
    flux,
    diffuser: (etat) => diffuserA(etats, buildEtatSession(etat)),
    diffuserResultats: (partiels) => diffuserA(resultats, buildResultatsDuFlux(partiels)),
    diffuserStatut: (statut) => diffuserA(statuts, statut),
    diffuserFin: (raison) => diffuserA(fins, raison),
  };
}
