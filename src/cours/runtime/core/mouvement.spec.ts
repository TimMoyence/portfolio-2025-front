import { prefereMouvementReduit, REQUETE_MOUVEMENT_REDUIT } from './mouvement';

describe('mouvement', () => {
  it('interroge la preference systeme de mouvement reduit', () => {
    const requete = spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
    } as MediaQueryList);

    expect(prefereMouvementReduit()).toBeTrue();
    expect(requete).toHaveBeenCalledWith(REQUETE_MOUVEMENT_REDUIT);
  });

  it('ne reduit rien quand la preference est absente', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    expect(prefereMouvementReduit()).toBeFalse();
  });
});
