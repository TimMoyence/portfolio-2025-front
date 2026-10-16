import { HttpErrorResponse } from '@angular/common/http';
import type { ChangeDetectorRef } from '@angular/core';
import { of, throwError, EMPTY } from 'rxjs';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { handleFormSubmit, messageDuRefus } from './form-submit.utils';

const REPLI = 'Le formulaire n’a pas pu partir.';
const REFUS_DU_FORMULAIRE = 'Vérifiez les champs du formulaire.';
const refusHttp = (status: number, detail: string | string[] = 'Invalid credentials') =>
  refusDuBack(status, detail);

describe('handleFormSubmit', () => {
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(() => {
    cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['markForCheck']);
  });

  it('devrait appeler onSuccess et markForCheck sur next', () => {
    const onSuccess = jasmine.createSpy('onSuccess');

    handleFormSubmit(of('result'), cdr, {
      onSuccess,
      fallbackError: 'Erreur',
    });

    expect(onSuccess).toHaveBeenCalledWith('result');
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  function soumettreEnEchec(erreur: unknown): jasmine.Spy {
    const onError = jasmine.createSpy('onError');

    handleFormSubmit(
      throwError(() => erreur),
      cdr,
      {
        onError,
        fallbackError: REPLI,
        refus: { 400: REFUS_DU_FORMULAIRE },
      },
    );

    return onError;
  }

  it('dit le refus par le message du formulaire choisi selon le statut, avec le statut pour le suivi', () => {
    const onError = soumettreEnEchec(refusHttp(400, ['email must be an email']));

    expect(onError).toHaveBeenCalledOnceWith(REFUS_DU_FORMULAIRE, 400);
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('dit le même message à tout formulaire limité par le back (429)', () => {
    const onError = soumettreEnEchec(refusHttp(429, 'ThrottlerException: Too Many Requests'));

    expect(onError).toHaveBeenCalledOnceWith(
      'Trop de tentatives en peu de temps : patientez quelques minutes avant de réessayer.',
      429,
    );
  });

  it('dit une adresse non vérifiée (403) à toute route protégée', () => {
    const onError = soumettreEnEchec(refusHttp(403, 'Email non verifie'));

    expect(onError).toHaveBeenCalledOnceWith(
      'Votre adresse e-mail n’est pas encore vérifiée : ouvrez le lien reçu par e-mail pour activer votre compte.',
      403,
    );
  });

  for (const [cas, erreur, statut] of [
    ['un refus que le formulaire ne nomme pas', refusHttp(401), 401],
    ['une panne du back', refusHttp(500, 'Une erreur interne est survenue.'), 500],
    ['un back injoignable', new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }), 0],
    ['une erreur hors HTTP', new Error('Http failure response'), 0],
    ['un corps au message servi', { error: { message: 'Utilisateur inconnu' } }, 0],
  ] as const) {
    it(`replie sur le message du formulaire pour ${cas}, jamais sur le texte servi`, () => {
      const onError = soumettreEnEchec(erreur);

      expect(onError).toHaveBeenCalledOnceWith(REPLI, statut);
    });
  }

  it('devrait appeler onComplete et markForCheck sur complete', () => {
    const onComplete = jasmine.createSpy('onComplete');

    handleFormSubmit(EMPTY, cdr, {
      onComplete,
      fallbackError: 'Erreur',
    });

    expect(onComplete).toHaveBeenCalled();
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('appelle finalement après un refus comme après un succès, une seule fois chacun', () => {
    const apresUnRefus = jasmine.createSpy('apresUnRefus');
    const apresUnSucces = jasmine.createSpy('apresUnSucces');

    handleFormSubmit(
      throwError(() => refusHttp(400)),
      cdr,
      { fallbackError: REPLI, finalement: apresUnRefus },
    );
    handleFormSubmit(of('ok'), cdr, { fallbackError: REPLI, finalement: apresUnSucces });

    expect(apresUnRefus).toHaveBeenCalledTimes(1);
    expect(apresUnSucces).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner un Subscription', () => {
    const sub = handleFormSubmit(of('value'), cdr, {
      fallbackError: 'Erreur',
    });

    expect(sub).toBeDefined();
    expect(typeof sub.unsubscribe).toBe('function');
  });

  it('devrait fonctionner sans callbacks optionnels', () => {
    expect(() =>
      handleFormSubmit(of('value'), cdr, {
        fallbackError: 'Erreur',
      }),
    ).not.toThrow();
    expect(cdr.markForCheck).toHaveBeenCalled();
  });
});

describe('messageDuRefus', () => {
  it('préfère le message du formulaire au message commun du même statut', () => {
    expect(messageDuRefus(refusHttp(429), { 429: 'Trois demandes par heure.' }, REPLI)).toBe(
      'Trois demandes par heure.',
    );
  });

  it('ne lit aucune propriété héritée pour un statut inconnu', () => {
    expect(messageDuRefus(refusHttp(418), {}, REPLI)).toBe(REPLI);
  });
});
