import type { JsonLdBlock } from './seo-metadata.model';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  robots?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  hreflangs?: Record<string, string>;
  jsonLd?: JsonLdBlock;
}
