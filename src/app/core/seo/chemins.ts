export const trimTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
};

const trimLeadingSlashes = (value: string): string => {
  let start = 0;
  while (start < value.length && value[start] === '/') start += 1;
  return value.slice(start);
};

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
  const segments = normalizePath(chemin).split('/').filter(Boolean);
  const locale =
    segments[0] !== undefined && locales.includes(segments[0]) ? segments.shift() : undefined;
  return { locale, route: `/${segments.join('/')}` };
};
