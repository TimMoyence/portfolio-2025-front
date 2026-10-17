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
    keywords: string[];
    image_url: string | null;
    image_alt: string | null;
  };
}

export interface PublishedArticle extends ArticleSummary {
  content_markdown: string;
  reading_time_minutes: number | null;
  sections: Array<{
    id: string;
    kind: 'essential' | 'deep_dive' | 'rubric' | 'radar';
    title: string;
    intro: string;
    body: string;
    items: Array<{
      entity: string;
      text: string;
      source: string;
      url: string;
      published_at?: string;
      retrieved_at?: string;
    }>;
  }>;
  sources: Array<{
    name: string;
    url: string;
    published_at: string | null;
    retrieved_at: string | null;
  }>;
  provenance: {
    run_id: string;
    edition_date: string;
    item_count: number;
    source_count: number;
    content_sha256: string;
  };
}

export interface ArticleListResponse {
  items: PublishedArticle[];
  next_cursor: string | null;
}
