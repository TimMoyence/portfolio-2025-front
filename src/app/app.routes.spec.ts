import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { provideRouter, Router } from '@angular/router';
import { buildAuthSession, buildAuthUser } from '../testing/factories/auth.factory';
import { setupTestBed } from '../testing/setup-test-bed';
import { authGuard } from './core/guards/auth.guard';
import { coursEntreeGuard } from './core/guards/cours-entree.guard';
import { AuthStateService } from './core/services/auth-state.service';
import { routes } from './app.routes';

describe('app routes', () => {
  it('contains forgot-password and reset-password routes', () => {
    expect(routes.some((route) => route.path === 'forgot-password')).toBeTrue();
    expect(routes.some((route) => route.path === 'reset-password')).toBeTrue();
  });

  it('protects /profil with authGuard', () => {
    const profileRoute = routes.find((route) => route.path === 'profil');

    expect(profileRoute).toBeDefined();
    expect(profileRoute?.canActivate).toBeDefined();
    expect(profileRoute?.canActivate?.includes(authGuard)).toBeTrue();
  });

  it('devrait contenir toutes les routes principales', () => {
    const cheminsPrincipaux = [
      '',
      'home',
      'login',
      'register',
      'forgot-password',
      'reset-password',
      'profil',
      'presentation',
      'offer',
      'contact',
      'projets',
      'client-project',
      'cookie-settings',
      'terms',
      'privacy',
      'growth-audit',
      'atelier',
      'commonbudgetTM',
      '**',
    ];

    for (const chemin of cheminsPrincipaux) {
      expect(routes.find((r) => r.path === chemin))
        .withContext(`la route '${chemin}' devrait exister`)
        .toBeDefined();
    }
  });

  it('devrait rediriger /home vers /', () => {
    const homeRedirect = routes.find((r) => r.path === 'home');

    expect(homeRedirect).toBeDefined();
    expect(homeRedirect?.redirectTo).toBe('');
    expect(homeRedirect?.pathMatch).toBe('full');
  });

  it("devrait rediriger /commonbudgetTM vers l'accueil", () => {
    const commonBudgetRedirect = routes.find((r) => r.path === 'commonbudgetTM');

    expect(commonBudgetRedirect).toBeDefined();
    expect(commonBudgetRedirect?.redirectTo).toBe('');
    expect(commonBudgetRedirect?.pathMatch).toBe('full');
  });

  for (const ancienneUrl of [
    '/atelier',
    '/atelier/meteo',
    '/atelier/sebastian',
    '/atelier/meteo/app',
    '/atelier/sebastian/app/badges',
  ]) {
    it(`redirige l ancienne url de l atelier ${ancienneUrl} vers /projets`, async () => {
      setupTestBed({ providers: [provideRouter(routes)] });

      await TestBed.inject(Router).navigateByUrl(ancienneUrl);

      expect(TestBed.inject(Router).url).toBe('/projets');
    });
  }

  it('ne sert plus aucune application de l atelier', () => {
    const cheminsDeLAtelier = routes.filter((r) => r.path?.startsWith('atelier'));

    expect(cheminsDeLAtelier.every((r) => !r.loadComponent && !r.canActivate)).toBeTrue();
  });

  it('devrait rediriger /client-project vers /projets sans servir de composant', () => {
    const caseStudyRedirect = routes.find((r) => r.path === 'client-project');

    expect(caseStudyRedirect).toBeDefined();
    expect(caseStudyRedirect?.redirectTo).toBe('projets');
    expect(caseStudyRedirect?.pathMatch).toBe('full');
    expect(caseStudyRedirect?.loadComponent).toBeUndefined();
  });

  it('devrait définir un seoKey pour chaque route indexable', () => {
    const routesIndexables = routes.filter((r) => r.loadComponent && !r.redirectTo);

    expect(routesIndexables.length).toBeGreaterThan(0);
    for (const route of routesIndexables) {
      expect(route.data?.['seoKey'])
        .withContext(`la route '${route.path}' devrait avoir un seoKey`)
        .toBeTruthy();
    }
  });

  it('devrait avoir un fallback ** vers not-found', () => {
    const derniereRoute = routes[routes.length - 1];

    expect(derniereRoute.path).toBe('**');
    expect(derniereRoute.loadComponent).toBeDefined();
    expect(derniereRoute.data?.['seoKey']).toBe('not-found');
  });

  describe('parcours de cours', () => {
    const routeDe = (chemin: string) => routes.find((route) => route.path === chemin);

    it('redirige l ancienne demonstration technique vers l espace formations', () => {
      const route = routeDe('cours/demo');

      expect(route?.redirectTo).toBe('formations');
      expect(route?.pathMatch).toBe('full');
      expect(route?.loadComponent).toBeUndefined();
    });

    it('fait choisir automatiquement l espace B2 selon le rôle', () => {
      const route = routeDe('formations/b2-01-traitement-information-chiffree');

      expect(route?.canActivate).toEqual([coursEntreeGuard]);
      expect(route?.data?.['coursSlug']).toBe('b2-01-traitement-information-chiffree');
      expect(route?.data?.['robots']).toBe('noindex, nofollow');
    });

    it('L1 · ne charge plus de page de lecture libre pour le B2', () => {
      const route = routeDe('formations/b2-01-traitement-information-chiffree');

      expect(route?.loadComponent).toBeUndefined();
      expect(route?.component).toBeUndefined();
      expect(route?.children).toEqual([]);
    });

    async function verifieReserveAUnFormateur(chemin: string, nomComposant: string): Promise<void> {
      const route = routeDe(chemin);
      setupTestBed({ router: true });
      const authState = TestBed.inject(AuthStateService);
      const [authentification, role, ...autres] = route?.canActivate ?? [];
      const decider = (): unknown =>
        TestBed.runInInjectionContext(() =>
          (role as CanActivateFn)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        );

      expect(authentification).toBe(authGuard);
      expect(autres).toEqual([]);

      authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['user'] }) }));
      expect(String(decider())).toBe('/contact?reason=access&app=teacher');

      authState.login(buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }));
      expect(decider()).toBeTrue();

      authState.clearSession();
      const composant = await route?.loadComponent?.();
      expect((composant as { name: string }).name).toBe(nomComposant);
    }

    it('ouvre la vue etudiant sans authentification, les etudiants n ayant pas de compte', async () => {
      const route = routeDe('cours/rejoindre');

      expect(route?.canActivate ?? []).toEqual([]);
      const composant = await route?.loadComponent?.();
      expect((composant as { name: string }).name).toBe('CoursEtudiantComponent');
    });

    it('reserve la synthese de seance a un formateur authentifie', async () => {
      const route = routeDe('cours/seance/:sessionId/synthese');

      expect(route?.canActivate?.includes(authGuard)).toBeTrue();
      const composant = await route?.loadComponent?.();
      expect((composant as { name: string }).name).toBe('CoursSyntheseComponent');
    });

    it('reserve le pupitre de seance a un formateur authentifie', async () => {
      await verifieReserveAUnFormateur('cours/presenter/:slug', 'CoursPresentateurComponent');
    });

    it('reserve la scene de seance a un formateur authentifie', async () => {
      await verifieReserveAUnFormateur(
        'cours/presenter/:slug/scene/:sessionId',
        'CoursSceneComponent',
      );
    });

    it('sort de la coquille du site le poste etudiant et la scene, et eux seuls', () => {
      const sansCoquille = routes.filter((route) => route.data?.['coquille'] === false);

      expect(sansCoquille.map((route) => route.path)).toEqual([
        'cours/rejoindre',
        'cours/presenter/:slug/scene/:sessionId',
      ]);
    });

    it('n indexe aucune page de cours', () => {
      const pages = routes.filter((route) => route.path?.startsWith('cours/'));

      expect(pages.length).toBeGreaterThanOrEqual(4);
      for (const page of pages) {
        expect(page.data?.['robots'])
          .withContext(`la route '${page.path}' ne doit pas etre indexee`)
          .toBe('noindex, nofollow');
      }
    });
  });
});
