import { trimLeadingSlashes, trimTrailingSlashes } from '../utils/barres';

export const normalizePath = (path: string): string => {
  const clean = path.split('?')[0].split('#')[0];
  const trimmed = trimTrailingSlashes(trimLeadingSlashes(clean));
  return trimmed ? `/${trimmed}` : '/';
};

export const buildLocalizedPath = (locale: string, path: string): string => {
  const normalized = normalizePath(path);
  if (!locale) return normalized;
  if (normalized === '/') return `/${locale}/`;
  return normalizePath(`/${locale}${normalized}`);
};

export const estAliasDAccueil = (route: string): boolean => route === '/' || route === '/home';

export interface RouteLocalisee {
  readonly locale?: string;
  readonly route: string;
}

export const routeSansLocale = (chemin: string, locales: readonly string[]): RouteLocalisee => {
  const normalise = normalizePath(chemin);
  const premier = normalise.split('/')[1];
  if (!locales.includes(premier)) return { locale: undefined, route: normalise };
  return { locale: premier, route: normalizePath(normalise.slice(premier.length + 1)) };
};

export const cheminEnLocale = (
  chemin: string,
  locale: string,
  locales: readonly string[],
): string => buildLocalizedPath(locale, routeSansLocale(chemin, locales).route);

export const urlAbsolue = (base: string, chemin: string): string =>
  `${trimTrailingSlashes(base)}/${trimLeadingSlashes(chemin)}`;

export const urlLocalisee = (base: string, locale: string, chemin: string): string =>
  urlAbsolue(base, buildLocalizedPath(locale, chemin));
