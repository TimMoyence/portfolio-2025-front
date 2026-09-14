import { InjectionToken } from '@angular/core';
import type { Sync, SyncOptions } from '../../../cours/runtime/core/sync';
import { createSync } from '../../../cours/runtime/core/sync';

export type CreateurFlux = (options: SyncOptions) => Sync;

export const CREATEUR_FLUX = new InjectionToken<CreateurFlux>('CREATEUR_FLUX', {
  providedIn: 'root',
  factory: () => createSync,
});
