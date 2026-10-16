import { DestroyRef, inject, type WritableSignal } from '@angular/core';
import { type Observable, firstValueFrom } from 'rxjs';
import { messageDeLaLimiteAtteinte } from '../../core/http/limite-de-debit';

export type Chargement = 'repos' | 'chargement' | 'succes' | 'echec';

export type LectureSuivie = <T>(
  source: Observable<T>,
  etat?: WritableSignal<Chargement>,
  limite?: WritableSignal<string | null>,
) => Promise<T | null>;

export function lectureSuivie(): LectureSuivie {
  let detruit = false;
  inject(DestroyRef).onDestroy(() => {
    detruit = true;
  });
  return async <T>(
    source: Observable<T>,
    etat?: WritableSignal<Chargement>,
    limite?: WritableSignal<string | null>,
  ): Promise<T | null> => {
    etat?.set('chargement');
    limite?.set(null);
    try {
      const valeur = await firstValueFrom(source);
      if (detruit) {
        return null;
      }
      etat?.set('succes');
      return valeur;
    } catch (erreur) {
      if (!detruit) {
        etat?.set('echec');
        limite?.set(messageDeLaLimiteAtteinte(erreur));
      }
      return null;
    }
  };
}
