import {
  bornerEntre,
  chaineDe,
  entierBorne,
  estChaineNonVide,
  estChaineOuNul,
  estEntierPositif,
  estEntierStrictementPositif,
  estMembre,
  estObjet,
  estPositif,
  estTexteNonVide,
  fini,
  jsonOuNull,
  memeIdentifiant,
  objet,
  part,
} from './valeurs';

function attendreLeRefus(
  predicat: (valeur: unknown) => boolean,
  valeurs: readonly unknown[],
): void {
  for (const valeur of valeurs) {
    expect(predicat(valeur))
      .withContext(JSON.stringify(valeur) ?? 'undefined')
      .toBeFalse();
  }
}

describe('valeurs', () => {
  describe('estObjet', () => {
    it('reconnait un objet simple', () => {
      expect(estObjet({})).toBeTrue();
      expect(estObjet({ a: 1 })).toBeTrue();
    });

    it('refuse null, un tableau et les valeurs primitives', () => {
      attendreLeRefus(estObjet, [null, undefined, [], [1], 'texte', 0, false]);
    });
  });

  describe('objet', () => {
    it('rend l’objet lui-même et rejette tableau, null et primitives', () => {
      const valeur = { a: 1 };

      expect(objet(valeur)).toBe(valeur);
      for (const refuse of [null, undefined, [], ['a'], 'texte', 3, true]) {
        expect(objet(refuse)).toBeNull();
      }
    });
  });

  describe('chaineDe', () => {
    it('lit le champ textuel d un objet, vide compris', () => {
      expect(chaineDe({ code: 'SEANCE_CLOSE' }, 'code')).toBe('SEANCE_CLOSE');
      expect(chaineDe({ code: '' }, 'code')).toBe('');
    });

    it('rend null hors objet, pour un champ absent ou non textuel', () => {
      for (const valeur of [null, undefined, 'code', ['SEANCE_CLOSE'], {}, { code: 3 }]) {
        expect(chaineDe(valeur, 'code'))
          .withContext(JSON.stringify(valeur) ?? 'undefined')
          .toBeNull();
      }
    });
  });

  describe('estChaineOuNul', () => {
    it('accepte un texte, vide compris, et null', () => {
      for (const valeur of ['Base oubliée', '', null]) {
        expect(estChaineOuNul(valeur)).withContext(String(valeur)).toBeTrue();
      }
    });

    it('refuse l absence et les non-textes', () => {
      attendreLeRefus(estChaineOuNul, [undefined, 0, false, ['a'], { libelle: 'a' }]);
    });
  });

  describe('estEntierStrictementPositif', () => {
    it('accepte les entiers surs a partir de un', () => {
      for (const valeur of [1, 42, Number.MAX_SAFE_INTEGER]) {
        expect(estEntierStrictementPositif(valeur)).withContext(String(valeur)).toBeTrue();
      }
    });

    it('refuse zero, les negatifs, les decimaux, les entiers non surs et les non-nombres', () => {
      for (const valeur of [
        0,
        -1,
        2.5,
        2 ** 53,
        1e21,
        Infinity,
        Number.NaN,
        '3',
        undefined,
        null,
      ]) {
        expect(estEntierStrictementPositif(valeur)).withContext(String(valeur)).toBeFalse();
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

  describe('estChaineNonVide', () => {
    it('accepte un texte d au moins un caractere, blancs compris', () => {
      for (const valeur of ['a', ' ', 'Q-1']) {
        expect(estChaineNonVide(valeur)).withContext(JSON.stringify(valeur)).toBeTrue();
      }
    });

    it('refuse le texte vide et les non-textes', () => {
      attendreLeRefus(estChaineNonVide, ['', null, undefined, 0, ['a'], { id: 'a' }]);
    });
  });

  describe('estTexteNonVide', () => {
    it('accepte un texte qui porte au moins un caractere visible', () => {
      for (const valeur of ['a', '  a  ', '\n0']) {
        expect(estTexteNonVide(valeur)).withContext(JSON.stringify(valeur)).toBeTrue();
      }
    });

    it('refuse le vide, les seuls blancs et les non-textes', () => {
      attendreLeRefus(estTexteNonVide, ['', '   ', '\n\t', null, undefined, 1]);
    });
  });

  describe('estPositif', () => {
    it('accepte les nombres finis strictement positifs, decimaux compris', () => {
      for (const valeur of [0.5, 1, 60, Number.MAX_VALUE]) {
        expect(estPositif(valeur)).withContext(String(valeur)).toBeTrue();
      }
    });

    it('refuse zero, les negatifs, les non-finis et les non-nombres', () => {
      for (const valeur of [0, -0, -1, Number.NaN, Number.POSITIVE_INFINITY, '5', null]) {
        expect(estPositif(valeur)).withContext(String(valeur)).toBeFalse();
      }
    });
  });

  describe('memeIdentifiant', () => {
    it('rapproche deux contenus de meme identifiant, et deux absences', () => {
      expect(memeIdentifiant({ id: 'a' }, { id: 'a' })).toBeTrue();
      expect(memeIdentifiant(null, null)).toBeTrue();
    });

    it('distingue deux identifiants, et un contenu d une absence', () => {
      expect(memeIdentifiant({ id: 'a' }, { id: 'b' })).toBeFalse();
      expect(memeIdentifiant({ id: 'a' }, null)).toBeFalse();
      expect(memeIdentifiant(null, { id: 'a' })).toBeFalse();
    });
  });

  describe('estMembre', () => {
    const PHASES = ['ouverte', 'close'] as const;

    it('reconnait une valeur de la liste fermee', () => {
      expect(estMembre(PHASES, 'ouverte')).toBeTrue();
      expect(estMembre(PHASES, 'close')).toBeTrue();
    });

    it('refuse une valeur hors liste, un non-texte et un objet qui se lit comme un membre', () => {
      const imitation = { toString: (): string => 'close' };
      for (const valeur of ['Close', '', undefined, null, 0, ['close'], imitation]) {
        expect(estMembre(PHASES, valeur)).withContext(String(valeur)).toBeFalse();
      }
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
      expect(Object.is(bornerEntre(-0, 0, 10), 0)).toBeTrue();
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

  describe('part', () => {
    it('rend la part d un decompte sur son total, et 0 sur un total nul', () => {
      expect([part(3, 4), part(0, 5), part(5, 5), part(0, 0), part(2, 0)]).toEqual([
        0.75, 0, 1, 0, 0,
      ]);
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
