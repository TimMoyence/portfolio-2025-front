import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { SeoConfig } from "./seo.interface";

@Injectable({
  providedIn: "root",
})
export class SeoService {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document,
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

    this.meta.updateTag({ property: "og:type", content: "website" });

    // Twitter Card
    this.meta.updateTag({
      name: "twitter:card",
      content: config.twitterCard || "summary",
    });
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
  }
}
