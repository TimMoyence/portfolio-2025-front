import type { JsonLdBlock } from "./seo-metadata.model";

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  /** Type Open Graph: website (defaut), article, profile, product... */
  ogType?: "website" | "article" | "profile" | "product";
  robots?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  hreflangs?: Record<string, string>;
  /** Donnees structurees JSON-LD a injecter dans le head (schema.org). */
  jsonLd?: JsonLdBlock;
}
