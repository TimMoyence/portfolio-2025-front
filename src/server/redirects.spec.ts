import type express from "express";
import {
  PERMANENT_REDIRECTS,
  REDIRECT_SOURCES,
  registerPermanentRedirects,
  resolveRedirect,
} from "./redirects";

/** Route capturee lors de l'enregistrement sur l'application Express stub. */
interface RegisteredRoute {
  paths: string[];
  handler: express.RequestHandler;
}

/**
 * Construit un stub minimal d'`express.Application` qui capture les routes
 * enregistrees au lieu de demarrer un serveur.
 */
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

/** Redirection observee sur la reponse stub (code HTTP + entete Location). */
interface RedirectCall {
  status: number;
  location: string;
}

/** Construit un stub d'`express.Response` qui enregistre les `res.redirect`. */
const stubResponse = (): { res: express.Response; calls: RedirectCall[] } => {
  const calls: RedirectCall[] = [];
  const res = {
    redirect: (status: number, location: string): void => {
      calls.push({ status, location });
    },
  } as unknown as express.Response;
  return { res, calls };
};

/**
 * Joue le handler enregistre pour un chemin donne et retourne ce qui a ete
 * observe : redirection eventuelle et passage au middleware suivant.
 */
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

describe("redirects", () => {
  describe("resolveRedirect", () => {
    it("redirige l'ancienne etude de cas vers /projets, locale preservee", () => {
      expect(resolveRedirect("/client-project")).toBe("/fr/projets");
      expect(resolveRedirect("/fr/client-project")).toBe("/fr/projets");
      expect(resolveRedirect("/en/client-project")).toBe("/en/projets");
    });

    it("redirige /home vers la racine localisee", () => {
      expect(resolveRedirect("/home")).toBe("/fr");
      expect(resolveRedirect("/fr/home")).toBe("/fr");
      expect(resolveRedirect("/en/home")).toBe("/en");
    });

    it("ne redirige pas un chemin hors table", () => {
      expect(resolveRedirect("/projets")).toBeNull();
      expect(resolveRedirect("/fr/projets")).toBeNull();
      expect(resolveRedirect("/")).toBeNull();
      expect(resolveRedirect("/fr/contact")).toBeNull();
      expect(resolveRedirect("/client-project-bis")).toBeNull();
      expect(resolveRedirect("/fr/client-project/detail")).toBeNull();
    });

    it("reproduit le matching Express : insensible a la casse et au slash final", () => {
      // Express est configure par defaut en `case sensitive routing: false`
      // et `strict routing: false` : ces variantes atteignaient deja les
      // anciens handlers `app.get("/client-project")`.
      expect(resolveRedirect("/CLIENT-PROJECT")).toBe("/fr/projets");
      expect(resolveRedirect("/FR/Client-Project")).toBe("/fr/projets");
      expect(resolveRedirect("/home/")).toBe("/fr");
      expect(resolveRedirect("/en/home/")).toBe("/en");
    });

    it("expose la liste des chemins sources alignee sur la table", () => {
      expect(REDIRECT_SOURCES).toEqual(Object.keys(PERMANENT_REDIRECTS));
      expect(REDIRECT_SOURCES).toContain("/client-project");
      expect(REDIRECT_SOURCES).toContain("/fr/client-project");
      expect(REDIRECT_SOURCES).toContain("/en/client-project");
    });
  });

  describe("registerPermanentRedirects", () => {
    it("enregistre les sources sur une seule route GET", () => {
      const { app, routes } = stubApp();

      registerPermanentRedirects(app);

      expect(routes.length).toBe(1);
      expect(routes[0].paths).toEqual(REDIRECT_SOURCES);
    });

    it("emet un vrai 301 vers la cible attendue pour chaque source", () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);
      const handler = routes[0].handler;

      for (const [source, target] of Object.entries(PERMANENT_REDIRECTS)) {
        const { calls, nextCalled } = runHandler(handler, source);

        expect(calls)
          .withContext(`${source} devrait rediriger en 301 vers ${target}`)
          .toEqual([{ status: 301, location: target }]);
        expect(nextCalled)
          .withContext(`${source} ne devrait pas poursuivre la chaine`)
          .toBeFalse();
      }
    });

    it("verrouille le comportement observable mesure en production", () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);
      const handler = routes[0].handler;

      expect(runHandler(handler, "/client-project").calls).toEqual([
        { status: 301, location: "/fr/projets" },
      ]);
      expect(runHandler(handler, "/fr/client-project").calls).toEqual([
        { status: 301, location: "/fr/projets" },
      ]);
      expect(runHandler(handler, "/en/client-project").calls).toEqual([
        { status: 301, location: "/en/projets" },
      ]);
    });

    it("passe au middleware suivant si le chemin n'est pas dans la table", () => {
      const { app, routes } = stubApp();
      registerPermanentRedirects(app);

      const { calls, nextCalled } = runHandler(routes[0].handler, "/projets");

      expect(calls).toEqual([]);
      expect(nextCalled).toBeTrue();
    });
  });
});
