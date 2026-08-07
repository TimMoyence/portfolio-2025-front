import type express from 'express';

/**
 * Table des redirections HTTP permanentes (301) servies par le serveur Express.
 *
 * Ces URLs ont ete indexees puis retirees ou renommees : elles doivent renvoyer
 * un vrai 301 au niveau HTTP. Les `redirectTo` declares dans le router Angular
 * ne suffisent pas : le SSR les resout en interne et renverrait un 200 portant
 * le contenu de la cible a l'ancienne URL — un duplicata indexable sans
 * canonical, puisque l'ancienne URL n'a plus d'entree dans seo-metadata.json.
 */
export const PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  '/home': '/fr',
  '/fr/home': '/fr',
  '/en/home': '/en',
  '/client-project': '/fr/projets',
  '/fr/client-project': '/fr/projets',
  '/en/client-project': '/en/projets',
};

export const REDIRECT_SOURCES: string[] = Object.keys(PERMANENT_REDIRECTS);

/**
 * Reproduit le matching d'Express, configure par defaut en
 * `case sensitive routing: false` et `strict routing: false` : `/HOME` et
 * `/home/` atteignaient deja les handlers `app.get("/home")` d'origine.
 */
const normalizeForLookup = (path: string): string => {
  const lower = path.toLowerCase();
  if (lower.length > 1 && lower.endsWith('/')) {
    return lower.replace(/\/+$/, '');
  }
  return lower;
};

export const resolveRedirect = (path: string): string | null =>
  PERMANENT_REDIRECTS[normalizeForLookup(path)] ?? null;

export const registerPermanentRedirects = (app: express.Application): void => {
  app.get(REDIRECT_SOURCES, (req, res, next) => {
    const target = resolveRedirect(req.path);
    if (!target) {
      next();
      return;
    }
    res.redirect(301, target);
  });
};
