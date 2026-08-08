import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { SeoConfig } from './seo.interface';

const OG_LOCALE_MAP: Record<string, string> = {
  fr: 'fr_FR',
  en: 'en_US',
};

const TWITTER_HANDLE = '@timmoyence';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document,
    @Inject(LOCALE_ID) private localeId: string,
  ) {}

  updateSeoMetadata(config: SeoConfig): void {
    if (!this.document) return;

    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });

    if (config.keywords && config.keywords.length > 0)
      this.meta.updateTag({
        name: 'keywords',
        content: config.keywords.join(', '),
      });

    this.updateOpenGraphTags(config);
    this.updateTwitterTags(config);

    if (config.robots) {
      this.meta.updateTag({ name: 'robots', content: config.robots });
    }

    if (config.canonicalUrl) {
      this.updateCanonicalLink(config.canonicalUrl);
    }

    if (config.hreflangs) {
      this.updateHreflangLinks(config.hreflangs);
    }

    this.updateJsonLd(config);
  }

  private updateOpenGraphTags(config: SeoConfig): void {
    this.meta.updateTag({
      property: 'og:title',
      content: config.ogTitle || config.title,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: config.ogDescription || config.description,
    });

    if (config.ogImage) this.meta.updateTag({ property: 'og:image', content: config.ogImage });

    if (config.ogUrl) this.meta.updateTag({ property: 'og:url', content: config.ogUrl });

    this.meta.updateTag({
      property: 'og:type',
      content: config.ogType || 'website',
    });

    this.updateOgLocaleTags();

    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Asili Design',
    });
  }

  private updateOgLocaleTags(): void {
    const currentLocale = this.resolveLocaleKey();
    const currentOgLocale = OG_LOCALE_MAP[currentLocale] ?? OG_LOCALE_MAP['fr'];
    this.meta.updateTag({ property: 'og:locale', content: currentOgLocale });

    this.document
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((node) => node.remove());

    for (const [localeKey, ogLocale] of Object.entries(OG_LOCALE_MAP)) {
      if (localeKey === currentLocale) continue;
      const meta = this.document.createElement('meta');
      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', ogLocale);
      this.document.head.appendChild(meta);
    }
  }

  private updateTwitterTags(config: SeoConfig): void {
    this.meta.updateTag({
      name: 'twitter:card',
      content: config.twitterCard || 'summary',
    });
    this.meta.updateTag({ name: 'twitter:site', content: TWITTER_HANDLE });
    this.meta.updateTag({ name: 'twitter:creator', content: TWITTER_HANDLE });
    this.meta.updateTag({
      name: 'twitter:title',
      content: config.twitterTitle || config.ogTitle || config.title,
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: config.twitterDescription || config.ogDescription || config.description,
    });

    if (config.twitterImage)
      this.meta.updateTag({
        name: 'twitter:image',
        content: config.twitterImage,
      });
  }

  private updateCanonicalLink(canonicalUrl: string): void {
    this.document.querySelector('link[rel="canonical"]')?.remove();

    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private updateHreflangLinks(hreflangs: Record<string, string>): void {
    this.document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => {
      node.remove();
    });

    for (const [locale, href] of Object.entries(hreflangs)) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', locale);
      link.setAttribute('href', href);
      this.document.head.appendChild(link);
    }
  }

  private updateJsonLd(config: SeoConfig): void {
    if (!this.document) return;

    this.document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((node) => node.remove());

    if (!config.jsonLd) return;

    const blocks = Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd];

    for (const block of blocks) {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(block);
      this.document.head.appendChild(script);
    }
  }

  /** Angular peut fournir "fr", "fr-FR", "en", "en-US"... selon la configuration. */
  private resolveLocaleKey(): string {
    return (this.localeId ?? 'fr').toLowerCase().split('-')[0];
  }
}
