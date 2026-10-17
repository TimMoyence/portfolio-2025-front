import {
  horlogesDeSaisie,
  sousHorlogeArreteeA,
  UNE_HEURE_MS,
} from '../../../testing/horloge-simulee';
import { dureeMonotoneDepuis, instantMonotone } from './duree';

describe('duree', () => {
  it('mesure une duree sur l horloge monotone, quel que soit le saut de l horloge murale', () => {
    const horloges = horlogesDeSaisie();
    const debut = instantMonotone();

    horloges.saisirPendant(20_000);

    expect(dureeMonotoneDepuis(debut)).toBe(20_000);
  });

  it('rend une duree entiere et jamais negative', () => {
    const horloges = horlogesDeSaisie();
    const debut = instantMonotone();

    expect(dureeMonotoneDepuis(debut + 500)).toBe(0);
    horloges.saisirPendant(1_200.6);
    expect(dureeMonotoneDepuis(debut)).toBe(1_201);
  });

  describe('sous l horloge simulee', () => {
    const horloge = sousHorlogeArreteeA(new Date('2026-10-16T08:00:00Z'));

    it('rend les millisecondes écoulées depuis le debut', () => {
      const debut = instantMonotone();
      jasmine.clock().tick(4200);

      expect(dureeMonotoneDepuis(debut)).toBe(4200);
    });

    it('rend la duree ecoulee quand l horloge recule de plus que cette duree', () => {
      const debut = instantMonotone();
      jasmine.clock().tick(300);
      horloge.reculerDe(1000);

      expect(dureeMonotoneDepuis(debut)).toBe(300);
    });

    it('ne retranche pas le recul de l horloge du poste de la duree ecoulee', () => {
      const debut = instantMonotone();
      jasmine.clock().tick(4200);
      horloge.reculerDe(UNE_HEURE_MS);

      expect(dureeMonotoneDepuis(debut)).toBe(4200);
    });
  });
});
