import { buildDeckState } from '../../../testing/factories/cours.factory';
import { clearDeckState, loadDeckState, saveDeckState } from './state';

describe('state', () => {
  beforeEach(() => {
    clearDeckState('b1-09-interets-composes');
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
});
