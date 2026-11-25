import {
  ecranASurvol,
  prefereMouvementReduit,
  REQUETE_MOUVEMENT_REDUIT,
  REQUETE_SURVOL,
} from './mouvement';

describe('préférences d écran', () => {
  for (const { nom, lire, requete } of [
    { nom: 'mouvement réduit', lire: prefereMouvementReduit, requete: REQUETE_MOUVEMENT_REDUIT },
    { nom: 'survol', lire: ecranASurvol, requete: REQUETE_SURVOL },
  ]) {
    it(`${nom} : interroge sa requête et rend sa réponse`, () => {
      const interrogation = spyOn(window, 'matchMedia').and.returnValue({
        matches: true,
      } as MediaQueryList);

      expect(lire()).toBeTrue();
      expect(interrogation).toHaveBeenCalledWith(requete);
    });

    it(`${nom} : rend faux quand l écran ne répond pas`, () => {
      spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

      expect(lire()).toBeFalse();
    });
  }

  it('la requête de survol demande un pointeur qui survole', () => {
    expect(REQUETE_SURVOL).toBe('(hover: hover)');
  });
});
