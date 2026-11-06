import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';
import { SLUGS_DES_COURS_SERVIS } from '../testing/fixtures/instantanes-des-cours';

describe('serverRoutes', () => {
  for (const slug of SLUGS_DES_COURS_SERVIS) {
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
