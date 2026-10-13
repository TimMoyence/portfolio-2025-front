import { RenderMode } from '@angular/ssr';
import { serverRoutes } from '../app/app.routes.server';
import { entetesDeLaRoute, isClientOnlyRoute } from './routes-client';

function cheminConcret(motif: string): string {
  return `/${motif.replace(/:[A-Za-z]+/g, 'valeur-1').replace(/\*\*$/, 'sous/chemin')}`;
}

describe('isClientOnlyRoute', () => {
  it('sert la coquille client au profil, protege par la session', () => {
    expect(isClientOnlyRoute('/profil')).toBeTrue();
  });

  it('laisse le serveur rediriger les anciennes applications de l atelier', () => {
    expect(isClientOnlyRoute('/atelier/meteo/app')).toBeFalse();
    expect(isClientOnlyRoute('/atelier/sebastian/app/badges')).toBeFalse();
  });

  it('sert la coquille client a chaque route declaree RenderMode.Client', () => {
    const routesClient = serverRoutes
      .filter((route) => route.renderMode === RenderMode.Client)
      .map((route) => cheminConcret(route.path));

    expect(routesClient.filter((chemin) => !isClientOnlyRoute(chemin))).toEqual([]);
  });

  it('laisse au serveur les routes qui ne sont pas declarees RenderMode.Client', () => {
    const routesServeur = serverRoutes
      .filter((route) => route.renderMode !== RenderMode.Client && route.path !== '**')
      .map((route) => cheminConcret(route.path));

    expect(routesServeur.filter((chemin) => isClientOnlyRoute(chemin))).toEqual([]);
  });

  it('garde le rendu serveur pour les routes voisines des seances', () => {
    expect(isClientOnlyRoute('/cours/rejoindre/autre')).toBeFalse();
    expect(
      isClientOnlyRoute('/formations/b2-01-traitement-information-chiffree/toolkit'),
    ).toBeFalse();
  });
});

describe('entetesDeLaRoute', () => {
  it('sert le livret papier hors du groupe de navigation du pupitre, que son impression ne fige pas', () => {
    expect(entetesDeLaRoute('/cours/presenter/b2-02-series-statistiques/livret')).toEqual({
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
  });

  it('laisse le pupitre sans politique d ouverture, pour que le livret qu il ouvre s en sépare', () => {
    expect(entetesDeLaRoute('/cours/presenter/b2-02-series-statistiques')).toEqual({});
    expect(entetesDeLaRoute('/cours/presenter/b2-02-series-statistiques/scene/seance-1')).toEqual(
      {},
    );
  });

  it('sert chaque page ouverte par un lien a jeton sans referent, pour que son URL ne parte ni vers l API ni vers un tiers', () => {
    for (const page of [
      '/verify-email',
      '/reset-password',
      '/formations/ia-solopreneurs/toolkit/6f0e3c1a-9b2d-4c8e-a1f7-3d5b9e2c4a10',
    ]) {
      expect(entetesDeLaRoute(page)['Referrer-Policy']).withContext(page).toBe('no-referrer');
    }
  });

  it('laisse la page publique du toolkit, sans jeton, sous la politique de referent du site', () => {
    expect(entetesDeLaRoute('/formations/ia-solopreneurs/toolkit')).toEqual({});
  });

  it('pose les en-têtes que chaque route serveur déclare', () => {
    const declarees = serverRoutes.filter((route) => route.headers !== undefined);

    expect(declarees.length).toBeGreaterThan(0);
    for (const route of declarees) {
      expect(entetesDeLaRoute(cheminConcret(route.path))).toEqual(route.headers ?? {});
    }
  });
});
