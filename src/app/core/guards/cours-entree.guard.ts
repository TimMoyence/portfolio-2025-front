import type { CanActivateFn } from '@angular/router';
import { cheminDuPupitre } from '../config/cours-en-seance';
import { gardeApresLaSession } from './apres-la-session';

export const coursEntreeGuard: CanActivateFn = gardeApresLaSession(
  (authState) => authState.isSessionCheckComplete,
  ({ authState, router, route }) => {
    const slug = route.data['coursSlug'];
    if (typeof slug !== 'string') {
      return router.createUrlTree(['/cours/rejoindre']);
    }
    return authState.hasRole('teacher')
      ? router.parseUrl(cheminDuPupitre(slug))
      : router.createUrlTree(['/cours/rejoindre'], { queryParams: { cours: slug } });
  },
);
