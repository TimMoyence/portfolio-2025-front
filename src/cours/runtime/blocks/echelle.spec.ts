import { echelle, jalons } from './echelle';

describe('echelle', () => {
  it('projette le debut du domaine sur l origine et sa fin sur l origine plus la longueur', () => {
    const versX = echelle(10, 20, 40, 200);

    expect(versX(10)).toBe(40);
    expect(versX(20)).toBe(140);
    expect(versX(30)).toBe(240);
  });

  it('retourne l axe quand la longueur est negative', () => {
    const versY = echelle(0, 100, 300, -250);

    expect(versY(0)).toBe(300);
    expect(versY(100)).toBe(50);
  });

  it('traite une etendue nulle comme une etendue unitaire', () => {
    expect(echelle(5, 0, 0, 100)(6)).toBe(100);
  });
});

describe('jalons', () => {
  it('repartit intervalles + 1 jalons reguliers du depart a l arrivee', () => {
    expect(jalons(0, 10, 4)).toEqual([0, 2.5, 5, 7.5, 10]);
  });
});
