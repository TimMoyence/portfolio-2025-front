import { telephoneFacultatif } from './telephone.utils';

describe('telephoneFacultatif', () => {
  it('rend null pour un telephone absent, vide ou blanc', () => {
    expect([undefined, null, '', '   '].map(telephoneFacultatif)).toEqual([null, null, null, null]);
  });

  it('rend un telephone renseigne sans ses espaces de bord', () => {
    expect(telephoneFacultatif(' +33 6 12 34 56 78 ')).toBe('+33 6 12 34 56 78');
  });
});
