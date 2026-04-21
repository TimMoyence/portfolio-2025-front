import type { I18nString } from "./formation.types";

/**
 * Locales supportees pour les champs `I18nString`. Correspond a la
 * source de verite cote serveur (`SUPPORTED_LOCALES` dans `url-utils`).
 */
export type SupportedLocale = "fr" | "en";

const SUPPORTED_LOCALES: ReadonlyArray<SupportedLocale> = ["fr", "en"];

/**
 * Defaut utilise quand `LOCALE_ID` est inconnu (tests unitaires sans
 * provider explicite, valeurs d'Angular en contexte non-i18n). Cohere
 * avec `metadata.site.defaultLocale`.
 */
const DEFAULT_LOCALE: SupportedLocale = "fr";

/**
 * Normalise un `LOCALE_ID` Angular (`"fr"`, `"en-US"`, `"fr-FR"`, ...) en
 * l'une des locales supportees. Le token `LOCALE_ID` utilise par Angular
 * peut contenir un suffixe region (`fr-FR`, `en-GB`). On extrait le
 * prefixe ISO-639-1 et on retombe sur la locale par defaut quand la
 * valeur n'est pas supportee.
 */
export const normalizeLocale = (
  raw: string | null | undefined,
): SupportedLocale => {
  if (!raw) return DEFAULT_LOCALE;
  const primary = raw.split(/[-_]/)[0]?.toLowerCase();
  return SUPPORTED_LOCALES.includes(primary as SupportedLocale)
    ? (primary as SupportedLocale)
    : DEFAULT_LOCALE;
};

/**
 * Retourne la valeur localisee d'un `I18nString`. Le type garantit la
 * presence des locales fr/en au moment de la compilation ; si une valeur
 * est volontairement vide (placeholder, oubli), on retourne la chaine
 * vide au lieu de masquer l'erreur par un fallback silencieux.
 */
export const selectLocalizedString = (
  value: I18nString,
  locale: SupportedLocale,
): string => value[locale];
