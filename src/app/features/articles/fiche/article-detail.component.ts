import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  map,
  switchMap,
  tap,
  type Observable,
} from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config.token';
import type { PublishedArticle, SectionDeLArticle } from '../../../core/models/article.model';
import { ArticleHttpAdapter } from '../../../core/adapters/article-http.adapter';
import { urlAbsolue, urlLocalisee } from '../../../core/seo/chemins';
import { NOM_DU_SITE } from '../../../core/seo/nom-du-site';
import { SeoService } from '../../../core/seo/seo.service';
import { HTTP_RESPONSE_STATUS } from '../../../core/ssr/http-response-status';
import { JourDuSitePipe } from '../../../shared/pipes/date-du-site.pipe';
import { AnatomieComponent } from '../marques/anatomie.component';
import { ArticlesCtaComponent } from '../articles-cta.component';
import { injecterLocaleDeLaPage } from '../../../core/config/locale-de-la-page';
import { identiteDeRubrique } from '../edition/identite-des-rubriques';
import {
  lectureDeLEdition,
  sourcesParPublication,
  type GroupeDeSources,
  type LectureDeLEdition,
} from '../edition/lecture-de-l-edition';
import {
  BandeDesRubriquesComponent,
  CompteursDeLEditionComponent,
  PictoDeRubriqueComponent,
  ProvenanceComponent,
} from '../marques/marques-de-l-edition.component';
import { renderArticleMarkdown } from '../edition/markdown-article.utils';

