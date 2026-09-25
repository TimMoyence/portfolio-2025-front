import {
  estObjet,
  estVerdictDeProduction,
  estVerdictDeReponse,
  lireTextes,
  PROPRIETE_FORMATEUR,
  VerdictsParQuestion,
} from './retours';
import { buildVerdictDeReponse } from '../../../testing/factories/cours.factory';

describe('lireTextes', () => {
  it('ne garde que les entrees textuelles d un brouillon', () => {
    expect(lireTextes({ a: 'rediger', b: 3, c: null, d: '' })).toEqual({ a: 'rediger', d: '' });
  });

  it('rend un recueil vide pour ce qui n est pas un objet', () => {
    expect(lireTextes(['a'])).toEqual({});
    expect(lireTextes('a')).toEqual({});
    expect(lireTextes(null)).toEqual({});
  });
});

const VERDICT_REPONSE = { questionId: 'Q', correcte: true, libelleConfusion: null };

const DETAIL = { cle: 'E3', juste: false, libelleConfusion: 'Base oubliée' };

const VERDICT_PRODUCTION = { questionId: 'Q', correcte: false, score: 0.5, details: [DETAIL] };

describe('estObjet', () => {
  it('reconnaît un objet simple', () => {
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

describe('estVerdictDeReponse', () => {
  it('accepte un verdict complet, avec ou sans libellé de confusion', () => {
    expect(estVerdictDeReponse(VERDICT_REPONSE)).toBeTrue();
    expect(estVerdictDeReponse({ ...VERDICT_REPONSE, libelleConfusion: 'Confusion' })).toBeTrue();
  });

  it('refuse un verdict dont un champ manque ou change de type', () => {
    const malformes = [
      null,
      [VERDICT_REPONSE],
      { ...VERDICT_REPONSE, questionId: 12 },
      { ...VERDICT_REPONSE, correcte: 'oui' },
      { ...VERDICT_REPONSE, libelleConfusion: 0 },
      { ...VERDICT_REPONSE, libelleConfusion: undefined },
      { correcte: true, libelleConfusion: null },
      { questionId: 'Q', libelleConfusion: null },
    ];

    for (const malforme of malformes) {
      expect(estVerdictDeReponse(malforme))
        .withContext(JSON.stringify(malforme) ?? 'undefined')
        .toBeFalse();
    }
  });
});

describe('estVerdictDeProduction', () => {
  it('accepte un verdict détaillé, détails vides compris', () => {
    expect(estVerdictDeProduction(VERDICT_PRODUCTION)).toBeTrue();
    expect(estVerdictDeProduction({ ...VERDICT_PRODUCTION, details: [] })).toBeTrue();
  });

  it('refuse un verdict dont les détails ne sont pas un tableau de détails', () => {
    const malformes = [
      null,
      [VERDICT_PRODUCTION],
      { ...VERDICT_PRODUCTION, details: null },
      { ...VERDICT_PRODUCTION, details: { E3: true } },
      { ...VERDICT_PRODUCTION, details: 'E3' },
      { ...VERDICT_PRODUCTION, details: [{ cle: 1, juste: false, libelleConfusion: null }] },
      { ...VERDICT_PRODUCTION, details: [{ cle: 'E3', juste: 'non', libelleConfusion: null }] },
      { ...VERDICT_PRODUCTION, details: [{ cle: 'E3', juste: false }] },
      { ...VERDICT_PRODUCTION, details: [DETAIL, null] },
      { ...VERDICT_PRODUCTION, score: '0.5' },
      { ...VERDICT_PRODUCTION, questionId: null },
    ];

    for (const malforme of malformes) {
      expect(estVerdictDeProduction(malforme))
        .withContext(JSON.stringify(malforme) ?? 'undefined')
        .toBeFalse();
    }
  });

  it('ne prend pas un verdict de réponse pour une production, et l’inverse reste possible', () => {
    expect(estVerdictDeProduction(VERDICT_REPONSE)).toBeFalse();
    expect(estVerdictDeReponse(VERDICT_PRODUCTION)).toBeFalse();
    expect(estVerdictDeReponse({ ...VERDICT_PRODUCTION, libelleConfusion: null })).toBeTrue();
  });
});

describe('VerdictsParQuestion', () => {
  it('indexe les verdicts valides par question et écarte les malformés', () => {
    const premier = buildVerdictDeReponse({ questionId: 'Q-1' });
    const second = buildVerdictDeReponse({ questionId: 'Q-2', correcte: true });

    const verdicts = new VerdictsParQuestion([premier, { questionId: 3 }, second]);

    expect(verdicts.liste()).toEqual([premier, second]);
    expect(verdicts.de('Q-2')).toEqual(second);
    expect(verdicts.a('Q-1')).toBeTrue();
    expect(verdicts.de('Q-3')).toBeNull();
    expect(verdicts.a('Q-3')).toBeFalse();
  });

  it('ne retient que les questions acceptées', () => {
    const verdicts = new VerdictsParQuestion(
      [buildVerdictDeReponse({ questionId: 'Q-1' }), buildVerdictDeReponse({ questionId: 'Q-2' })],
      (questionId) => questionId === 'Q-2',
    );

    expect(verdicts.liste().map((verdict) => verdict.questionId)).toEqual(['Q-2']);
  });

  it('reste vide sans verdicts', () => {
    expect(new VerdictsParQuestion(null).liste()).toEqual([]);
    expect(new VerdictsParQuestion().liste()).toEqual([]);
  });
});

describe('propriété réservée au formateur', () => {
  it('nomme la clé que les briques ne lisent qu’au pupitre', () => {
    expect(PROPRIETE_FORMATEUR).toBe('corrige');
  });
});
