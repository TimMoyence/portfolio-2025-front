export type SeoChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

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

export interface SeoMetadataFile {
  site: SeoMetadataSite;
  defaults?: SeoMetadataDefaults;
  pages: SeoPageEntry[];
}
