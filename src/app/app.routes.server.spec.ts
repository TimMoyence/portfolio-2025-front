import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  for (const slug of [
    'b2-01-traitement-information-chiffree',
    'b2-02-series-statistiques',
    'b2-03-logique',
    'b2-04-suites',
    'b2-05-mathematiques-financieres',
  ]) {
    it(`laisse le client choisir l espace de ${slug} selon le rôle de la session`, () => {
      const route = serverRoutes.find((candidate) => candidate.path === `formations/${slug}`);

      expect(route?.renderMode).toBe(RenderMode.Client);
    });
  }

  it('rend le livret papier côté client, où la session du formateur est restaurée', () => {
    const route = serverRoutes.find(
      (candidate) => candidate.path === 'cours/presenter/:slug/livret',
    );

    expect(route?.renderMode).toBe(RenderMode.Client);
  });

  it('garde le rendu par défaut en dernier', () => {
    expect(serverRoutes.at(-1)?.path).toBe('**');
  });
});
