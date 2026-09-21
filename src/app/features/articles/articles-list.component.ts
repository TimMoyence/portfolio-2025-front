import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ArticleSummary } from '../../core/models/article.model';
import { ArticleHttpAdapter } from '../../core/adapters/article-http.adapter';
import { AsiliCtaBandComponent, AsiliHeroComponent } from '../../shared/sections';

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, AsiliHeroComponent, AsiliCtaBandComponent],
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
  protected readonly locale: 'fr' | 'en';
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private readonly api: ArticleHttpAdapter,
    @Inject(LOCALE_ID) localeId: string,
    @Inject(DOCUMENT) document: Document,
  ) {
    this.locale =
      localeId.toLowerCase().startsWith('en') || document.location.pathname.startsWith('/en')
        ? 'en'
        : 'fr';
    this.api.list(this.locale).subscribe({
      next: (response) => {
        this.articles.push(...response.items);
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
}
