import { DOCUMENT } from '@angular/common';
import { LOCALE_ID, inject } from '@angular/core';
import { routeSansLocale } from '../seo/chemins';
import { LOCALES_DU_SITE, langueDuSite } from './locales';

export type LocaleDuSite = (typeof LOCALES_DU_SITE)[number];

export function localeDeLaPage(localeId: string, chemin: string): LocaleDuSite {
  return langueDuSite(localeId) === 'en' || routeSansLocale(chemin, LOCALES_DU_SITE).locale === 'en'
    ? 'en'
    : 'fr';
}

export function injecterLocaleDeLaPage(): LocaleDuSite {
  return localeDeLaPage(inject(LOCALE_ID), inject(DOCUMENT).location.pathname);
}
