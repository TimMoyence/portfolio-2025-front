/**
 * Politique de securite du contenu (CSP) appliquee en mode Report-Only.
 *
 * Volontairement permissive et NON bloquante (`Content-Security-Policy-Report-Only`)
 * pour ne pas risquer de casser le rendu SSR/hydratation : elle se contente de
 * journaliser les violations cote navigateur. Les origines listees correspondent
 * aux ressources reellement chargees par l'application :
 * - `plausible.io` : analytics (script + events).
 * - `accounts.google.com` / `apis.google.com` : OAuth Google.
 * - `nominatim.openstreetmap.org` : reverse-geocoding (app meteo).
 * - `api.rainviewer.com` : index des tuiles radar (app meteo).
 * - `img-src ... https:` couvre les tuiles cartographiques (cartocdn, rainviewer).
 * - `style-src 'unsafe-inline'` requis par Angular (styles inline d'hydratation).
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "frame-ancestors 'self'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' https://plausible.io https://accounts.google.com https://apis.google.com",
  "connect-src 'self' https://plausible.io https://nominatim.openstreetmap.org https://api.rainviewer.com",
  "font-src 'self' data:",
].join('; ');

export interface SecurityHeadersOptions {
  isHttps: boolean;
}

/**
 * Le `Strict-Transport-Security` n'est emis qu'en HTTPS pour ne pas forcer le
 * HTTPS en developpement local (http://localhost).
 */
export const buildSecurityHeaders = (opts: SecurityHeadersOptions): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy-Report-Only': CSP_REPORT_ONLY,
  };

  if (opts.isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains';
  }

  return headers;
};
