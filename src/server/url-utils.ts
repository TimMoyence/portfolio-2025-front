import type express from 'express';

export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
const LOCALE_PATTERN = SUPPORTED_LOCALES.join('|');

export const LOCALE_BARE_PATH = new RegExp(`^\\/(${LOCALE_PATTERN})\\/$`);

export const LOCALE_PREFIX_RE = new RegExp(`^\\/(${LOCALE_PATTERN})(?=\\/|$)`);

export const STRIP_LOCALE_RE = new RegExp(`^\\/(${LOCALE_PATTERN})\\/?`);

export const normalizePath = (path: string): string => {
  const clean = path.split('?')[0].split('#')[0];
  const trimmed = clean.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed ? `/${trimmed}` : '/';
};

/**
 * La racine locale est emise AVEC trailing slash (`/fr/`, `/en/`) pour
 * coherence avec le comportement nginx en production : le reverse-proxy
 * ajoute systematiquement un slash a `/fr` -> 301 -> `/fr/`. Sitemap et
 * canonical doivent donc pointer directement sur `/fr/` pour eviter une
 * contradiction canonique (`<loc>/fr</loc>` -> 301 -> page servie en
 * `/fr/` dont le canonical pointerait a nouveau sur `/fr`).
 */
export const buildLocalizedPath = (locale: string, path: string): string => {
  const normalized = normalizePath(path);
  if (!locale) return normalized;
  if (normalized === '/') return `/${locale}/`;
  return normalizePath(`/${locale}${normalized}`);
};

export const ALLOWED_HOSTS = [
  'asilidesign.fr',
  'www.asilidesign.fr',
  'localhost',
  '127.0.0.1',
  'portfolio-web-fr',
  'portfolio-web-en',
] as const;

const ALLOWED_HOSTS_SET = new Set<string>(ALLOWED_HOSTS.map((h) => h.toLowerCase()));

const isAllowedHost = (host: string | undefined): host is string => {
  if (!host) return false;
  const bareHost = host.split(':')[0].trim().toLowerCase();
  return ALLOWED_HOSTS_SET.has(bareHost);
};

export const buildBaseUrlFromRequest = (req: express.Request, fallback?: string): string => {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)
    ?.split(',')[0]
    ?.trim()
    ?.toLowerCase();
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const rawHost = req.get('host');

  const host = isAllowedHost(forwardedHost)
    ? forwardedHost
    : isAllowedHost(rawHost)
      ? rawHost
      : undefined;

  if (host) {
    const protocol =
      forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : req.protocol;
    return `${protocol}://${host}`;
  }

  return fallback ?? 'https://asilidesign.fr';
};
