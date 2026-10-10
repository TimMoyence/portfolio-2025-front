import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import type { Observable } from 'rxjs';
import { of } from 'rxjs';
import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { routeSansLocale } from './chemins';
import { pageSeoDeLaRoute } from './pages-seo';
import type { SeoConfig } from './seo.interface';
import type { SeoMetadataFile, SeoPageEntry } from './seo-metadata.model';

export interface SeoResolvedConfig {
  seo: SeoConfig;
  index: boolean;
  page: SeoPageEntry;
}

@Injectable({
  providedIn: 'root',
})
export class SeoRegistryService {
  private readonly data = seoMetadata as SeoMetadataFile;

  constructor(@Inject(LOCALE_ID) private localeId: string) {}

  getBaseUrl(): string | undefined {
    return this.data.site.baseUrl;
  }

  getLocales(): string[] {
    return this.data.site.locales ?? [];
  }

  getLocaleId(): string {
    const normalizedLocale = this.localeId.split('-')[0];
    const locales = this.getLocales();
    if (locales.includes(normalizedLocale)) {
      return normalizedLocale;
    }
    return this.getDefaultLocale();
  }

  getDefaultLocale(): string {
    return this.data.site.defaultLocale;
  }

  getSeoByKey(key: string): Observable<SeoResolvedConfig | null> {
    const page = this.data.pages.find((entry) => entry.id === key);
    return of(page ? this.buildResolved(page) : null);
  }

  getSeoByPath(rawPath: string): Observable<SeoResolvedConfig | null> {
    const { route } = routeSansLocale(rawPath, this.data.site.locales ?? []);
    const page = pageSeoDeLaRoute(this.data, route);
    return of(page ? this.buildResolved(page) : null);
  }

  private buildResolved(page: SeoPageEntry): SeoResolvedConfig {
    const localeKey = this.resolveLocaleKey(page);
    const localeMeta = page.locales[localeKey];
    const defaults = this.data.defaults ?? {};

    const seo: SeoConfig = {
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

    return {
      seo,
      index: page.index !== false,
      page,
    };
  }

  private resolveLocaleKey(page: SeoPageEntry): string {
    const locales = [
      this.localeId,
      this.localeId.split('-')[0],
      this.data.site.defaultLocale,
    ].filter(Boolean);

    for (const locale of locales) {
      if (page.locales[locale]) {
        return locale;
      }
    }

    const fallback = Object.keys(page.locales)[0];
    return fallback ?? this.data.site.defaultLocale;
  }
}
