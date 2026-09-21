import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('laisse le client choisir l espace B2 selon le rôle de la session', () => {
    const route = serverRoutes.find(
      (candidate) => candidate.path === 'formations/b2-01-traitement-information-chiffree',
    );

    expect(route?.renderMode).toBe(RenderMode.Client);
  });
});
