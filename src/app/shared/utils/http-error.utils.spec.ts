import { HttpErrorResponse } from '@angular/common/http';
import { REGLE_SERVIE_PAR_LE_BACK as REGLE_SERVIE } from '../../../testing/champ-de-formulaire';
import { extractErrorMessage } from './http-error.utils';

describe('extractErrorMessage', () => {
  const echecHttpSansCorps = { message: 'Http failure response' };

  it('devrait extraire un message string depuis error.error.message', () => {
    const error = { error: { message: 'Email deja utilise' } };
    expect(extractErrorMessage(error)).toBe('Email deja utilise');
  });

  it('devrait joindre un tableau de messages', () => {
    const error = {
      error: { message: ['Champ requis', 'Email invalide'] },
    };
    expect(extractErrorMessage(error)).toBe('Champ requis Email invalide');
  });

  it('ne retombe jamais sur le message technique de l erreur HTTP', () => {
    expect(extractErrorMessage(echecHttpSansCorps)).toBeUndefined();
    expect(
      extractErrorMessage(
        new HttpErrorResponse({
          status: 0,
          url: 'https://asilidesign.fr/api/v1/portfolio25/contacts',
        }),
      ),
    ).toBeUndefined();
  });

  it('lit le detail en tableau d un refus du back, jamais « Http failure response »', () => {
    const refus = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: 'https://asilidesign.fr/api/v1/portfolio25/users',
      error: { status: 400, detail: [REGLE_SERVIE] },
    });

    expect(extractErrorMessage(refus)).toBe(REGLE_SERVIE);
  });

  it('joint les lignes d un detail en tableau', () => {
    expect(extractErrorMessage({ error: { detail: ['a', 'b'] } })).toBe('a b');
  });

  it('devrait retourner undefined si pas de message', () => {
    expect(extractErrorMessage({})).toBeUndefined();
    expect(extractErrorMessage(null)).toBeUndefined();
    expect(extractErrorMessage(undefined)).toBeUndefined();
    expect(extractErrorMessage(42)).toBeUndefined();
  });

  it('devrait preferer error.error.message a error.message', () => {
    const error = {
      error: { message: 'Message API' },
      message: 'Message HTTP',
    };
    expect(extractErrorMessage(error)).toBe('Message API');
  });

  describe('support du champ error.error.detail', () => {
    it('devrait extraire error.error.detail (string)', () => {
      const error = { error: { detail: 'Lien expire' } };
      expect(extractErrorMessage(error)).toBe('Lien expire');
    });

    it('devrait preferer detail a message quand les deux sont presents', () => {
      const error = { error: { detail: 'D', message: 'M' } };
      expect(extractErrorMessage(error)).toBe('D');
    });

    it('devrait ignorer un detail non-string et retomber sur message', () => {
      const error = { error: { detail: 123, message: 'M' } };
      expect(extractErrorMessage(error)).toBe('M');
    });

    it('devrait retourner undefined si detail non-string et aucun autre message', () => {
      const error = { error: { detail: 123 } };
      expect(extractErrorMessage(error)).toBeUndefined();
    });
  });
});
