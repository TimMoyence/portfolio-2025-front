type SeoChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type JsonLdBlock = Record<string, unknown> | Record<string, unknown>[];

export interface SeoLocaleMeta {
  title: string;
  nom?: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: JsonLdBlock;
}

export interface SeoPageEntry {
  id: string;
  path: string;
  index?: boolean;
  changefreq?: SeoChangeFreq;
  priority?: number;
  lastmod?: string;
  locales: Record<string, SeoLocaleMeta>;
}

interface SeoMetadataDefaults {
  keywords?: string[];
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

interface SeoMetadataSite {
  baseUrl?: string;
  defaultLocale: string;
  locales: string[];
}

type BlocDuSite = 'localBusiness' | 'person';

interface SeoMetadataGlobal {
  localBusiness: Record<string, unknown>;
  navigation: readonly string[];
  person?: Record<string, unknown>;
  textes?: Record<string, Partial<Record<BlocDuSite, Record<string, unknown>>>>;
}

export interface SeoMetadataFile {
  site: SeoMetadataSite;
  defaults?: SeoMetadataDefaults;
  global?: SeoMetadataGlobal;
  pages: SeoPageEntry[];
}
