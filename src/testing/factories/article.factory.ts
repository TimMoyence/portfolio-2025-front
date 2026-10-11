import type { ArticleSummary, PublishedArticle } from '../../app/core/models/article.model';

export function buildArticleSummary(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
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
    seo: { description: 'Les faits IA du jour, sourcés.', canonical_path: `/articles/${slug}` },
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
    provenance: {},
    ...overrides,
  };
}
