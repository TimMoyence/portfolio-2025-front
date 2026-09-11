export interface ArticleSummary {
  article_id: string;
  slug: string;
  locale: 'fr' | 'en';
  title: string;
  excerpt: string;
  tags: string[];
  published_at: string;
  updated_at: string;
  seo: {
    description: string;
    canonical_path: string;
    keywords?: string[];
  };
}

export interface PublishedArticle extends ArticleSummary {
  content_markdown: string;
  reading_time_minutes: number | null;
  sections: Array<{
    id: string;
    kind: 'essential' | 'deep_dive' | 'rubric' | 'radar';
    title: string;
    intro?: string;
    body?: string;
    items: Array<{
      entity: string;
      text: string;
      source: string;
      url: string;
    }>;
  }>;
  sources: Array<{ name: string; url: string }>;
  provenance: Record<string, unknown>;
}

export interface ArticleListResponse {
  items: ArticleSummary[];
  next_cursor: string | null;
}
