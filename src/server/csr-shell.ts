import fs from 'node:fs';
import { resolve } from 'node:path';

/**
 * Detection et service de la coquille CSR pour les routes qui doivent etre
 * rendues cote client uniquement. Pour ces routes, le SSR classique redirige
 * vers /login (le guard ne peut pas lire localStorage cote serveur), ce qui
 * casse le reload. On sert a la place la coquille CSR (index.csr.html) :
 * un HTML minimal avec les scripts Angular, qui laisse le client gerer le
 * routing apres hydratation.
 *
 * Les routes listees ici DOIVENT correspondre a celles marquees
 * `RenderMode.Client` dans `src/app/app.routes.server.ts`.
 */
const CLIENT_ONLY_ROUTE_PATTERNS: RegExp[] = [
  /^profil\/?$/,
  /^atelier\/meteo\/app(\/|$)/,
  /^atelier\/sebastian\/app(\/|$)/,
];

export const isClientOnlyRoute = (routePath: string): boolean => {
  const normalized = routePath.replace(/^\//, '');
  return CLIENT_ONLY_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const loadCsrShell = (locale: string | null, browserDistFolder: string): string | null => {
  const candidates = [
    locale ? resolve(browserDistFolder, locale, 'index.csr.html') : null,
    resolve(browserDistFolder, 'index.csr.html'),
  ].filter((p): p is string => p !== null);

  for (const candidate of candidates) {
    if (candidate.startsWith(browserDistFolder) && fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf-8');
    }
  }
  return null;
};
