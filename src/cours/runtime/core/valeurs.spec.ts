import { bornerEntre, entierBorne, estEntierPositif, estObjet, fini, jsonOuNull } from './valeurs';

describe('valeurs', () => {
  describe('estObjet', () => {
    it('reconnait un objet simple', () => {
      expect(estObjet({})).toBeTrue();
      expect(estObjet({ a: 1 })).toBeTrue();
    });

    it('refuse null, un tableau et les valeurs primitives', () => {
      for (const valeur of [null, undefined, [], [1], 'texte', 0, false]) {
        expect(estObjet(valeur))
          .withContext(JSON.stringify(valeur) ?? 'undefined')
          .toBeFalse();
      }
    });
  });

  describe('estEntierPositif', () => {
    it('accepte zero et les entiers surs positifs', () => {
      expect(estEntierPositif(0)).toBeTrue();
      expect(estEntierPositif(42)).toBeTrue();
    });

    it('refuse les negatifs, les decimaux, les entiers non surs et les non-nombres', () => {
      expect(estEntierPositif(-1)).toBeFalse();
      expect(estEntierPositif(1.5)).toBeFalse();
      expect(estEntierPositif(2 ** 53)).toBeFalse();
      expect(estEntierPositif('3')).toBeFalse();
    });
  });

  describe('jsonOuNull', () => {
    it('lit un texte JSON et rend null pour un texte illisible', () => {
      expect(jsonOuNull('{"a":[1]}')).toEqual({ a: [1] });
      expect(jsonOuNull('{a')).toBeNull();
    });
  });

  describe('bornerEntre', () => {
    it('ramene la valeur dans les bornes', () => {
      expect(bornerEntre(5, 0, 10)).toBe(5);
      expect(bornerEntre(-3, 0, 10)).toBe(0);
      expect(bornerEntre(12, 0, 10)).toBe(10);
    });

    it('donne le dernier mot au minimum quand les bornes se croisent', () => {
      expect(bornerEntre(3, 0, -1)).toBe(0);
    });

    it('laisse passer NaN et accepte des bornes infinies', () => {
      expect(bornerEntre(Number.NaN, 0, 10)).toBeNaN();
      expect(bornerEntre(-12345, -Infinity, Infinity)).toBe(-12345);
    });
  });

  describe('fini', () => {
    it('garde un nombre fini et replie les autres', () => {
      expect(fini(-2.5, 9)).toBe(-2.5);
      for (const valeur of [Number.NaN, Infinity, -Infinity]) {
        expect(fini(valeur, 9)).withContext(String(valeur)).toBe(9);
      }
    });
  });

  describe('entierBorne', () => {
    it('tronque la valeur avant de la borner', () => {
      expect(entierBorne(3.9, 0, 10, 7)).toBe(3);
      expect(entierBorne(-2.5, 0, 10, 7)).toBe(0);
      expect(entierBorne(14.2, 0, 10, 7)).toBe(10);
    });

    it('rend le repli pour une valeur non finie', () => {
      for (const valeur of [Number.NaN, Infinity, -Infinity]) {
        expect(entierBorne(valeur, 0, 10, 7))
          .withContext(String(valeur))
          .toBe(7);
      }
    });
  });
});
