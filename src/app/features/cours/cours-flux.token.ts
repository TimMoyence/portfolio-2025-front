import { InjectionToken, inject, type WritableSignal } from '@angular/core';
import type {
  ResultatsListener,
  StatutFlux,
  Sync,
  SyncListener,
  SyncOptions,
} from '../../../cours/runtime/core/sync';
import { createSync } from '../../../cours/runtime/core/sync';
import { getApiBaseUrl } from '../../core/http/api-config';
import { AuthStateService } from '../../core/services/auth-state.service';

export type CreateurFlux = (options: SyncOptions) => Sync;

export type CreateurFluxFormateur = (sessionId: string) => Sync;

export interface EcouteFormateur {
  readonly etat: SyncListener;
  readonly resultats: ResultatsListener;
  readonly suivi: WritableSignal<StatutFlux | null>;
  readonly retenir: (flux: Sync) => void;
}

export function ouvrirLeFluxFormateur(flux: Sync, ecoute: EcouteFormateur): void {
  flux.onState(ecoute.etat);
  flux.onResultats(ecoute.resultats);
  flux.onStatut((statut) => ecoute.suivi.set(statut));
  ecoute.retenir(flux);
  flux.ouvrir();
}

export const CREATEUR_FLUX = new InjectionToken<CreateurFlux>('CREATEUR_FLUX', {
  providedIn: 'root',
  factory: () => createSync,
});

export const CREATEUR_FLUX_FORMATEUR = new InjectionToken<CreateurFluxFormateur>(
  'CREATEUR_FLUX_FORMATEUR',
  {
    providedIn: 'root',
    factory: () => {
      const creerFlux = inject(CREATEUR_FLUX);
      const authState = inject(AuthStateService);
      const baseUrl = `${getApiBaseUrl()}/formations`;
      const entetes = (): Readonly<Record<string, string>> => {
        const jeton = authState.token();
        return jeton ? { authorization: `Bearer ${jeton}` } : {};
      };
      return (sessionId) => creerFlux({ baseUrl, sessionId, chemin: 'presenter-stream', entetes });
    },
  },
);