interface EntreeDuSommaire {
  readonly ancre: string;
  readonly libelle: string;
  readonly nombre: number | null;
  readonly rubrique: string | null;
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AnatomieComponent,
    ArticlesCtaComponent,
    BandeDesRubriquesComponent,
    CompteursDeLEditionComponent,
    JourDuSitePipe,
    PictoDeRubriqueComponent,
    ProvenanceComponent,
  ],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailComponent {
  protected readonly ctaKicker = $localize`:@@articleDetailCtaKicker:Un sujet à clarifier ?`;
  protected readonly ctaTitle = $localize`:@@articleDetailCtaTitle:La bonne technologie commence par le bon problème.`;
  protected readonly ctaLead = $localize`:@@articleDetailCtaLead:Parlons de ce que cette veille peut changer concrètement dans votre activité.`;
  protected article: PublishedArticle | null = null;
  protected lecture: LectureDeLEdition | null = null;
  protected sommaire: EntreeDuSommaire[] = [];
  protected sources: GroupeDeSources[] = [];
  protected renderedContent = '';
  protected isLoading = true;
  protected hasError = false;
  protected readonly locale = injecterLocaleDeLaPage();
  protected readonly sommaireOuvert = signal(false);
  protected readonly partieEnCours = signal<string | null>(null);
  private observateur: IntersectionObserver | null = null;
  private readonly injector = inject(Injector);
  private readonly api = inject(ArticleHttpAdapter);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly seo = inject(SeoService);
  private readonly config = inject(APP_CONFIG);
  private readonly logo = urlAbsolue(this.config.baseUrl, '/assets/images/logo.webp');
  private readonly responseStatus = inject(HTTP_RESPONSE_STATUS, { optional: true });

  constructor(route: ActivatedRoute) {
    inject(DestroyRef).onDestroy(() => this.observateur?.disconnect());
    route.paramMap
      .pipe(
        map((parametres) => parametres.get('slug')),
        distinctUntilChanged(),
        switchMap((slug) => this.charger(slug)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private charger(slug: string | null): Observable<unknown> {
    this.repartirDeZero();
    if (!slug) {
      this.signalerLAbsence(404, '');
      this.cdr.markForCheck();
      return EMPTY;
    }
    this.poserLeSeoProvisoire(slug);
    return this.api.getBySlug(slug, this.locale).pipe(
      tap((article) => {
        this.afficher(article);
        this.isLoading = false;
        this.poserLeSeo(article);
        this.cdr.markForCheck();
      }),
      catchError((error: unknown) => {
        this.signalerLAbsence(
          error instanceof HttpErrorResponse && error.status === 404 ? 404 : 503,
          slug,
        );
        this.cdr.markForCheck();
        return EMPTY;
      }),
    );
  }

  private repartirDeZero(): void {
    this.article = null;
    this.lecture = null;
    this.sommaire = [];
    this.sources = [];
    this.renderedContent = '';
    this.isLoading = true;
    this.hasError = false;
    this.sommaireOuvert.set(false);
    this.partieEnCours.set(null);
    this.observateur?.disconnect();
    this.observateur = null;
    this.cdr.markForCheck();
  }

  protected allerA(ancre: string): void {
    this.sommaireOuvert.set(false);
    const partie = document.getElementById(ancre);
    partie?.setAttribute('tabindex', '-1');
    partie?.focus({ preventScroll: true });
  }

  private poserLeSeoProvisoire(slug: string): void {
    const canonicalUrl = urlLocalisee(this.config.baseUrl, this.locale, `/articles/${slug}`);
    const edition = $localize`:@@articleDetailTitreProvisoire:Édition du Morning Brief`;
    this.seo.updateSeoMetadata({
      title: `${edition} — ${NOM_DU_SITE}`,
      description: $localize`:@@articleDetailDescriptionProvisoire:Une édition du Morning Brief : la veille IA de la nuit, triée, sourcée et expliquée.`,
      robots: 'noindex, nofollow',
      canonicalUrl,
      ogUrl: canonicalUrl,
      hreflangs: {},
    });
  }

  protected resumeDuSommaire(): string {
    return (
      this.partieEnCours() ??
      $localize`:@@articleDetailSommaireParties:${this.sommaire.length}:nombre: parties`
    );
  }

  private suivreLaLecture(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observateur?.disconnect();
    const libelles = new Map(this.sommaire.map((entree) => [entree.ancre, entree.libelle]));
    this.observateur = new IntersectionObserver(
      (entrees) => {
        const lue = entrees.find((entree) => entree.isIntersecting);
        const libelle = lue ? libelles.get(lue.target.id) : undefined;
        if (libelle !== undefined) this.partieEnCours.set(libelle);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const ancre of libelles.keys()) {
      const partie = document.getElementById(ancre);
      if (partie) this.observateur.observe(partie);
    }
  }

  protected libelleDe(section: SectionDeLArticle): string {
    return identiteDeRubrique(section.id, section.title).libelle;
  }

  private poserLeSeo(article: PublishedArticle): void {
    const canonicalUrl = urlLocalisee(this.config.baseUrl, this.locale, article.seo.canonical_path);
    this.seo.updateSeoMetadata({
      title: `${article.title} — ${NOM_DU_SITE}`,
      description: article.seo.description,
      keywords: article.seo.keywords,
      canonicalUrl,
      ogUrl: canonicalUrl,
      ogType: 'article',
      ogImage: this.logo,
      twitterImage: this.logo,
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      hreflangs: { [this.locale]: canonicalUrl },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.seo.description,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        mainEntityOfPage: canonicalUrl,
        author: { '@type': 'Person', name: 'Tim Moyence' },
        publisher: { '@type': 'Organization', name: NOM_DU_SITE },
      },
    });
  }

  private signalerLAbsence(statut: 404 | 503, slug: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.responseStatus?.set(statut);
    const canonicalUrl = urlLocalisee(this.config.baseUrl, this.locale, `/articles/${slug}`);
    const introuvable = $localize`:@@articleDetailNotFound:Article introuvable`;
    this.seo.updateSeoMetadata({
      title: `${introuvable} — ${NOM_DU_SITE}`,
      description: $localize`:@@articleDetailAbsenceDescription:Cette édition du Morning Brief est introuvable ou momentanément indisponible.`,
      robots: 'noindex, nofollow',
      canonicalUrl,
      ogUrl: canonicalUrl,
      ogImage: this.logo,
      twitterImage: this.logo,
      hreflangs: {},
    });
  }

  private afficher(article: PublishedArticle): void {
    this.article = article;
    if (article.sections.length === 0) {
      this.renderedContent = renderArticleMarkdown(article.content_markdown);
      return;
    }
    this.lecture = lectureDeLEdition(article);
    this.sources = sourcesParPublication(article);
    this.sommaire = this.sommaireDe(article);
    afterNextRender(() => this.suivreLaLecture(), { injector: this.injector });
  }

  private sommaireDe(article: PublishedArticle): EntreeDuSommaire[] {
    const entrees = article.sections.map((section) => {
      if (section.kind === 'essential') {
        return this.entree(`mb-${section.id}`, section.title);
      }
      if (section.kind === 'deep_dive') {
        return this.entree(
          `mb-${section.id}`,
          $localize`:@@articleDetailSommaireDecryptage:Le décryptage`,
        );
      }
      return {
        ancre: `mb-${section.id}`,
        libelle: section.kind === 'radar' ? section.title : this.libelleDe(section),
        nombre: section.items.length,
        rubrique: section.id,
      };
    });
    entrees.push(
      this.entree('edition-anatomie', $localize`:@@articleDetailSommaireAnatomie:En chiffres`),
    );
    if (this.sources.length) {
      entrees.push(
        this.entree('edition-sources', $localize`:@@articleDetailSommaireSources:Sources`),
      );
    }
    return entrees;
  }

  private entree(ancre: string, libelle: string): EntreeDuSommaire {
    return { ancre, libelle, nombre: null, rubrique: null };
  }
}
