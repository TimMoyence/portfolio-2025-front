import { createRng, pickInt, shuffleWithSeed } from './seed';

describe('createRng', () => {
  it('produit la meme suite pour une meme graine', () => {
    const gauche = createRng(1001);
    const droite = createRng(1001);
    expect([gauche(), gauche(), gauche()]).toEqual([droite(), droite(), droite()]);
  });

  it('produit des suites differentes pour des graines differentes', () => {
    expect(createRng(1001)()).not.toBe(createRng(1002)());
  });

  it('reste dans l intervalle zero un', () => {
    const rng = createRng(42);
    for (let index = 0; index < 100; index += 1) {
      const valeur = rng();
      expect(valeur).toBeGreaterThanOrEqual(0);
      expect(valeur).toBeLessThan(1);
    }
  });
});

describe('shuffleWithSeed', () => {
  it('melange de facon deterministe', () => {
    const source = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffleWithSeed(source, 1001)).toEqual(shuffleWithSeed(source, 1001));
  });

  it('melange differemment selon la graine', () => {
    const source = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(shuffleWithSeed(source, 1001)).not.toEqual(shuffleWithSeed(source, 1002));
  });

  it('ne modifie pas le tableau source', () => {
    const source = ['a', 'b', 'c'];
    shuffleWithSeed(source, 1001);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('conserve tous les elements', () => {
    const source = ['a', 'b', 'c', 'd'];
    expect(
      shuffleWithSeed(source, 7).sort((gauche, droite) => gauche.localeCompare(droite)),
    ).toEqual(source);
  });

  it('gere un tableau vide', () => {
    expect(shuffleWithSeed([], 1001)).toEqual([]);
  });
});

describe('pickInt', () => {
  it('reste dans les bornes incluses', () => {
    const rng = createRng(1001);
    for (let index = 0; index < 200; index += 1) {
      const valeur = pickInt(rng, 5, 9);
      expect(valeur).toBeGreaterThanOrEqual(5);
      expect(valeur).toBeLessThanOrEqual(9);
    }
  });

  it('retourne la borne quand min egale max', () => {
    expect(pickInt(createRng(1), 3, 3)).toBe(3);
  });
});
