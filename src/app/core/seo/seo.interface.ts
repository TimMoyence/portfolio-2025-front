import type { JsonLdBlock, SeoLocaleMeta } from './seo-metadata.model';

interface SeoDeLaPage extends Omit<SeoLocaleMeta, 'jsonLd'> {
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'profile' | 'product';
}

interface SeoIndexable extends SeoDeLaPage {
  index: true;
  canonicalUrl?: string;
  hreflangs?: Record<string, string>;
  jsonLd?: JsonLdBlock;
}

interface SeoNonIndexable extends SeoDeLaPage {
  index: false;
  canonicalUrl?: never;
  hreflangs?: never;
  jsonLd?: never;
}

export type SeoConfig = SeoIndexable | SeoNonIndexable;
