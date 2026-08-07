import type express from 'express';

/**
 * Table des redirections HTTP permanentes (301) servies par le serveur Express.
 *
 * Ces URLs ont ete indexees puis retirees ou renommees : elles doivent renvoyer
 * un vrai 301 au niveau HTTP. Les `redirectTo` declares dans le router Angular
 * ne suffisent pas : le SSR les resout en interne et renverrait un 200 portant
 * le contenu de la cible a l'ancienne URL — un duplicata indexable sans
 * canonical, puisque l'ancienne URL n'a plus d'entree dans seo-metadata.json.
 *
 * Les cles sont des chemins en minuscules et sans slash final (voir
 * {@link resolveRedirect}) ; les valeurs sont les cibles telles qu'emises dans
 * l'entete `Location`.
 */
export const PERMANENT_REDIRECTS: Readonly<Record<string, string>> = {
  '/home': '/fr',
  '/fr/home': '/fr',
  '/en/home': '/en',
  '/client-project': '/fr/projets',
  '/fr/client-project': '/fr/projets',
  '/en/client-project': '/en/projets',
};

/** Chemins sources enregistres aupres d'Express, dans l'ordre de la table. */
export const REDIRECT_SOURCES: string[] = Object.keys(PERMANENT_REDIRECTS);

/**
 * Normalise un chemin pour la recherche dans {@link PERMANENT_REDIRECTS}.
 *
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

/**
 * Resout la cible d'une redirection permanente pour un chemin donne.
 *
 * Fonction pure : aucun effet de bord, sortie deterministe.
 *
 * @param path Chemin de la requete (`req.path`, sans query ni fragment).
 * @returns La cible du 301, ou `null` si le chemin n'est pas concerne.
 */
export const resolveRedirect = (path: string): string | null =>
  PERMANENT_REDIRECTS[normalizeForLookup(path)] ?? null;

/**
 * Enregistre les redirections permanentes sur l'application Express.
 *
 * Une seule route GET est declaree pour l'ensemble des sources : le matching
 * (casse, slash final, methodes GET/HEAD uniquement) reste donc celui d'Express,
 * et {@link resolveRedirect} determine la cible. Un chemin non resolu passe au
 * middleware suivant plutot que de renvoyer une redirection arbitraire.
 *
 * @param app Application Express sur laquelle poser la route.
 */
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
