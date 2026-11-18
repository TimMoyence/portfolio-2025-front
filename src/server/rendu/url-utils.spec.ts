import type express from 'express';
import {
  ALLOWED_HOSTS,
  LONGUEUR_MAX_D_UNE_URL,
  buildBaseUrlFromRequest,
  cheminCanonique,
  demandeUnDocument,
  urlRefusee,
} from './url-utils';

const stubRequest = (opts: {
  headers?: Record<string, string>;
  host?: string;
  protocol?: string;
}): express.Request => {
  const headers = opts.headers ?? {};
  return {
    headers,
    protocol: opts.protocol ?? 'https',
    get(name: string): string | undefined {
      if (name.toLowerCase() === 'host') return opts.host;
      return headers[name.toLowerCase()];
    },
  } as unknown as express.Request;
};

describe('url-utils', () => {
  describe('urlRefusee', () => {
    it('laisse passer les chemins du site et leurs paramètres', () => {
      expect(urlRefusee('/fr/contact')).toBeFalse();
      expect(urlRefusee('/fr/articles/mon-article?utm=(campagne);a')).toBeFalse();
    });

    it('refuse les paramètres matriciels et les sorties nommées que le routeur analyse', () => {
      expect(urlRefusee('/fr/a;1=1;2=2')).toBeTrue();
      expect(urlRefusee('/fr/(secondaire:page)')).toBeTrue();
    });

    it('refuse la barre oblique inverse, qu un navigateur lit comme un hôte externe', () => {
      expect(urlRefusee('/\\evil.com/')).toBeTrue();
    });

    it('refuse une URL plus longue que la borne', () => {
      expect(urlRefusee(`/${'a'.repeat(LONGUEUR_MAX_D_UNE_URL)}`)).toBeTrue();
      expect(urlRefusee(`/${'a'.repeat(LONGUEUR_MAX_D_UNE_URL - 1)}`)).toBeFalse();
    });
  });

  describe('cheminCanonique', () => {
    it('garde un chemin deja canonique', () => {
      expect(cheminCanonique('/')).toBe('/');
      expect(cheminCanonique('/fr/')).toBe('/fr/');
      expect(cheminCanonique('/fr/contact')).toBe('/fr/contact');
      expect(cheminCanonique('/frais')).toBe('/frais');
    });

    it('ajoute le slash final a la racine d une locale, comme le canonical', () => {
      expect(cheminCanonique('/fr')).toBe('/fr/');
      expect(cheminCanonique('/en')).toBe('/en/');
    });

    it('retire le slash final des sous-pages', () => {
      expect(cheminCanonique('/fr/contact/')).toBe('/fr/contact');
      expect(cheminCanonique('/home/')).toBe('/home');
    });

    it('replie les slashs multiples', () => {
      expect(cheminCanonique('//fr//contact//')).toBe('/fr/contact');
      expect(cheminCanonique('/fr//')).toBe('/fr/');
    });

    it('resout les segments point, qu aucun fichier prerendu ne doit servir', () => {
      expect(cheminCanonique('/fr/contact/.')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/login/..')).toBe('/fr/');
      expect(cheminCanonique('/fr/zz/../contact')).toBe('/fr/contact');
      expect(cheminCanonique('/../..')).toBe('/');
      expect(cheminCanonique('/fr/.well-known')).toBe('/fr/.well-known');
      expect(cheminCanonique('/fr/a..b')).toBe('/fr/a..b');
    });

    it('resout les segments point encodes, comme les lit le moteur SSR', () => {
      expect(cheminCanonique('/x/%2e%2e/fr/contact')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/zz/%2E%2e/contact')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/zz/.%2e/contact')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/contact/%2e')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/caf%C3%A9')).toBe('/fr/caf%C3%A9');
    });

    it('decode les caracteres non reserves, que le routeur Angular lit decodes (RFC 3986 6.2.2.2)', () => {
      expect(cheminCanonique('/fr/%63ontact')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/%41-%7a%30%2D%5f%7E')).toBe('/fr/A-z0-_~');
      expect(cheminCanonique('/fr/a%2eb')).toBe('/fr/a.b');
      expect(cheminCanonique('/fr/contact/index%2ehtml')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/a%2fb')).toBe('/fr/a%2fb');
      expect(cheminCanonique('/fr/a%20b%25')).toBe('/fr/a%20b%25');
    });

    it('ramene un index.html a la page qu Angular rend pour lui', () => {
      expect(cheminCanonique('/fr/contact/index.html')).toBe('/fr/contact');
      expect(cheminCanonique('/fr/index.html')).toBe('/fr/');
      expect(cheminCanonique('/index.html')).toBe('/');
      expect(cheminCanonique('/fr/contact/index.htm')).toBe('/fr/contact/index.htm');
      expect(cheminCanonique('/fr/monindex.html')).toBe('/fr/monindex.html');
    });
  });

  describe('demandeUnDocument', () => {
    it('reconnait un fichier HTML du build, meme encode ou en capitales', () => {
      expect(demandeUnDocument('/fr/contact/index.html')).toBeTrue();
      expect(demandeUnDocument('/fr/contact/index%2ehtml')).toBeTrue();
      expect(demandeUnDocument('/fr/contact/%69ndex.html')).toBeTrue();
      expect(demandeUnDocument('/fr/INDEX.HTML')).toBeTrue();
      expect(demandeUnDocument('/fr/index.csr.html')).toBeTrue();
    });

    it('laisse au statique les ressources et les chemins mal encodes', () => {
      expect(demandeUnDocument('/fr/main-abc.js')).toBeFalse();
      expect(demandeUnDocument('/assets/images/logo.webp')).toBeFalse();
      expect(demandeUnDocument('/fr/contact/index.html/')).toBeFalse();
      expect(demandeUnDocument('/fr/%E0%A4%A')).toBeFalse();
    });
  });

  describe('buildBaseUrlFromRequest', () => {
    it('accepte un host allowliste depuis x-forwarded-host', () => {
      const req = stubRequest({
        headers: {
          'x-forwarded-host': 'asilidesign.fr',
          'x-forwarded-proto': 'https',
        },
        host: 'portfolio-web-fr',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('https://asilidesign.fr');
    });

    it('IGNORE un x-forwarded-host non allowliste (anti-poisoning) et retombe sur req.host', () => {
      const req = stubRequest({
        headers: {
          'x-forwarded-host': 'evil.example.com',
          'x-forwarded-proto': 'https',
        },
        host: 'asilidesign.fr',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('https://asilidesign.fr');
    });

    const requeteSansHoteAllowliste = () =>
      stubRequest({
        headers: { 'x-forwarded-host': 'evil.example.com' },
        host: 'also-evil.example.com',
      });

    it('retombe sur le fallback si ni forwarded ni host ne sont allowlistes', () => {
      expect(buildBaseUrlFromRequest(requeteSansHoteAllowliste(), 'https://asilidesign.fr')).toBe(
        'https://asilidesign.fr',
      );
    });

    it('retombe sur https://asilidesign.fr sans fallback fourni', () => {
      expect(buildBaseUrlFromRequest(requeteSansHoteAllowliste())).toBe('https://asilidesign.fr');
    });

    it('ignore un x-forwarded-proto non http/https et retombe sur req.protocol', () => {
      const req = stubRequest({
        headers: {
          'x-forwarded-host': 'asilidesign.fr',
          'x-forwarded-proto': 'javascript',
        },
        host: 'asilidesign.fr',
        protocol: 'https',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('https://asilidesign.fr');
    });

    it('respecte le proto forwarded http (allowliste) avec host allowliste', () => {
      const req = stubRequest({
        headers: {
          'x-forwarded-host': 'localhost',
          'x-forwarded-proto': 'http',
        },
        host: 'localhost',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('http://localhost');
    });

    it('traite le host insensiblement a la casse et au port', () => {
      const req = stubRequest({
        headers: { 'x-forwarded-host': 'ASILIDESIGN.FR:8080' },
        host: 'asilidesign.fr',
        protocol: 'https',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('https://ASILIDESIGN.FR:8080');
    });

    const HOTE_PIEGE = 'asilidesign.fr:/"><img src=x onerror=alert(1)>';

    it('IGNORE un x-forwarded-host allowliste suivi d autre chose qu un port (anti-poisoning)', () => {
      const req = stubRequest({
        headers: { 'x-forwarded-host': HOTE_PIEGE },
        host: 'www.asilidesign.fr',
      });
      expect(buildBaseUrlFromRequest(req)).toBe('https://www.asilidesign.fr');
    });

    it('IGNORE un host piege sans x-forwarded-host et retombe sur le fallback', () => {
      expect(buildBaseUrlFromRequest(stubRequest({ host: HOTE_PIEGE }))).toBe(
        'https://asilidesign.fr',
      );
    });

    it('expose la liste partagee des hotes autorises', () => {
      expect(ALLOWED_HOSTS).toContain('asilidesign.fr');
      expect(ALLOWED_HOSTS).toContain('www.asilidesign.fr');
      expect(ALLOWED_HOSTS).toContain('localhost');
      expect(ALLOWED_HOSTS).toContain('127.0.0.1');
      expect(ALLOWED_HOSTS).toContain('portfolio-web-fr');
      expect(ALLOWED_HOSTS).toContain('portfolio-web-en');
    });
  });
});
