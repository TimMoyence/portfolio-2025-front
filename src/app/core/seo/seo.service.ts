import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import type { SeoConfig } from "./seo.interface";

/** Map locale ID (ex: "fr", "en") → tag Open Graph (ex: "fr_FR", "en_US"). */
const OG_LOCALE_MAP: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
};

/** Compte Twitter / X associé au site, utilisé pour twitter:site et twitter:creator. */
const TWITTER_HANDLE = "@timmoyence";

@Injectable({
  providedIn: "root",
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
    this.meta.updateTag({ name: "description", content: config.description });

    if (config.keywords && config.keywords.length > 0)
      this.meta.updateTag({
        name: "keywords",
        content: config.keywords.join(", "),
      });

    // Open Graph
    this.meta.updateTag({
      property: "og:title",
      content: config.ogTitle || config.title,
    });
    this.meta.updateTag({
      property: "og:description",
      content: config.ogDescription || config.description,
    });

    if (config.ogImage)
      this.meta.updateTag({ property: "og:image", content: config.ogImage });

    if (config.ogUrl)
      this.meta.updateTag({ property: "og:url", content: config.ogUrl });

    this.meta.updateTag({
      property: "og:type",
      content: config.ogType || "website",
    });

    // og:locale et og:locale:alternate pour signaler les langues aux crawlers sociaux
    const currentLocale = this.resolveLocaleKey();
    const currentOgLocale = OG_LOCALE_MAP[currentLocale] ?? OG_LOCALE_MAP["fr"];
    this.meta.updateTag({ property: "og:locale", content: currentOgLocale });

    // Supprime les anciennes balises og:locale:alternate avant d'ajouter les nouvelles
    this.document
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((node) => node.remove());
    for (const [localeKey, ogLocale] of Object.entries(OG_LOCALE_MAP)) {
      if (localeKey === currentLocale) continue;
      const meta = this.document.createElement("meta");
      meta.setAttribute("property", "og:locale:alternate");
      meta.setAttribute("content", ogLocale);
      this.document.head.appendChild(meta);
    }

    // og:site_name aide les moteurs IA à identifier la marque
    this.meta.updateTag({
      property: "og:site_name",
      content: "Asili Design",
    });

    // Twitter Card
    this.meta.updateTag({
      name: "twitter:card",
      content: config.twitterCard || "summary",
    });
    this.meta.updateTag({ name: "twitter:site", content: TWITTER_HANDLE });
    this.meta.updateTag({ name: "twitter:creator", content: TWITTER_HANDLE });
    this.meta.updateTag({
      name: "twitter:title",
      content: config.twitterTitle || config.ogTitle || config.title,
    });
    this.meta.updateTag({
      name: "twitter:description",
      content:
        config.twitterDescription || config.ogDescription || config.description,
    });

    if (config.twitterImage)
      this.meta.updateTag({
        name: "twitter:image",
        content: config.twitterImage,
      });

    if (config.robots) {
      this.meta.updateTag({ name: "robots", content: config.robots });
    }

    if (config.canonicalUrl) {
      // Remove existing canonical link if it exists
      const existingCanonicalLink = this.document.querySelector(
        'link[rel="canonical"]',
      );
      if (existingCanonicalLink) {
        existingCanonicalLink.remove();
      }

      const link = this.document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", config.canonicalUrl);
      this.document.head.appendChild(link);
    }

    if (config.hreflangs) {
      this.document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((node) => node.remove());

      for (const [locale, href] of Object.entries(config.hreflangs)) {
        const link = this.document.createElement("link");
        link.setAttribute("rel", "alternate");
        link.setAttribute("hreflang", locale);
        link.setAttribute("href", href);
        this.document.head.appendChild(link);
      }
    }

    this.updateJsonLd(config);
  }

  /**
   * Injecte ou met a jour les donnees structurees JSON-LD dans le head.
   * Supprime tous les scripts JSON-LD existants avant d'en creer de nouveaux (SSR-safe).
   * Accepte un seul bloc JSON-LD ou un tableau — chaque bloc est injecte dans son propre script.
   */
  private updateJsonLd(config: SeoConfig): void {
    if (!this.document) return;

    // Supprime tous les scripts JSON-LD existants (pas seulement le premier)
    this.document.head
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((node) => node.remove());

    if (!config.jsonLd) return;

    const blocks = Array.isArray(config.jsonLd)
      ? config.jsonLd
      : [config.jsonLd];

    for (const block of blocks) {
      const script = this.document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(block);
      this.document.head.appendChild(script);
    }
  }

  /**
   * Extrait la cle de locale courte (fr/en) depuis le LOCALE_ID d'Angular.
   * Angular peut fournir "fr", "fr-FR", "en", "en-US"... selon la configuration.
   */
  private resolveLocaleKey(): string {
    return (this.localeId ?? "fr").toLowerCase().split("-")[0];
  }
}
