import type { NavigationExtras, Router, UrlTree } from '@angular/router';

export const CHEMIN_DE_CONNEXION = '/login';

export function retourApresConnexion(returnUrl: string): NavigationExtras {
  return { queryParams: { returnUrl } };
}

export function versLaConnexion(router: Router, returnUrl: string): UrlTree {
  return router.createUrlTree([CHEMIN_DE_CONNEXION], retourApresConnexion(returnUrl));
}
