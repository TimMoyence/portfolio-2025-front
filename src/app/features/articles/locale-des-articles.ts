export type LocaleDesArticles = 'fr' | 'en';

export function localeDesArticles(localeId: string, chemin: string): LocaleDesArticles {
  return localeId.toLowerCase().startsWith('en') || chemin.startsWith('/en') ? 'en' : 'fr';
}
