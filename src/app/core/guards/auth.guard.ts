import type { CanActivateFn } from '@angular/router';
import { gardeApresLaSession } from './apres-la-session';
import { versLaConnexion } from './vers-la-connexion';

export const authGuard: CanActivateFn = gardeApresLaSession(
  (authState) => authState.isSessionCheckComplete,
  ({ authState, router, state }) => authState.isLoggedIn() || versLaConnexion(router, state.url),
);
