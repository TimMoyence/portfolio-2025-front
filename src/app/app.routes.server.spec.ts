import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  for (const slug of [
    'b2-01-traitement-information-chiffree',
    'b2-02-serie-statistique-une-variable',
  ]) {
    it(`laisse le client choisir l espace de ${slug} selon le rôle de la session`, () => {
      const route = serverRoutes.find((candidate) => candidate.path === `formations/${slug}`);

      expect(route?.renderMode).toBe(RenderMode.Client);
    });
  }

  it('garde le rendu par défaut en dernier', () => {
    expect(serverRoutes.at(-1)?.path).toBe('**');
  });
});
