import type { ChangeDetectorRef } from '@angular/core';
import { of, throwError, EMPTY } from 'rxjs';
import { handleFormSubmit } from './form-submit.utils';

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
        fallbackError: 'Erreur generique',
      },
    );

    return onError;
  }

  it('devrait appeler onError avec le message extrait sur erreur', () => {
    const onError = soumettreEnEchec({ error: { message: 'Email invalide' } });

    expect(onError).toHaveBeenCalledWith('Email invalide');
    expect(cdr.markForCheck).toHaveBeenCalled();
  });

  it('devrait utiliser le fallbackError si pas de message extractible', () => {
    expect(soumettreEnEchec({})).toHaveBeenCalledWith('Erreur generique');
  });

  it('devrait appeler onComplete et markForCheck sur complete', () => {
    const onComplete = jasmine.createSpy('onComplete');

    handleFormSubmit(EMPTY, cdr, {
      onComplete,
      fallbackError: 'Erreur',
    });

    expect(onComplete).toHaveBeenCalled();
    expect(cdr.markForCheck).toHaveBeenCalled();
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

  it('devrait gerer une erreur avec message tableau (NestJS validation)', () => {
    const onError = soumettreEnEchec({
      error: { message: ['Champ requis', 'Email invalide'] },
    });

    expect(onError).toHaveBeenCalledWith('Champ requis Email invalide');
  });
});
