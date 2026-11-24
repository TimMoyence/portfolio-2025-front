import { METADONNEES_DU_SITE } from './site-servi';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import { langueDuSite } from '../config/locales';
import { type BlocJsonLd, type FicheServie, jsonLdDeLaPage, jsonLdDUneFiche } from './json-ld';
import { estIndexable, localeParDefaut } from './pages/pages-seo';
import type { SeoConfig } from './seo.interface';
import type { SeoPageEntry } from './seo-metadata.model';

@Injectable({
  providedIn: 'root',
})
export class SeoRegistryService {
  private readonly data = METADONNEES_DU_SITE;

  constructor(@Inject(LOCALE_ID) private localeId: string) {}

  getLocales(): string[] {
    return this.data.site.locales ?? [];
  }

  getLocaleId(): string {
    const normalizedLocale = langueDuSite(this.localeId);
    const locales = this.getLocales();
    if (locales.includes(normalizedLocale)) {
      return normalizedLocale;
    }
    return this.getDefaultLocale();
  }

  getDefaultLocale(): string {
    return localeParDefaut(this.data);
  }

  getJsonLdDeLaFiche(fiche: FicheServie): BlocJsonLd[] {
    return jsonLdDUneFiche(this.data, this.getLocaleId(), fiche);
  }

  getSeoByKey(key: string): Observable<SeoConfig> {
    const page = this.data.pages.find((entry) => entry.id === key);
    if (page === undefined) {
      throw new Error(`clé SEO « ${key} » absente de seo-metadata.json`);
    }
    return of(this.seoDeLaPage(page));
  }

  private seoDeLaPage(page: SeoPageEntry): SeoConfig {
    const localeKey = this.resolveLocaleKey(page);
    const localeMeta = page.locales[localeKey];
    const defaults = this.data.defaults ?? {};
    const seo = {
      title: localeMeta.title,
      description: localeMeta.description,
      keywords: localeMeta.keywords ?? defaults.keywords ?? [],
      ogTitle: localeMeta.ogTitle,
      ogDescription: localeMeta.ogDescription,
      ogImage: localeMeta.ogImage ?? defaults.ogImage,
      twitterCard: localeMeta.twitterCard ?? defaults.twitterCard,
      twitterTitle: localeMeta.twitterTitle,
      twitterDescription: localeMeta.twitterDescription,
      twitterImage: localeMeta.twitterImage ?? localeMeta.ogImage ?? defaults.ogImage,
    };
    return estIndexable(page)
      ? { ...seo, index: true, jsonLd: jsonLdDeLaPage(this.data, localeKey, page) }
      : { ...seo, index: false };
  }

  private resolveLocaleKey(page: SeoPageEntry): string {
    const locales = [this.localeId, langueDuSite(this.localeId), this.getDefaultLocale()].filter(
      Boolean,
    );

    for (const locale of locales) {
      if (page.locales[locale]) {
        return locale;
      }
    }

    const fallback = Object.keys(page.locales)[0];
    return fallback ?? this.getDefaultLocale();
  }
}
