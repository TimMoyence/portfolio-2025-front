import { isPlatformBrowser } from '@angular/common';
import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';

export type VerrouInterOnglets = <T>(nom: string, travail: () => Promise<T>) => Promise<T>;

export function creerVerrouInterOnglets(gestionnaire: LockManager | null): VerrouInterOnglets {
  return <T>(nom: string, travail: () => Promise<T>): Promise<T> =>
    gestionnaire === null ? travail() : gestionnaire.request(nom, travail);
}

function gestionnaireDuNavigateur(): LockManager | null {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return null;
  }
  const navigateur = globalThis.navigator as Partial<Navigator> | undefined;
  return navigateur?.locks ?? null;
}

export const VERROU_INTER_ONGLETS = new InjectionToken<VerrouInterOnglets>('VERROU_INTER_ONGLETS', {
  providedIn: 'root',
  factory: () => creerVerrouInterOnglets(gestionnaireDuNavigateur()),
});
