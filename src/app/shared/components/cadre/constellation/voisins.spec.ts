import fc from 'fast-check';
import { opaciteDuTrait, traitsParGrille, type Position } from './voisins';

const paires = (positions: readonly Position[]): string[] =>
  traitsParGrille(positions)
    .map(({ a, b }) => `${Math.min(a, b)}-${Math.max(a, b)}`)
    .sort((gauche, droite) => gauche.localeCompare(droite));

const deuxADeux = (positions: readonly Position[]): string[] => {
  const attendues: string[] = [];
  positions.forEach((premier, i) =>
    positions.slice(i + 1).forEach((second, decalage) => {
      if (Math.hypot(premier.x - second.x, premier.y - second.y) < 166) {
        attendues.push(`${i}-${i + 1 + decalage}`);
      }
    }),
  );
  return attendues.sort((gauche, droite) => gauche.localeCompare(droite));
};

describe('CON-02 · un trait relie deux points à moins de 166 px, plus visible quand ils sont proches', () => {
  for (const [distance, opacite] of [
    [0, 0.43],
    [100, (66 / 166) * 0.43],
    [166, 0],
    [166.01, 0],
  ] as const) {
    it(`CON-02 · à ${distance} px, l opacité vaut ${opacite.toFixed(5)}`, () => {
      expect(opaciteDuTrait(distance)).toBeCloseTo(opacite, 5);
    });
  }

  it('CON-02 · deux points à 166 px ne sont pas reliés, à 165 px ils le sont', () => {
    expect(
      paires([
        { x: 0, y: 0 },
        { x: 166, y: 0 },
      ]),
    ).toEqual([]);
    expect(
      paires([
        { x: -20, y: 0 },
        { x: 145, y: 0 },
      ]),
    ).toEqual(['0-1']);
  });
});

describe('CON-08 · la grille trouve exactement les traits de la comparaison deux à deux', () => {
  it('CON-08 · pour tout nuage de points dans la fenêtre élargie de 20 px', () => {
    const position = fc.record({
      x: fc.double({ min: -20, max: 1940, noNaN: true }),
      y: fc.double({ min: -20, max: 1100, noNaN: true }),
    });
    fc.assert(
      fc.property(fc.array(position, { maxLength: 96 }), (positions) => {
        expect(paires(positions)).toEqual(deuxADeux(positions));
      }),
      { numRuns: 300 },
    );
  });
});
