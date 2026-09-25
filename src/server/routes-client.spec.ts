import { RenderMode } from '@angular/ssr';
import { serverRoutes } from '../app/app.routes.server';
import { isClientOnlyRoute } from './routes-client';

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
