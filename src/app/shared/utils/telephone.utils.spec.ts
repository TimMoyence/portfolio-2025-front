import { estUnNumeroDeTelephone, telephoneFacultatif } from './telephone.utils';

const NUMEROS_ACCEPTES = [
  '+33 6 98 50 32 82',
  '06 98 50 32 82',
  '0033698503282',
  '(01) 23-45.67',
  '123456',
  '+123456789012345',
  ' 0698503282 ',
];

const NUMEROS_REFUSES = [
  '',
  '   ',
  '12345',
  '+1234567890123456',
  '06 98 a0 32 82',
  '++33612345678',
  '00+33612345678',
  '06+98503282',
  '()-. ',
  '06/98/50/32/82',
];

describe('estUnNumeroDeTelephone', () => {
  for (const numero of NUMEROS_ACCEPTES) {
    it(`accepte « ${numero} », comme PhoneNumber du back`, () => {
      expect(estUnNumeroDeTelephone(numero)).toBeTrue();
    });
  }

  for (const numero of NUMEROS_REFUSES) {
    it(`refuse « ${numero} », comme PhoneNumber du back`, () => {
      expect(estUnNumeroDeTelephone(numero)).toBeFalse();
    });
  }
});

describe('telephoneFacultatif', () => {
  it('rend null pour un telephone absent, vide ou blanc', () => {
    expect([undefined, null, '', '   '].map(telephoneFacultatif)).toEqual([null, null, null, null]);
  });

  it('rend un telephone renseigne sans ses espaces de bord', () => {
    expect(telephoneFacultatif(' +33 6 12 34 56 78 ')).toBe('+33 6 12 34 56 78');
  });
});
