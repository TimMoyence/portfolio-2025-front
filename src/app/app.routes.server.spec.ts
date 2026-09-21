import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('rend la page B2 à chaque requête pour servir le catalogue publié au moment de la visite', () => {
    const route = serverRoutes.find(
      (candidate) => candidate.path === 'formations/b2-01-traitement-information-chiffree',
    );

    expect(route?.renderMode).toBe(RenderMode.Server);
  });
});
