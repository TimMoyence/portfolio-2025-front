import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { Observable, of } from "rxjs";
import seoMetadata from "../../../assets/seo/seo-metadata.json";
import { SeoConfig } from "./seo.interface";
import { SeoMetadataFile, SeoPageEntry } from "./seo-metadata.model";

export interface SeoResolvedConfig {
  seo: SeoConfig;
  index: boolean;
  page: SeoPageEntry;
}

@Injectable({
  providedIn: "root",
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
    return this.localeId;
  }

  getSeoByKey(key: string): Observable<SeoResolvedConfig | null> {
    const page = this.data.pages.find((entry) => entry.id === key);
    return of(page ? this.buildResolved(page) : null);
  }

  getSeoByPath(rawPath: string): Observable<SeoResolvedConfig | null> {
    const normalizedPath = this.normalizeRequestPath(rawPath);
    const page = this.data.pages.find(
      (entry) => this.normalizePagePath(entry.path) === normalizedPath,
    );
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
      this.localeId.split("-")[0],
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

  private normalizeRequestPath(rawPath: string): string {
    const clean = rawPath.split("?")[0].split("#")[0];
    const trimmed = this.trimSlashes(clean);
    const withoutLocale = this.stripLocalePrefix(trimmed);
    const normalized = withoutLocale ? `/${withoutLocale}` : "/";

    if (normalized === "/" && this.data.site.homePath) {
      return this.normalizePagePath(this.data.site.homePath);
    }

    return normalized;
  }

  private normalizePagePath(path: string): string {
    const clean = path.split("?")[0].split("#")[0];
    const trimmed = this.trimSlashes(clean);
    return trimmed ? `/${trimmed}` : "/";
  }

  private trimSlashes(path: string): string {
    return path.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  private stripLocalePrefix(path: string): string {
    if (!path) return "";

    const locales = this.data.site.locales ?? [];
    const segments = path.split("/").filter(Boolean);

    if (segments.length && locales.includes(segments[0])) {
      segments.shift();
    }

    return segments.join("/");
  }
}
