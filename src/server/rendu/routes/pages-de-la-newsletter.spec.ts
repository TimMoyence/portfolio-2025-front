import { RenderMode } from '@angular/ssr';
import { serverRoutes } from '../../../app/app.routes.server';
import { entetesDeLaRoute } from './routes-client';

const PAGES = ['newsletter/confirm', 'newsletter/unsubscribe'];

describe('Pages de la newsletter servies par le serveur', () => {
  it('NL-14 · sert les pages de la newsletter sans referent ni cache', () => {
    expect(PAGES.map((page) => entetesDeLaRoute(`/${page}`))).toEqual(
      PAGES.map(() => ({ 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'private, no-store' })),
    );
  });

  it('NL-14 · prerend les deux pages, qui n agissent qu au clic', () => {
    expect(
      PAGES.map((page) => serverRoutes.find((route) => route.path === page)?.renderMode),
    ).toEqual([RenderMode.Prerender, RenderMode.Prerender]);
  });
});
