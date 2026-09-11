import { buildDeckState } from '../../../testing/factories/cours.factory';
import { sansStockageLocal, saturationDuStockage } from '../../../testing/sans-stockage';
import { clearDeckState, loadDeckState, saveDeckState } from './state';
import { clearStorageIncidents, storageIncidents } from './storage';

describe('state', () => {
  beforeEach(() => {
    clearDeckState('b1-09-interets-composes');
    clearDeckState('b1-10-fonctions');
    clearStorageIncidents();
  });

  it('retourne null pour un cours jamais ouvert', () => {
    expect(loadDeckState('b1-09-interets-composes')).toBeNull();
  });

  it('sauvegarde et recharge un etat', () => {
    saveDeckState(buildDeckState({ ecranCourant: 5 }));
    expect(loadDeckState('b1-09-interets-composes')?.ecranCourant).toBe(5);
  });

  it('isole les etats de deux cours differents', () => {
    saveDeckState(buildDeckState({ ecranCourant: 5 }));
    saveDeckState(buildDeckState({ coursId: 'b1-10-fonctions', ecranCourant: 2 }));
    expect(loadDeckState('b1-09-interets-composes')?.ecranCourant).toBe(5);
    expect(loadDeckState('b1-10-fonctions')?.ecranCourant).toBe(2);
  });

  it('conserve les reponses deja donnees', () => {
    saveDeckState(buildDeckState({ reponses: { 'Q-CAP-03': 1338.23 } }));
    expect(loadDeckState('b1-09-interets-composes')?.reponses['Q-CAP-03']).toBeCloseTo(1338.23, 5);
  });

  it('oublie un etat efface', () => {
    saveDeckState(buildDeckState());
    clearDeckState('b1-09-interets-composes');
    expect(loadDeckState('b1-09-interets-composes')).toBeNull();
  });

  it('sous saturation du stockage, rend false sans lever et journalise l incident', () => {
    spyOn(globalThis.localStorage, 'setItem').and.throwError(saturationDuStockage());
    expect(saveDeckState(buildDeckState({ ecranCourant: 5 }))).toBe(false);
    expect(storageIncidents().map((incident) => incident.cause)).toEqual(['refus']);
  });

  it('sous stockage absent, rend false sans lever et journalise l incident', () => {
    sansStockageLocal(() => {
      expect(saveDeckState(buildDeckState({ ecranCourant: 5 }))).toBe(false);
      expect(storageIncidents().map((incident) => incident.cause)).toEqual(['indisponible']);
    });
  });
});
