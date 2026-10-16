import type { ArticleSummary, PublishedArticle } from '../../app/core/models/article.model';

function buildArticleSummary(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  const slug = overrides.slug ?? 'morning-brief-2026-09-23';
  return {
    article_id: `${slug}-fr`,
    slug,
    locale: 'fr',
    title: 'Veille IA',
    excerpt: 'Les faits IA du jour.',
    tags: [],
    published_at: '2026-09-23T04:15:00.000Z',
    updated_at: '2026-09-23T04:15:00.000Z',
    seo: {
      description: 'Les faits IA du jour, sourcés.',
      canonical_path: `/articles/${slug}`,
      keywords: [],
      image_url: null,
      image_alt: null,
    },
    ...overrides,
  };
}

export function buildPublishedArticle(overrides: Partial<PublishedArticle> = {}): PublishedArticle {
  return {
    ...buildArticleSummary(overrides),
    content_markdown: '# Veille',
    reading_time_minutes: 5,
    sections: [],
    sources: [],
    provenance: {
      run_id: 'run-2026-09-23',
      edition_date: '2026-09-23',
      item_count: 0,
      source_count: 0,
      content_sha256: '0'.repeat(64),
    },
    ...overrides,
  };
}
