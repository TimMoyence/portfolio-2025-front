import {
  buildLocalizedPath,
  estAliasDAccueil,
  normalizePath,
  routeSansLocale,
  trimTrailingSlashes,
} from './chemins';

describe('chemins', () => {
  describe('normalizePath', () => {
    it('retire le trailing slash des chemins non racines', () => {
      expect(normalizePath('/contact/')).toBe('/contact');
    });

    it('garde la racine telle quelle', () => {
      expect(normalizePath('/')).toBe('/');
    });

    it('supprime les query et fragment', () => {
      expect(normalizePath('/fr/presentation?utm=x#section')).toBe('/fr/presentation');
    });

    it('replie les slashs de bordure multiples', () => {
      expect(normalizePath('///contact///')).toBe('/contact');
      expect(normalizePath('//')).toBe('/');
      expect(normalizePath('/'.repeat(2048))).toBe('/');
      expect(normalizePath(`${'/'.repeat(2048)}contact`)).toBe('/contact');
    });

    it('preserve les slashs internes', () => {
      expect(normalizePath('/fr/atelier//meteo/')).toBe('/fr/atelier//meteo');
    });

    it('accepte un chemin sans slash initial', () => {
      expect(normalizePath('contact')).toBe('/contact');
      expect(normalizePath('')).toBe('/');
    });
  });

  describe('trimTrailingSlashes', () => {
    it('ne retire que les slashs finaux', () => {
      expect(trimTrailingSlashes('/fr/contact///')).toBe('/fr/contact');
      expect(trimTrailingSlashes('///')).toBe('');
      expect(trimTrailingSlashes('/fr/contact')).toBe('/fr/contact');
      expect(trimTrailingSlashes('')).toBe('');
    });
  });

  describe('buildLocalizedPath', () => {
    it('emet la racine locale AVEC trailing slash (alignement nginx)', () => {
      expect(buildLocalizedPath('fr', '/')).toBe('/fr/');
      expect(buildLocalizedPath('en', '/')).toBe('/en/');
    });

    it('emet les sous-pages SANS trailing slash (alignement middleware Express)', () => {
      expect(buildLocalizedPath('fr', '/contact')).toBe('/fr/contact');
      expect(buildLocalizedPath('fr', '/atelier/meteo')).toBe('/fr/atelier/meteo');
    });

    it('normalise les inputs avec trailing slash', () => {
      expect(buildLocalizedPath('fr', '/contact/')).toBe('/fr/contact');
    });

    it('retourne le chemin non-localise si locale vide', () => {
      expect(buildLocalizedPath('', '/contact')).toBe('/contact');
      expect(buildLocalizedPath('', '/')).toBe('/');
    });
  });

  describe('routeSansLocale', () => {
    const LOCALES = ['fr', 'en'];

    it('separe la locale de tete de la route', () => {
      expect(routeSansLocale('/en/contact/?utm=x', LOCALES)).toEqual({
        locale: 'en',
        route: '/contact',
      });
    });

    it('ramene la racine d une locale a /', () => {
      expect(routeSansLocale('/fr/', LOCALES)).toEqual({ locale: 'fr', route: '/' });
      expect(routeSansLocale('/fr', LOCALES)).toEqual({ locale: 'fr', route: '/' });
    });

    it('laisse un chemin sans locale connue tel quel', () => {
      expect(routeSansLocale('/de/contact', LOCALES)).toEqual({
        locale: undefined,
        route: '/de/contact',
      });
      expect(routeSansLocale('', LOCALES)).toEqual({ locale: undefined, route: '/' });
    });

    it('replie les slashs internes', () => {
      expect(routeSansLocale('//fr//test//', LOCALES).route).toBe('/test');
    });
  });

  describe('estAliasDAccueil', () => {
    it('reconnait / et /home, et rien d autre', () => {
      expect(estAliasDAccueil('/')).toBeTrue();
      expect(estAliasDAccueil('/home')).toBeTrue();
      expect(estAliasDAccueil('/homepage')).toBeFalse();
      expect(estAliasDAccueil('/fr/')).toBeFalse();
    });
  });
});
