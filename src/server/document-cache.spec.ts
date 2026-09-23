import { documentCacheControlFor } from './document-cache';

describe('documentCacheControlFor', () => {
  it('met en cache public une page rendue avec succès', () => {
    expect(documentCacheControlFor(200)).toBe('public, max-age=3600, s-maxage=14400');
  });

  it('met en cache court une vraie 404 pour absorber les robots sans figer un article à venir', () => {
    expect(documentCacheControlFor(404)).toBe('public, max-age=300, s-maxage=300');
  });

  it('interdit le cache d une page rendue pendant une panne de l API', () => {
    expect(documentCacheControlFor(503)).toBe('no-store');
  });
});
