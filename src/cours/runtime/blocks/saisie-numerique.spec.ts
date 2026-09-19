import { lireNombreSaisi } from './saisie-numerique';

const ACCEPTES: readonly [string, number][] = [
  ['12', 12],
  ['12,5', 12.5],
  ['12.5', 12.5],
  ['1 234', 1234],
  ['1 234,75', 1234.75],
  ['  42  ', 42],
  ['-3,5', -3.5],
  ['−3,5', -3.5],
  ['+.5', 0.5],
  ['.5', 0.5],
];

const REFUSES: readonly string[] = [
  '',
  '   ',
  '1.2.3',
  '1,2,3',
  '1e3',
  '1E3',
  '12%',
  '12 €',
  'douze',
  '--3',
  '1/2',
  '0x10',
  'Infinity',
  'NaN',
  '1,',
  ',',
];

describe('lecture d’une saisie numérique de tableur', () => {
  for (const [saisie, attendu] of ACCEPTES) {
    it(`lit « ${saisie} » comme ${attendu}`, () => {
      expect(lireNombreSaisi(saisie)).toBe(attendu);
    });
  }

  for (const saisie of REFUSES) {
    it(`refuse « ${saisie} » au lieu de rendre un nombre approximatif`, () => {
      expect(lireNombreSaisi(saisie)).toBeNull();
    });
  }
});
