import { DOCUMENT } from '@angular/common';
import { LOCALE_ID, inject } from '@angular/core';

export type LocaleDesArticles = 'fr' | 'en';

export function localeDesArticles(localeId: string, chemin: string): LocaleDesArticles {
  return localeId.toLowerCase().startsWith('en') || chemin.startsWith('/en') ? 'en' : 'fr';
}

export function injecterLocaleDesArticles(): LocaleDesArticles {
  return localeDesArticles(inject(LOCALE_ID), inject(DOCUMENT).location.pathname);
}
