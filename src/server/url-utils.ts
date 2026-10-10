import type express from 'express';
import { LOCALES_DU_SITE } from '../app/core/config/locales';
import { buildLocalizedPath, normalizePath, routeSansLocale } from '../app/core/seo/chemins';

export const cheminCanonique = (path: string): string => {
  const replie = path.replace(/\/{2,}/g, '/');
  const { locale, route } = routeSansLocale(replie, LOCALES_DU_SITE);
  if (locale !== undefined && route === '/') return buildLocalizedPath(locale, route);
  return normalizePath(replie);
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

const firstAllowedHost = (...candidates: (string | undefined)[]): string | undefined =>
  candidates.find(isAllowedHost);

export const buildBaseUrlFromRequest = (req: express.Request, fallback?: string): string => {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)
    ?.split(',')[0]
    ?.trim()
    ?.toLowerCase();
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const rawHost = req.get('host');

  const host = firstAllowedHost(forwardedHost, rawHost);

  if (host) {
    const protocol =
      forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : req.protocol;
    return `${protocol}://${host}`;
  }

  return fallback ?? 'https://asilidesign.fr';
};
