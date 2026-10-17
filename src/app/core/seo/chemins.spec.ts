import {
  buildLocalizedPath,
  cheminEnLocale,
  estCheminInterne,
  normalizePath,
  routeSansLocale,
  urlAbsolue,
  urlLocalisee,
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

    it('garde les slashs internes, comme normalizePath', () => {
      expect(routeSansLocale('/fr/a//b', LOCALES).route).toBe('/a//b');
      expect(routeSansLocale('//fr//test//', LOCALES)).toEqual({ locale: 'fr', route: '/test' });
    });

    it('ne prend pas pour une locale un segment qui ne fait que la prefixer', () => {
      expect(routeSansLocale('/frais', LOCALES)).toEqual({ locale: undefined, route: '/frais' });
    });
  });

  describe('cheminEnLocale', () => {
    const LOCALES = ['fr', 'en'];

    it('transpose une page dans l autre locale', () => {
      expect(cheminEnLocale('/fr/contact', 'en', LOCALES)).toBe('/en/contact');
      expect(cheminEnLocale('/contact', 'en', LOCALES)).toBe('/en/contact');
    });

    it('transpose l accueil vers la racine canonique de la locale', () => {
      expect(cheminEnLocale('/fr/', 'en', LOCALES)).toBe('/en/');
      expect(cheminEnLocale('/fr', 'en', LOCALES)).toBe('/en/');
    });
  });

  describe('urlAbsolue', () => {
    it('place le chemin sous la base, sans double slash', () => {
      expect(urlAbsolue('https://asilidesign.fr/', '/fr/')).toBe('https://asilidesign.fr/fr/');
      expect(urlAbsolue('https://asilidesign.fr', 'fr/contact')).toBe(
        'https://asilidesign.fr/fr/contact',
      );
    });

    it('garde le chemin d une base qui en porte un', () => {
      expect(urlAbsolue('https://example.com/site/', '/fr/')).toBe('https://example.com/site/fr/');
    });
  });

  describe('urlLocalisee', () => {
    it('place le chemin localise sous la base', () => {
      expect(urlLocalisee('https://asilidesign.fr/', 'en', '/contact/')).toBe(
        'https://asilidesign.fr/en/contact',
      );
      expect(urlLocalisee('https://asilidesign.fr', 'fr', '/')).toBe('https://asilidesign.fr/fr/');
    });
  });

  describe('estCheminInterne', () => {
    it('reconnait un chemin de même origine', () => {
      for (const chemin of ['/', '/profil', '/fr/cours/rejoindre?code=AB12#haut']) {
        expect(estCheminInterne(chemin)).withContext(chemin).toBeTrue();
      }
    });

    it('refuse ce qu un navigateur lit comme une autre origine', () => {
      for (const chemin of [
        '//evil.example',
        '/\\evil.example',
        '/\t/evil.example',
        '/\n/evil.example',
        '/\r/evil.example',
        'https://evil.example/x',
        'javascript:alert(1)',
        'profil',
        ' /profil',
        '',
      ]) {
        expect(estCheminInterne(chemin)).withContext(JSON.stringify(chemin)).toBeFalse();
      }
    });

    it('refuse un chemin porteur d un espace ou d un caractère de contrôle', () => {
      for (const chemin of ['/a b', '/a\u0000b', '/a\u007fb']) {
        expect(estCheminInterne(chemin)).withContext(JSON.stringify(chemin)).toBeFalse();
      }
    });
  });
});
