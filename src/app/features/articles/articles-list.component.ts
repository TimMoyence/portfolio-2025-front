import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ArticleSummary } from '../../core/models/article.model';
import { ArticleHttpAdapter } from '../../core/adapters/article-http.adapter';
import { AsiliHeroComponent } from '../../shared/sections';
import { ArticlesCtaComponent } from './articles-cta.component';
import { injecterLocaleDesArticles } from './locale-des-articles';

const ARTICLES_PAGE_SIZE = 12;

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, AsiliHeroComponent, ArticlesCtaComponent],
  templateUrl: './articles-list.component.html',
  styleUrl: './articles-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesListComponent {
  protected readonly heroKicker = $localize`:@@articlesListHeroKicker:Articles · Morning-Brief`;
  protected readonly heroLead = $localize`:@@articlesListHeroLead:Une veille sourcée, transformée en décisions et en pistes concrètes pour les équipes qui veulent utiliser l’IA sans perdre le fil.`;
  protected readonly ctaKicker = $localize`:@@articlesListCtaKicker:Une question concrète ?`;
  protected readonly ctaTitle = $localize`:@@articlesListCtaTitle:On peut transformer une veille en outil utile.`;
  protected readonly ctaLead = $localize`:@@articlesListCtaLead:Parlons de votre contexte, de vos usages et de ce qui mérite vraiment d’être automatisé.`;
  protected readonly articles: ArticleSummary[] = [];
  protected isLoading = true;
  protected hasError = false;
  protected nextCursor: string | null = null;
  protected isLoadingMore = false;
  protected hasLoadMoreError = false;
  protected readonly locale = injecterLocaleDesArticles();
  private readonly api = inject(ArticleHttpAdapter);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.api.list(this.locale, ARTICLES_PAGE_SIZE).subscribe({
      next: (response) => {
        this.articles.push(...response.items);
        this.nextCursor = response.next_cursor;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      },
    });
  }

  protected loadMore(): void {
    if (!this.nextCursor || this.isLoadingMore) return;
    this.isLoadingMore = true;
    this.hasLoadMoreError = false;
    this.api.list(this.locale, ARTICLES_PAGE_SIZE, this.nextCursor).subscribe({
      next: (response) => {
        this.articles.push(...response.items);
        this.nextCursor = response.next_cursor;
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingMore = false;
        this.hasLoadMoreError = true;
        this.cdr.markForCheck();
      },
    });
  }
}
