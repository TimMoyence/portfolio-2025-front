import { refuseLaSession } from './statuts-http';

describe('refuseLaSession', () => {
  it('voit un refus de session dans un 401 ou un 403', () => {
    expect(refuseLaSession(401)).toBeTrue();
    expect(refuseLaSession(403)).toBeTrue();
  });

  it('ne voit pas de refus de session dans un autre statut ni sans statut', () => {
    for (const statut of [null, 0, 400, 404, 429, 500]) {
      expect(refuseLaSession(statut)).withContext(String(statut)).toBeFalse();
    }
  });
});
