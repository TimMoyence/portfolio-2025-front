import { buildPageSeoFr, buildSeoMetadata } from '../../../testing/factories/seo-metadata.factory';
import {
  cheminPublicDeLaPage,
  estIndexable,
  localeParDefaut,
  pageSeoDeLaRoute,
  pagesIndexables,
} from './pages-seo';
import type { SeoMetadataFile } from './seo-metadata.model';

describe('pages-seo', () => {
  const accueil = buildPageSeoFr('home', '/');
  const contact = buildPageSeoFr('contact', '/contact');
  const metadata = buildSeoMetadata([contact, accueil]);

  describe('pageSeoDeLaRoute', () => {
    it('trouve la page d une route, slash final ou non', () => {
      expect(pageSeoDeLaRoute(metadata, '/contact')).toBe(contact);
      expect(pageSeoDeLaRoute(metadata, '/contact/')).toBe(contact);
    });

    it('ramene /, /home et une route faite de slashs a la page d accueil', () => {
      expect(pageSeoDeLaRoute(metadata, '/')).toBe(accueil);
      expect(pageSeoDeLaRoute(metadata, '/home')).toBe(accueil);
      expect(pageSeoDeLaRoute(metadata, '/home/')).toBe(accueil);
      expect(pageSeoDeLaRoute(metadata, '//')).toBe(accueil);
    });

    it('reconnait l accueil a son identifiant, quel que soit son chemin declare', () => {
      const ailleurs = buildPageSeoFr('home', '/accueil');
      const autre = buildSeoMetadata([contact, ailleurs]);

      expect(pageSeoDeLaRoute(autre, '/')).toBe(ailleurs);
      expect(pageSeoDeLaRoute(autre, '/accueil')).toBe(ailleurs);
    });

    it('ne rend rien pour une route non declaree', () => {
      expect(pageSeoDeLaRoute(metadata, '/inconnue')).toBeUndefined();
    });
  });

  describe('cheminPublicDeLaPage', () => {
    it('publie l accueil a la racine et les autres pages a leur chemin', () => {
      expect(cheminPublicDeLaPage(buildPageSeoFr('home', '/accueil'))).toBe('/');
      expect(cheminPublicDeLaPage(contact)).toBe('/contact');
    });
  });

  describe('localeParDefaut', () => {
    const siteDe = (site: Partial<SeoMetadataFile['site']>): SeoMetadataFile =>
      buildSeoMetadata([], { site: site as SeoMetadataFile['site'] });

    it('rend la locale par defaut declaree', () => {
      expect(localeParDefaut(siteDe({ defaultLocale: 'en', locales: ['fr', 'en'] }))).toBe('en');
    });

    it('retombe sur la premiere locale du site, puis sur fr', () => {
      expect(localeParDefaut(siteDe({ locales: ['en'] }))).toBe('en');
      expect(localeParDefaut(siteDe({}))).toBe('fr');
    });

    it('rend fr quand les metadonnees manquent', () => {
      expect(localeParDefaut(null)).toBe('fr');
    });
  });

  describe('estIndexable', () => {
    it('indexe toute page qui ne declare pas index:false', () => {
      expect(estIndexable(contact)).toBeTrue();
      expect(estIndexable(buildPageSeoFr('x', '/x', {}, { index: undefined }))).toBeTrue();
      expect(estIndexable(buildPageSeoFr('login', '/login', {}, { index: false }))).toBeFalse();
    });
  });

  describe('pagesIndexables', () => {
    it('ne garde que les pages indexables, dans leur ordre', () => {
      const login = buildPageSeoFr('login', '/login', {}, { index: false });

      expect(pagesIndexables(buildSeoMetadata([contact, login, accueil]))).toEqual([
        contact,
        accueil,
      ]);
    });
  });
});
