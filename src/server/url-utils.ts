import type express from "express";

/** Locales supportees — unique source de verite pour le routing SSR. */
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
const LOCALE_PATTERN = SUPPORTED_LOCALES.join("|");

/** Detecte un chemin locale-seul (/fr/, /en/) pour exempter de la normalisation. */
export const LOCALE_BARE_PATH = new RegExp(`^\\/(${LOCALE_PATTERN})\\/$`);

/** Extrait le prefixe locale d'une URL (/fr/..., /en/...). */
export const LOCALE_PREFIX_RE = new RegExp(`^\\/(${LOCALE_PATTERN})(?=\\/|$)`);

/** Supprime le prefixe locale d'un chemin (/fr/contact -> contact). */
export const STRIP_LOCALE_RE = new RegExp(`^\\/(${LOCALE_PATTERN})\\/?`);

/**
 * Normalise un chemin : retire les query/fragment, retire les slashes
 * initiaux et finaux, garantit un prefixe `/` (ou `/` racine seule).
 */
export const normalizePath = (path: string): string => {
  const clean = path.split("?")[0].split("#")[0];
  const trimmed = clean.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `/${trimmed}` : "/";
};

/**
 * Construit un chemin localise (ex: "fr" + "/contact" -> "/fr/contact").
 *
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
  if (normalized === "/") return `/${locale}/`;
  return normalizePath(`/${locale}${normalized}`);
};

/**
 * Resout la base URL (scheme + host) en respectant les headers
 * `X-Forwarded-Proto` / `X-Forwarded-Host` du reverse-proxy en amont.
 * Fallback sur `req.protocol` + `req.host` sinon.
 */
export const buildBaseUrlFromRequest = (
  req: express.Request,
  fallback?: string,
): string => {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string)
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = (req.headers["x-forwarded-host"] as string)
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || req.get("host");
  const protocol = forwardedProto || req.protocol;

  if (host) {
    return `${protocol}://${host}`;
  }

  return fallback ?? "https://asilidesign.fr";
};
