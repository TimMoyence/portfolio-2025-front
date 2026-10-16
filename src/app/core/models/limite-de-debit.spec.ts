import { laPlusLongue } from './limite-de-debit';

describe('laPlusLongue', () => {
  it('ne rend aucune limite quand aucun envoi n a ete limite', () => {
    expect(laPlusLongue([])).toBeNull();
    expect(laPlusLongue([null, null])).toBeNull();
  });

  it('rend l attente la plus longue des envois limites', () => {
    expect(laPlusLongue([{ minutes: 1 }, null, { minutes: 3 }, { minutes: 2 }])).toEqual({
      minutes: 3,
    });
  });

  it('rend une attente sans duree quand un envoi limite ne la donne pas', () => {
    expect(laPlusLongue([{ minutes: 3 }, { minutes: null }])).toEqual({ minutes: null });
  });
});
