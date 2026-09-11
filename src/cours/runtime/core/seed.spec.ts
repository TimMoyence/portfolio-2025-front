import { createRng, pickInt, seedFromKey, shuffleWithSeed } from './seed';

const CLE_THEO = '7f3a91c2-4e5b-4d6a-9c8e-1b2f3a4d5e6f';
const CLE_LEA = '2c8d40ab-9f1e-4a37-8b5c-6d7e8f9a0b1c';

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

describe('seedFromKey', () => {
  it('rend la meme graine pour une meme cle etudiant', () => {
    expect(seedFromKey(CLE_THEO)).toBe(seedFromKey(CLE_THEO));
  });

  it('rend des graines differentes pour deux cles etudiant differentes', () => {
    expect(seedFromKey(CLE_THEO)).not.toBe(seedFromKey(CLE_LEA));
  });

  it('rend un entier positif utilisable comme attribut seed', () => {
    for (const cle of [CLE_THEO, CLE_LEA, 'a', '']) {
      const graine = seedFromKey(cle);
      expect(Number.isInteger(graine)).toBe(true);
      expect(graine).toBeGreaterThanOrEqual(0);
    }
  });

  it('donne des ordres d options differents a deux etudiants de la meme salle', () => {
    const options = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(shuffleWithSeed(options, seedFromKey(CLE_THEO))).not.toEqual(
      shuffleWithSeed(options, seedFromKey(CLE_LEA)),
    );
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
