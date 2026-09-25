import { DUREE_ETAPE_MS, caler, jouerSuite, suiteVersLeMaximum } from './animation';
import type { ParametreReglable } from './curseurs';
import { sousHorlogeSimulee } from '../../../testing/horloge-simulee';

const TAUX: ParametreReglable = {
  cle: 'taux',
  libelle: 'Taux (%)',
  min: 10,
  max: 30,
  pas: 2,
  defaut: 16,
};

describe('animation des curseurs', () => {
  describe('caler', () => {
    it('ramène une valeur sur le pas le plus proche, dans les bornes', () => {
      expect(caler(TAUX, 17.2)).toBe(18);
      expect(caler(TAUX, 5)).toBe(10);
      expect(caler(TAUX, 99)).toBe(30);
      expect(caler(TAUX, Number.NaN)).toBe(10);
    });
  });

  describe('suiteVersLeMaximum', () => {
    it('mène chaque curseur de sa valeur courante à son maximum en six changements calés', () => {
      expect(suiteVersLeMaximum([TAUX], { taux: 16 })).toEqual([
        { taux: 18 },
        { taux: 20 },
        { taux: 24 },
        { taux: 26 },
        { taux: 28 },
        { taux: 30 },
      ]);
    });

    it('ne rejoue pas deux fois la même valeur quand l écart est plus court que six pas', () => {
      expect(suiteVersLeMaximum([TAUX], { taux: 26 })).toEqual([{ taux: 28 }, { taux: 30 }]);
    });
  });

  describe('jouerSuite', () => {
    const SUITE = [{ taux: 16 }, { taux: 20 }, { taux: 24 }];
    let appliquees: Readonly<Record<string, number>>[];
    const appliquer = (etape: Readonly<Record<string, number>>): void => {
      appliquees.push(etape);
    };

    sousHorlogeSimulee(() => {
      appliquees = [];
    });

    it('laisse trois secondes entre deux changements de valeur', () => {
      expect(DUREE_ETAPE_MS).toBe(3000);

      jouerSuite(SUITE, appliquer, false);
      expect(appliquees).toEqual([{ taux: 16 }]);

      jasmine.clock().tick(2999);
      expect(appliquees).toEqual([{ taux: 16 }]);

      jasmine.clock().tick(1);
      expect(appliquees).toEqual([{ taux: 16 }, { taux: 20 }]);

      jasmine.clock().tick(3000);
      expect(appliquees).toEqual(SUITE);

      jasmine.clock().tick(30000);
      expect(appliquees).toEqual(SUITE);
    });

    it('s arrête sur demande sans appliquer l étape attendue', () => {
      const arreter = jouerSuite(SUITE, appliquer, false);

      jasmine.clock().tick(1000);
      arreter();
      jasmine.clock().tick(10000);

      expect(appliquees).toEqual([{ taux: 16 }]);
    });

    it('va directement à l état final quand le mouvement est réduit', () => {
      jouerSuite([{ depart: 100, taux: 0 }, { taux: 50 }, { autre: -50 }], appliquer, true);
      jasmine.clock().tick(10000);

      expect(appliquees).toEqual([{ depart: 100, taux: 50, autre: -50 }]);
    });

    it('ne fait rien d une suite vide', () => {
      jouerSuite([], appliquer, false);
      jasmine.clock().tick(10000);

      expect(appliquees).toEqual([]);
    });
  });
});
