import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app-config.token';
import type { PublishedArticle } from '../../core/models/article.model';
import { ArticleHttpAdapter } from '../../core/adapters/article-http.adapter';
import { SeoService } from '../../core/seo/seo.service';
import { AsiliCtaBandComponent } from '../../shared/sections';
import { renderArticleMarkdown } from './markdown-article.utils';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, AsiliCtaBandComponent],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailComponent {
  protected readonly ctaKicker = $localize`:@@articleDetailCtaKicker:Un sujet à clarifier ?`;
  protected readonly ctaTitle = $localize`:@@articleDetailCtaTitle:La bonne technologie commence par le bon problème.`;
  protected readonly ctaLead = $localize`:@@articleDetailCtaLead:Parlons de ce que cette veille peut changer concrètement dans votre activité.`;
  protected article: PublishedArticle | null = null;
  protected renderedContent = '';
  protected isLoading = true;
  protected hasError = false;
  protected readonly locale: 'fr' | 'en';
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly seo = inject(SeoService);
  private readonly config = inject(APP_CONFIG);

  constructor(
    route: ActivatedRoute,
    private readonly api: ArticleHttpAdapter,
    @Inject(LOCALE_ID) localeId: string,
    @Inject(DOCUMENT) document: Document,
  ) {
    this.locale =
      localeId.toLowerCase().startsWith('en') || document.location.pathname.startsWith('/en')
        ? 'en'
        : 'fr';
    const slug = route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.isLoading = false;
      this.hasError = true;
      return;
    }
    this.api.getBySlug(slug, this.locale).subscribe({
      next: (article) => {
        this.article = article;
        this.renderedContent = renderArticleMarkdown(article.content_markdown);
        this.isLoading = false;
        this.seo.updateSeoMetadata({
          title: `${article.title} — Asili Design`,
          description: article.seo.description,
          keywords: article.seo.keywords,
          canonicalUrl: `${this.config.baseUrl}/${this.locale}${article.seo.canonical_path}`,
          ogUrl: `${this.config.baseUrl}/${this.locale}${article.seo.canonical_path}`,
          ogType: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.seo.description,
            datePublished: article.published_at,
            dateModified: article.updated_at,
            mainEntityOfPage: `${this.config.baseUrl}/${this.locale}${article.seo.canonical_path}`,
            author: { '@type': 'Person', name: 'Tim Moyence' },
            publisher: { '@type': 'Organization', name: 'Asili Design' },
          },
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      },
    });
  }
}
