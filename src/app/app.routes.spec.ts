import { authGuard } from './core/guards/auth.guard';
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
      'atelier/meteo',
      'atelier/sebastian',
      'atelier/meteo/app',
      'atelier/sebastian/app',
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

    it('n indexe aucune page de cours', () => {
      const pages = routes.filter((route) => route.path?.startsWith('cours/'));

      expect(pages.length).toBeGreaterThanOrEqual(3);
      for (const page of pages) {
        expect(page.data?.['robots'])
          .withContext(`la route '${page.path}' ne doit pas etre indexee`)
          .toBe('noindex, nofollow');
      }
    });
  });
});
