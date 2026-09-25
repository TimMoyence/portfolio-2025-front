import type { SeoLocaleMeta } from './seo-metadata.model';

export interface SeoConfig extends SeoLocaleMeta {
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  robots?: string;
  canonicalUrl?: string;
  hreflangs?: Record<string, string>;
}
