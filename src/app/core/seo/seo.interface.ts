import type { SeoLocaleMeta } from './seo-metadata.model';

export interface SeoConfig extends SeoLocaleMeta {
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile' | 'product';
  index: boolean;
  canonicalUrl?: string;
  hreflangs?: Record<string, string>;
}
