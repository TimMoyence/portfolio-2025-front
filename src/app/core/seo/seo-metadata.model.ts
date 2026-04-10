export type SeoChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type JsonLdBlock = Record<string, unknown> | Record<string, unknown>[];

export interface SeoLocaleMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: JsonLdBlock;
}

export interface SeoBreadcrumbEntry {
  name: string;
  path: string;
}

export interface SeoPageEntry {
  id: string;
  path: string;
  index?: boolean;
  changefreq?: SeoChangeFreq;
  priority?: number;
  lastmod?: string;
  breadcrumb?: SeoBreadcrumbEntry[];
  locales: Record<string, SeoLocaleMeta>;
}

export interface SeoMetadataDefaults {
  keywords?: string[];
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
}

export interface SeoMetadataSite {
  baseUrl?: string;
  defaultLocale: string;
  locales: string[];
  homePath?: string;
}

export interface SeoMetadataGlobal {
  localBusiness: Record<string, unknown>;
  siteNavigation: Record<string, unknown>;
}

export interface SeoMetadataFile {
  site: SeoMetadataSite;
  defaults?: SeoMetadataDefaults;
  global?: SeoMetadataGlobal;
  pages: SeoPageEntry[];
}
