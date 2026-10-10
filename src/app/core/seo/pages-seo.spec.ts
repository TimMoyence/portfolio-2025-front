import { buildPageSeoFr, buildSeoMetadata } from '../../../testing/factories/seo-metadata.factory';
import { cheminPublicDeLaPage, pageSeoDeLaRoute } from './pages-seo';

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
});
