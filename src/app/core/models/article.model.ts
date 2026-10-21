import type {
  ArticleListResponseDto,
  PublishedArticleResponseDto,
} from '../../../../contrat/types.gen';

export type PublishedArticle = PublishedArticleResponseDto;

export type ArticleSummary = Pick<
  PublishedArticle,
  | 'article_id'
  | 'slug'
  | 'locale'
  | 'title'
  | 'excerpt'
  | 'tags'
  | 'published_at'
  | 'updated_at'
  | 'seo'
>;

export type ArticleListResponse = ArticleListResponseDto;
