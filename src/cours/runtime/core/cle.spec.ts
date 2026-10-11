import { MOTIF_UUID_V4, sansRandomUuid } from '../../../testing/sans-random-uuid';
import { creerCle } from './cle';

describe('creerCle', () => {
  it('forme un identifiant UUID v4, different a chaque appel', () => {
    const cle = creerCle();

    expect(cle).toMatch(MOTIF_UUID_V4);
    expect(creerCle()).not.toBe(cle);
  });

  it('forme encore un UUID v4 quand crypto.randomUUID manque', () => {
    expect(sansRandomUuid(creerCle)).toMatch(MOTIF_UUID_V4);
  });
});
