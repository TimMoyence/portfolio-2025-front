import { inject } from '@angular/core';
import { type ActivatedRouteSnapshot, Router, type ViewTransitionInfo } from '@angular/router';
import { prefereMouvementReduit } from '../../../../cours/runtime/core/ecran/mouvement';
import { REALISATIONS } from '../realisations.data';

export interface NavigationVue {
  readonly depuis: string;
  readonly vers: string;
  readonly vignette: boolean;
  readonly retour: boolean;
  readonly mouvementReduit: boolean;
}

const FICHES = new Set(REALISATIONS.map(({ slug }) => `/projets/${slug}`));
const VITRINES = new Set(['/', '/projets']);

export function joueLaTransition({
  depuis,
  vers,
  vignette,
  retour,
  mouvementReduit,
}: NavigationVue): boolean {
  if (mouvementReduit) {
    return false;
  }
  const versLaFiche = vignette && VITRINES.has(depuis) && FICHES.has(vers);
  const retourALaVitrine = retour && FICHES.has(depuis) && VITRINES.has(vers);
  return versLaFiche || retourALaVitrine;
}

function cheminDe(racine: ActivatedRouteSnapshot): string {
  const segments: string[] = [];
  for (let route: ActivatedRouteSnapshot | null = racine; route; route = route.firstChild) {
    segments.push(...route.url.map(({ path }) => path));
  }
  return `/${segments.join('/')}`;
}

export function transitionDeVignette({ transition, from, to }: ViewTransitionInfo): void {
  const navigation = inject(Router).getCurrentNavigation();
  const retour = navigation?.trigger === 'popstate';
  const joue = joueLaTransition({
    depuis: cheminDe(from),
    vers: cheminDe(to),
    vignette: !retour && navigation?.extras.state?.['vignette'] === true,
    retour,
    mouvementReduit: prefereMouvementReduit(),
  });
  if (!joue) {
    transition.skipTransition();
  }
}
