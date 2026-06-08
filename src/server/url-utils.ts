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
 * Liste des hotes autorises a apparaitre dans les URLs canoniques/SEO.
 *
 * Source UNIQUE partagee : utilisee a la fois pour valider
 * `x-forwarded-host` (anti-poisoning de `<link rel=canonical>` / hreflang /
 * sitemap / robots / llms.txt) et pour configurer `CommonEngine.allowedHosts`
 * dans `server.ts`. Toute divergence entre les deux est ainsi evitee.
 */
export const ALLOWED_HOSTS = [
  "asilidesign.fr",
  "www.asilidesign.fr",
  "localhost",
  "127.0.0.1",
  "portfolio-web-fr",
  "portfolio-web-en",
] as const;

const ALLOWED_HOSTS_SET = new Set<string>(
  ALLOWED_HOSTS.map((h) => h.toLowerCase()),
);

/**
 * Indique si un host (avec port eventuel) fait partie de l'allowlist.
 * Comparaison insensible a la casse et au port.
 */
const isAllowedHost = (host: string | undefined): host is string => {
  if (!host) return false;
  const bareHost = host.split(":")[0].trim().toLowerCase();
  return ALLOWED_HOSTS_SET.has(bareHost);
};

/**
 * Resout la base URL (scheme + host) en respectant les headers
 * `X-Forwarded-Proto` / `X-Forwarded-Host` du reverse-proxy en amont.
 *
 * Le host (forwarded en priorite, sinon `req.host`) est VALIDE contre
 * {@link ALLOWED_HOSTS} : un `x-forwarded-host` injecte (non allowliste) est
 * ignore au profit de `req.get('host')` s'il est legitime, sinon du
 * `fallback`, sinon de `https://asilidesign.fr`. Cela empeche l'empoisonnement
 * des URLs canoniques/SEO. Le `x-forwarded-proto` n'est retenu que s'il vaut
 * `http` ou `https`.
 *
 * @param req Requete Express entrante.
 * @param fallback Base URL de repli si aucun host legitime n'est trouve.
 * @returns Une base URL (`scheme://host`) avec un host garanti allowliste.
 */
export const buildBaseUrlFromRequest = (
  req: express.Request,
  fallback?: string,
): string => {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string)
    ?.split(",")[0]
    ?.trim()
    ?.toLowerCase();
  const forwardedHost = (req.headers["x-forwarded-host"] as string)
    ?.split(",")[0]
    ?.trim();
  const rawHost = req.get("host");

  // Choisit le premier host allowliste : forwarded puis req.host.
  const host = isAllowedHost(forwardedHost)
    ? forwardedHost
    : isAllowedHost(rawHost)
      ? rawHost
      : undefined;

  if (host) {
    const protocol =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : req.protocol;
    return `${protocol}://${host}`;
  }

  return fallback ?? "https://asilidesign.fr";
};
