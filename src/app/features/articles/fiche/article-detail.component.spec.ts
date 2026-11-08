import { registerLocaleData } from '@angular/common';
import { HttpTestingController } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  buildEditionMorningBrief,
  buildItemDeSection,
  buildPublishedArticle,
  buildSectionDeLArticle,
} from '../../../../testing/factories/article.factory';
import { fournirLaRoute } from '../../../../testing/factories/serveur/route.factory';
import { ancresDuSommaire, rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';
import type { SeoConfig } from '../../../core/seo/seo.interface';
import { SeoService } from '../../../core/seo/seo.service';
import { HTTP_RESPONSE_STATUS } from '../../../core/ssr/http-response-status';
import { ArticleDetailComponent } from './article-detail.component';

describe('ArticleDetailComponent — statut HTTP rendu côté serveur', () => {
  let statuses: number[];
  let httpMock: HttpTestingController;

  const render = (slug: string | null) => {
    statuses = [];
    setupTestBed({
      router: true,
      imports: [ArticleDetailComponent],
      providers: [
        { provide: HTTP_RESPONSE_STATUS, useValue: { set: (code: number) => statuses.push(code) } },
        fournirLaRoute({ parametres: slug ? { slug } : {} }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ArticleDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  afterEach(() => httpMock.verify());

  const articleRequest = (slug: string) =>
    httpMock.expectOne((request) => request.url === `${environment.apiBaseUrl}/articles/${slug}`);

  it('répond 404 quand l API ne connaît pas le slug', () => {
    const fixture = render('inconnu');

    articleRequest('inconnu').flush(
      { message: 'Not Found' },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(statuses).toEqual([404]);
    expect(fixture.nativeElement.textContent).toContain('Article introuvable');
  });

  it('répond 503 quand l API est indisponible, pour ne pas figer une fausse absence', () => {
    render('morning-brief-2026-09-23');

    articleRequest('morning-brief-2026-09-23').flush(null, {
      status: 502,
      statusText: 'Bad Gateway',
    });

    expect(statuses).toEqual([503]);
  });

  it('répond 404 sans appeler l API quand le slug manque', () => {
    render(null);

    expect(statuses).toEqual([404]);
  });

  it('laisse le statut par défaut quand l article existe', () => {
    render('morning-brief-2026-09-23');

    articleRequest('morning-brief-2026-09-23').flush(
      buildPublishedArticle({ slug: 'morning-brief-2026-09-23' }),
    );

    expect(statuses).toEqual([]);
  });
});

describe('ArticleDetailComponent — métadonnées SEO', () => {
  function seoDeLArticle(): SeoConfig {
    setupTestBed({
      router: true,
      appConfig: { baseUrl: 'https://example.com/' },
      imports: [ArticleDetailComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'fr' },
        fournirLaRoute({ parametres: { slug: 'veille' } }),
      ],
    });
    const seo = TestBed.inject(SeoService);
    const miseAJour = spyOn(seo, 'updateSeoMetadata');
    const httpMock = TestBed.inject(HttpTestingController);
    TestBed.createComponent(ArticleDetailComponent).detectChanges();

    httpMock
      .expectOne((request) => request.url === `${environment.apiBaseUrl}/articles/veille`)
      .flush(
        buildPublishedArticle({
          slug: 'veille',
          seo: { ...buildPublishedArticle().seo, canonical_path: '/articles/veille/' },
        }),
      );

    httpMock.verify();
    return miseAJour.calls.mostRecent().args[0];
  }

  it('construit le canonical comme le reste du site, base terminee par un slash comprise', () => {
    const config = seoDeLArticle();
    expect(config.canonicalUrl).toBe('https://example.com/fr/articles/veille');
    expect(config.ogUrl).toBe('https://example.com/fr/articles/veille');
  });

  it('signe du nom du site le titre de l article et son éditeur', () => {
    const config = seoDeLArticle();

    expect(config.title).toBe('Veille IA — Asili Design');
    expect(config.jsonLd).toEqual(
      jasmine.objectContaining({
        publisher: { '@type': 'Organization', name: 'Asili Design' },
      }),
    );
  });
});

describe('ArticleDetailComponent — l’édition rendue depuis ses sections', () => {
  beforeAll(() => registerLocaleData(localeFr));

  const rendre = rendreLaFiche;

  const section = (page: HTMLElement, id: string): HTMLElement =>
    page.querySelector<HTMLElement>(`#mb-${id}`)!;

  it('titre la fiche par le décryptage, avec la bande des rubriques et les compteurs', () => {
    const page = rendre(buildEditionMorningBrief());

    expect(texteDe(page.querySelector('h1'))).toBe('V8 travaille désormais pour le temps réel');
    expect(page.querySelector('header [data-testid="bande-des-rubriques"]')).not.toBeNull();
    expect(texteDe(page.querySelector('header app-compteurs-de-l-edition'))).toBe(
      '7 informations · 6 sources · 9 min de lecture',
    );
  });

  it('ouvre sur l’essentiel et ses points à retenir, numérotés', () => {
    const essentiel = section(rendre(buildEditionMorningBrief()), 'essential');

    expect(texteDe(essentiel.querySelector('.essentiel__chapeau'))).toContain(
      'le routage et le cache',
    );
    expect(textes(essentiel, '.a-retenir li')).toEqual([
      '1 Les scores bougent de 23 points selon la consigne.',
      '2 Mercor passe ses lots de 12 à 2 heures.',
      '3 Chrome 136 gagne 630 ms au chargement.',
    ]);
  });

  it('donne au décryptage son encadré « Ce que ça change » et sa source', () => {
    const decryptage = section(rendre(buildEditionMorningBrief()), 'deep-dive');
    const encadre = decryptage.querySelector('.encadre')!;

    expect(texteDe(decryptage)).toContain('Le moteur compile d’abord ce que la page utilise.');
    expect(texteDe(encadre)).toContain('Ce que ça change');
    expect(texteDe(encadre)).toContain('Les applications web démarrent plus vite sans réécriture.');
    expect(encadre.querySelector('a')?.getAttribute('href')).toBe(
      'https://v8.dev/blog/indices-de-compilation',
    );
  });

  it('garde la source du décryptage sans encadré quand il n’a pas d’impact', () => {
    const sansImpact = buildSectionDeLArticle({
      id: 'deep-dive',
      kind: 'deep_dive',
      title: 'Quand le benchmark écoute mal',
      body: 'Le corps du décryptage.',
      items: [
        buildItemDeSection({
          entity: 'Source du décryptage',
          text: 'Quand le benchmark écoute mal',
          url: 'https://www.reddit.com/r/LocalLLaMA/1',
        }),
      ],
    });
    const decryptage = section(
      rendre(buildEditionMorningBrief({ sections: [sansImpact] })),
      'deep-dive',
    );

    expect(decryptage.querySelector('.encadre')).toBeNull();
    expect(texteDe(decryptage)).not.toContain('Ce que ça change');
    expect(decryptage.querySelector('.decryptage__source a')?.getAttribute('href')).toBe(
      'https://www.reddit.com/r/LocalLLaMA/1',
    );
  });

  it('met la source sous chaque fait : publication, site, date, lien externe', () => {
    const rubrique = section(rendre(buildEditionMorningBrief()), 'modeles-ia');
    const faits = Array.from(rubrique.querySelectorAll('.fait'));

    expect(texteDe(rubrique.querySelector('h2'))).toBe('Modèles IA & Recherche');
    expect(faits.length).toBe(2);
    const provenance = faits[0].querySelector<HTMLAnchorElement>('[data-testid="provenance"]')!;
    expect(texteDe(faits[0].querySelector('.fait__acteur'))).toBe('Vercel / DeepSeek V4.1');
    expect(texteDe(provenance)).toBe('Vercel Blog vercel.com 7 nov. ↗');
    expect(provenance.getAttribute('href')).toBe('https://vercel.com/changelog/fait');
    expect(provenance.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('range le radar par rubrique, une ligne par brève avec son lien', () => {
    const page = rendre(buildEditionMorningBrief());

    expect(texteDe(section(page, 'radar-modeles-ia').querySelector('h2'))).toBe(
      'Radar — Modèles IA & Recherche',
    );
    const breves = Array.from(section(page, 'radar').querySelectorAll('li'));
    expect(breves.length).toBe(1);
    expect(texteDe(breves[0])).toContain('Show HN');
    expect(breves[0].querySelector('a')?.getAttribute('href')).toBe(
      'https://news.ycombinator.com/item?id=1',
    );
  });

  it('ouvre un sommaire d’ancres vers chaque partie de l’édition', () => {
    const page = rendre(buildEditionMorningBrief());

    expect(ancresDuSommaire(page)).toEqual([
      'mb-essential',
      'mb-deep-dive',
      'mb-modeles-ia',
      'mb-outils-ia',
      'mb-radar-modeles-ia',
      'mb-radar',
      'edition-anatomie',
      'edition-sources',
    ]);
  });

  it('garde des ancres uniques quand une rubrique s’appelle sources ou anatomie', () => {
    const page = rendre(
      buildEditionMorningBrief({
        sections: ['sources', 'anatomie', 'anatomie-titre'].map((id) =>
          buildSectionDeLArticle({
            id,
            items: [buildItemDeSection({ url: `https://exemple.fr/${id}` })],
          }),
        ),
      }),
    );
    const ids = Array.from(page.querySelectorAll('[id]')).map((element) => element.id);

    expect(ids.length).toBe(new Set(ids).size);
    expect(
      ancresDuSommaire(page).every((ancre) => page.querySelector(`[id="${ancre}"]`)),
    ).toBeTrue();
  });

  it('montre l’anatomie et replie les sources, titrées et comptées par publication', () => {
    const page = rendre(buildEditionMorningBrief());
    const sources = page.querySelector<HTMLDetailsElement>('#edition-sources details')!;

    expect(page.querySelector('#edition-anatomie app-anatomie')).not.toBeNull();
    expect(sources.hasAttribute('open')).toBeFalse();
    expect(texteDe(sources.querySelector('summary h2'))).toBe('Toutes les sources (6)');
    expect(textes(sources, '.sources__publication')).toContain('Vercel Blog');
  });

  it('se replie sur le markdown quand l’article n’a pas de sections', () => {
    const page = rendre(
      buildPublishedArticle({
        content_markdown: '## Veille\n\nUn paragraphe.',
        sources: [
          {
            name: 'Le Monde',
            url: 'https://www.lemonde.fr/x',
            published_at: null,
            retrieved_at: null,
          },
        ],
      }),
    );

    expect(texteDe(page.querySelector('h1'))).toBe('Veille IA');
    expect(texteDe(page.querySelector('.article-markdown'))).toContain('Un paragraphe.');
    expect(page.querySelector('.sommaire')).toBeNull();
    expect(page.querySelector('.article-sources a')?.getAttribute('href')).toBe(
      'https://www.lemonde.fr/x',
    );
  });
});
