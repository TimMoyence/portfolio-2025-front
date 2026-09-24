import type express from 'express';
import {
  PERMANENT_REDIRECTS,
  REDIRECT_SOURCES,
  registerPermanentRedirects,
  resolveRedirect,
} from './redirects';

interface RegisteredRoute {
  paths: string[];
  handler: express.RequestHandler;
}

const stubApp = (): { app: express.Application; routes: RegisteredRoute[] } => {
  const routes: RegisteredRoute[] = [];
  const app = {
    get: (paths: string | string[], handler: express.RequestHandler): void => {
      routes.push({
        paths: Array.isArray(paths) ? paths : [paths],
        handler,
      });
    },
  } as unknown as express.Application;
  return { app, routes };
};

interface RedirectCall {
  status: number;
  location: string;
}

const stubResponse = (): { res: express.Response; calls: RedirectCall[] } => {
  const calls: RedirectCall[] = [];
  const res = {
    redirect: (status: number, location: string): void => {
      calls.push({ status, location });
    },
  } as unknown as express.Response;
  return { res, calls };
};

const runHandler = (
  handler: express.RequestHandler,
  path: string,
): { calls: RedirectCall[]; nextCalled: boolean } => {
  const { res, calls } = stubResponse();
  let nextCalled = false;
  handler({ path } as express.Request, res, () => {
    nextCalled = true;
  });
  return { calls, nextCalled };
};

describe('redirects', () => {
  describe('resolveRedirect', () => {
    it("redirige l'ancienne etude de cas vers /projets, locale preservee", () => {
      expect(resolveRedirect('/client-project')).toBe('/fr/projets');
      expect(resolveRedirect('/fr/client-project')).toBe('/fr/projets');
      expect(resolveRedirect('/en/client-project')).toBe('/en/projets');
    });

    it('redirige /home vers la racine localisee', () => {
      expect(resolveRedirect('/home')).toBe('/fr');
      expect(resolveRedirect('/fr/home')).toBe('/fr');
      expect(resolveRedirect('/en/home')).toBe('/en');
    });

    it("redirige l'atelier retire et chacune de ses sous-pages vers /projets, locale preservee", () => {
      expect(resolveRedirect('/atelier')).toBe('/fr/projets');
      expect(resolveRedirect('/atelier/meteo/app')).toBe('/fr/projets');
      expect(resolveRedirect('/fr/atelier')).toBe('/fr/projets');
      expect(resolveRedirect('/fr/atelier/sebastian/app/badges')).toBe('/fr/projets');
      expect(resolveRedirect('/en/atelier')).toBe('/en/projets');
      expect(resolveRedirect('/en/Atelier/meteo/')).toBe('/en/projets');
    });

    it('redirige le module budget retire vers la racine localisee', () => {
      expect(resolveRedirect('/commonbudgetTM')).toBe('/fr');
      expect(resolveRedirect('/fr/commonbudgetTM')).toBe('/fr');
      expect(resolveRedirect('/en/commonbudgetTM')).toBe('/en');
    });

    it('ne prend pas pour l atelier un chemin qui en partage seulement le debut', () => {
      expect(resolveRedirect('/ateliers')).toBeNull();
      expect(resolveRedirect('/fr/atelier-ia')).toBeNull();
    });

    it('ne redirige pas un chemin hors table', () => {
      expect(resolveRedirect('/projets')).toBeNull();
      expect(resolveRedirect('/fr/projets')).toBeNull();
      expect(resolveRedirect('/')).toBeNull();
      expect(resolveRedirect('/fr/contact')).toBeNull();
      expect(resolveRedirect('/client-project-bis')).toBeNull();
      expect(resolveRedirect('/fr/client-project/detail')).toBeNull();
    });

    it('reproduit le matching Express : insensible a la casse et au slash final', () => {
      expect(resolveRedirect('/CLIENT-PROJECT')).toBe('/fr/projets');
      expect(resolveRedirect('/FR/Client-Project')).toBe('/fr/projets');
      expect(resolveRedirect('/home/')).toBe('/fr');
      expect(resolveRedirect('/en/home/')).toBe('/en');
    });

    it('expose la liste des chemins sources alignee sur la table', () => {
      expect(REDIRECT_SOURCES).toEqual(Object.keys(PERMANENT_REDIRECTS));
      expect(REDIRECT_SOURCES).toContain('/client-project');
      expect(REDIRECT_SOURCES).toContain('/fr/client-project');
      expect(REDIRECT_SOURCES).toContain('/en/client-project');
    });
  });

  describe('registerPermanentRedirects', () => {
    it('enregistre les sources sur une seule route GET', () => {
      const { app, routes } = stubApp();

      registerPermanentRedirects(app);

      expect(routes.length).toBe(1);
      expect(routes[0].paths).toEqual(jasmine.arrayContaining(REDIRECT_SOURCES));
    });

    it('emet un vrai 301 vers la cible attendue pour chaque source', () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);
      const handler = routes[0].handler;

      for (const [source, target] of Object.entries(PERMANENT_REDIRECTS)) {
        const { calls, nextCalled } = runHandler(handler, source);

        expect(calls)
          .withContext(`${source} devrait rediriger en 301 vers ${target}`)
          .toEqual([{ status: 301, location: target }]);
        expect(nextCalled).withContext(`${source} ne devrait pas poursuivre la chaine`).toBeFalse();
      }
    });

    it('verrouille le comportement observable mesure en production', () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);
      const handler = routes[0].handler;

      expect(runHandler(handler, '/client-project').calls).toEqual([
        { status: 301, location: '/fr/projets' },
      ]);
      expect(runHandler(handler, '/fr/client-project').calls).toEqual([
        { status: 301, location: '/fr/projets' },
      ]);
      expect(runHandler(handler, '/en/client-project').calls).toEqual([
        { status: 301, location: '/en/projets' },
      ]);
    });

    it("ecoute toutes les sous-pages de l'atelier et emet un 301 pour elles", () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);

      expect(routes[0].paths).toEqual(
        jasmine.arrayContaining(['/atelier/*', '/fr/atelier/*', '/en/atelier/*']),
      );
      expect(runHandler(routes[0].handler, '/en/atelier/meteo/app').calls).toEqual([
        { status: 301, location: '/en/projets' },
      ]);
    });

    it("passe au middleware suivant si le chemin n'est pas dans la table", () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);

      const { calls, nextCalled } = runHandler(routes[0].handler, '/projets');

      expect(calls).toEqual([]);
      expect(nextCalled).toBeTrue();
    });
  });
});
