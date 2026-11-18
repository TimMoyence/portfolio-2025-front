import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { langueDuSite } from '../config/locales';
import { routeSansLocale } from './chemins';
import { type BlocJsonLd, jsonLdDeLaPage } from './json-ld';
import { estIndexable, localeParDefaut, pageSeoDeLaRoute } from './pages-seo';
import type { SeoConfig } from './seo.interface';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

@Injectable({
  providedIn: 'root',
})
export class SeoRegistryService {
  private readonly data = seoMetadata as SeoMetadataFile;

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

  getJsonLdDuSite(): BlocJsonLd[] {
    return jsonLdDeLaPage(this.data, this.getLocaleId());
  }

  getSeoByKey(key: string): Observable<SeoConfig | null> {
    const page = this.data.pages.find((entry) => entry.id === key);
    return of(page ? this.seoDeLaPage(page) : null);
  }

  getSeoByPath(rawPath: string): Observable<SeoConfig | null> {
    const { route } = routeSansLocale(rawPath, this.data.site.locales ?? []);
    const page = pageSeoDeLaRoute(this.data, route);
    return of(page ? this.seoDeLaPage(page) : null);
  }

  private seoDeLaPage(page: SeoPageEntry): SeoConfig {
    const localeKey = this.resolveLocaleKey(page);
    const localeMeta = page.locales[localeKey];
    const defaults = this.data.defaults ?? {};

    return {
      index: estIndexable(page),
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
      jsonLd: jsonLdDeLaPage(this.data, localeKey, page),
    };
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
