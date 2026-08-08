import { getWeatherDescription } from './weather-descriptions';

const DESCRIPTION_BY_CODE: readonly (readonly [number, string])[] = [
  [0, 'Ciel dégagé'],
  [1, 'Principalement dégagé'],
  [2, 'Partiellement nuageux'],
  [3, 'Couvert'],
  [45, 'Brouillard'],
  [48, 'Brouillard givrant'],
  [51, 'Bruine légère'],
  [55, 'Bruine dense'],
  [56, 'Bruine verglaçante légère'],
  [57, 'Bruine verglaçante dense'],
  [61, 'Pluie légère'],
  [63, 'Pluie modérée'],
  [65, 'Pluie forte'],
  [66, 'Pluie verglaçante légère'],
  [67, 'Pluie verglaçante forte'],
  [71, 'Neige légère'],
  [75, 'Neige forte'],
  [77, 'Grains de neige'],
  [80, 'Averses légères'],
  [82, 'Averses violentes'],
  [85, 'Averses de neige légères'],
  [86, 'Averses de neige fortes'],
  [95, 'Orage'],
  [99, 'Orage avec grêle forte'],
  [10, 'Conditions inconnues'],
  [44, 'Conditions inconnues'],
  [999, 'Conditions inconnues'],
];

const STANDARD_WMO_CODES = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
  95, 96, 99,
];

describe('getWeatherDescription', () => {
  for (const [code, expected] of DESCRIPTION_BY_CODE) {
    it(`devrait retourner « ${expected} » pour le code ${code}`, () => {
      expect(getWeatherDescription(code)).toBe(expected);
    });
  }

  it('devrait retourner une description non vide pour tous les codes WMO standards', () => {
    for (const code of STANDARD_WMO_CODES) {
      expect(getWeatherDescription(code)).toBeTruthy();
    }
  });
});
