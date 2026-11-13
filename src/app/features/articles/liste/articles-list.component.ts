import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ArticleListResponse, PublishedArticle } from '../../../core/models/article.model';
import { ArticleHttpAdapter } from '../../../core/adapters/article-http.adapter';
import { DateDuSitePipe, JourDuSitePipe } from '../../../shared/pipes/date-du-site.pipe';
import { AsiliHeroComponent } from '../../../shared/sections';
import { ArticlesCtaComponent } from '../articles-cta.component';
import { NewsletterFormComponent } from '../../../shared/components/sections/newsletter-form/newsletter-form.component';
import { injecterLocaleDeLaPage } from '../../../core/config/locale-de-la-page';
import { blocsDuRecit } from '../edition/recit-du-matin';

const ARTICLES_PAGE_SIZE = 12;

interface EditionDuJournal {
  readonly article: PublishedArticle;
  readonly titre: string;
  readonly image: { readonly url: string; readonly credit: string } | null;
}

function editionDuJournal(article: PublishedArticle): EditionDuJournal {
  return { article, titre: article.title, image: blocsDuRecit(article).sujet?.image ?? null };
}

@Component({
  selector: 'app-articles-list',
  standalone: true,
  imports: [
    RouterLink,
    AsiliHeroComponent,
    ArticlesCtaComponent,
    DateDuSitePipe,
    JourDuSitePipe,
    NewsletterFormComponent,
  ],
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
  protected une: EditionDuJournal | null = null;
  protected readonly precedentes: EditionDuJournal[] = [];
  protected isLoading = true;
  protected hasError = false;
  protected nextCursor: string | null = null;
  protected isLoadingMore = false;
  protected hasLoadMoreError = false;
  protected readonly locale = injecterLocaleDeLaPage();
  private readonly api = inject(ArticleHttpAdapter);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.lireLaPage(undefined, (echec) => {
      this.isLoading = false;
      this.hasError = echec;
    });
  }

  protected loadMore(): void {
    if (!this.nextCursor || this.isLoadingMore) return;
    this.isLoadingMore = true;
    this.hasLoadMoreError = false;
    this.lireLaPage(this.nextCursor, (echec) => {
      this.isLoadingMore = false;
      this.hasLoadMoreError = echec;
    });
  }

  private lireLaPage(curseur: string | undefined, conclure: (echec: boolean) => void): void {
    this.api.list(this.locale, ARTICLES_PAGE_SIZE, curseur).subscribe({
      next: (page) => {
        this.ajouterLaPage(page);
        conclure(false);
        this.cdr.markForCheck();
      },
      error: () => {
        conclure(true);
        this.cdr.markForCheck();
      },
    });
  }

  private ajouterLaPage(page: ArticleListResponse): void {
    const editions = page.items.map(editionDuJournal);
    this.une ??= editions.shift() ?? null;
    this.precedentes.push(...editions);
    this.nextCursor = page.next_cursor;
  }
}
