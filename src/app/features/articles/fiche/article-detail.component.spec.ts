import { registerLocaleData } from '@angular/common';
import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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

function monterLaFiche(slug: string) {
  const parametres = new BehaviorSubject<Params>({ slug });
  setupTestBed({
    router: true,
    appConfig: { baseUrl: 'https://example.com/' },
    imports: [ArticleDetailComponent],
    providers: [
      { provide: LOCALE_ID, useValue: 'fr' },
      fournirLaRoute({ parametres: { slug }, parametresSuccessifs: parametres }),
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const requete = (demande: string) =>
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/articles/${demande}`);
  return { parametres, http, requete, seo: TestBed.inject(SeoService) };
}

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

describe('ArticleDetailComponent — d’une édition à l’autre sans repasser par la liste', () => {
  function monter() {
    const banc = monterLaFiche('edition-a');
    const seo = spyOn(banc.seo, 'updateSeoMetadata');
    const fixture = TestBed.createComponent(ArticleDetailComponent);
    fixture.detectChanges();
    const page = () => fixture.nativeElement as HTMLElement;
    const afficherB = () => {
      banc.requete('edition-b').flush(article('edition-b', 'Édition B'));
      fixture.detectChanges();
      expect(texteDe(page().querySelector('h1'))).toBe('Édition B');
      banc.http.verify();
    };
    return { ...banc, seo, fixture, page, afficherB };
  }

  const article = (slug: string, title: string) => buildPublishedArticle({ slug, title });
  const seoProvisoire = (slug: string) =>
    jasmine.objectContaining({
      title: 'Édition du Morning Brief — Asili Design',
      canonicalUrl: `https://example.com/fr/articles/${slug}`,
      ogUrl: `https://example.com/fr/articles/${slug}`,
      robots: 'noindex, nofollow',
    });

  it('repart d’une page vide et charge B quand l’adresse passe de A à B', () => {
    const { parametres, fixture, requete, page, afficherB } = monter();
    requete('edition-a').flush(article('edition-a', 'Édition A'));
    fixture.detectChanges();
    expect(texteDe(page().querySelector('h1'))).toBe('Édition A');

    parametres.next({ slug: 'edition-b' });
    fixture.detectChanges();
    expect(page().textContent).not.toContain('Édition A');
    expect(page().textContent).toContain('Chargement de l’article…');

    afficherB();
  });

  it('abandonne la réponse de A quand B est demandée avant qu’elle arrive', () => {
    const { parametres, requete, afficherB } = monter();
    const premiere = requete('edition-a');

    parametres.next({ slug: 'edition-b' });
    afficherB();

    expect(premiere.cancelled).toBeTrue();
  });

  it('pose un titre et une adresse provisoires dès le début de chaque chargement', () => {
    const { parametres, seo, requete, afficherB } = monter();

    expect(seo.calls.mostRecent().args[0]).toEqual(seoProvisoire('edition-a'));
    requete('edition-a').flush(article('edition-a', 'Édition A'));

    parametres.next({ slug: 'edition-b' });

    expect(seo.calls.mostRecent().args[0]).toEqual(seoProvisoire('edition-b'));
    afficherB();
  });
});

describe('ArticleDetailComponent — métadonnées SEO', () => {
  function seoApres(repondre: (requete: TestRequest) => void): SeoConfig {
    const { seo, http, requete } = monterLaFiche('veille');
    const miseAJour = spyOn(seo, 'updateSeoMetadata');
    TestBed.createComponent(ArticleDetailComponent).detectChanges();

    repondre(requete('veille'));

    http.verify();
    expect(miseAJour).toHaveBeenCalledTimes(2);
    return miseAJour.calls.mostRecent().args[0];
  }

  const seoDeLArticle = () =>
    seoApres((requete) =>
      requete.flush(
        buildPublishedArticle({
          slug: 'veille',
          seo: { ...buildPublishedArticle().seo, canonical_path: '/articles/veille/' },
        }),
      ),
    );

  it('construit le canonical comme le reste du site, base terminee par un slash comprise', () => {
    const config = seoDeLArticle();
    expect(config.canonicalUrl).toBe('https://example.com/fr/articles/veille');
    expect(config.ogUrl).toBe('https://example.com/fr/articles/veille');
  });

  it('pose seule tout le SEO de la page, que le gestionnaire du site lui laisse', () => {
    const config = seoDeLArticle();

    expect(config.robots).toBe('index, follow');
    expect(config.hreflangs).toEqual({ fr: 'https://example.com/fr/articles/veille' });
    expect(config.ogImage).toBe('https://example.com/assets/images/logo.webp');
    expect(config.twitterImage).toBe('https://example.com/assets/images/logo.webp');
    expect(config.twitterCard).toBe('summary_large_image');
  });

  it('retire de l’index une édition introuvable, sans JSON-LD ni hreflang hérités', () => {
    const config = seoApres((requete) =>
      requete.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' }),
    );

    expect(config.title).toBe('Article introuvable — Asili Design');
    expect(config.robots).toBe('noindex, nofollow');
    expect(config.canonicalUrl).toBe('https://example.com/fr/articles/veille');
    expect(config.hreflangs).toEqual({});
    expect(config.jsonLd).toBeUndefined();
    expect(config.ogImage).toBe('https://example.com/assets/images/logo.webp');
    expect(config.twitterImage).toBe('https://example.com/assets/images/logo.webp');
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
      title: 'V8 accélère',
      body: 'Le corps du décryptage.',
      items: [
        buildItemDeSection({
          entity: 'Source du décryptage',
          text: 'Source du décryptage : V8 accélère',
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
    expect(texteDe(sources.querySelector('summary'))).toBe('Afficher la liste');
    expect(textes(sources, '.sources__publication')).toContain('Vercel Blog');
  });

  it('titre le bloc des sources par un vrai h2, hors du bouton qui le déplie', () => {
    const page = rendre(buildEditionMorningBrief());
    const section = page.querySelector('#edition-sources')!;
    const titre = section.querySelector('h2');

    expect(texteDe(titre)).toBe('Toutes les sources (6)');
    expect(titre?.closest('summary')).toBeNull();
    expect(section.getAttribute('aria-labelledby')).toBe(titre?.id ?? 'absent');
    expect(section.querySelector('summary h2, summary [role="heading"]')).toBeNull();
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

describe('ArticleDetailComponent — sommaire repliable sur mobile', () => {
  type Rappel = (entrees: readonly Partial<IntersectionObserverEntry>[]) => void;
  let rappels: Rappel[];

  beforeAll(() => registerLocaleData(localeFr));

  beforeEach(() => {
    rappels = [];
    spyOn(window, 'IntersectionObserver').and.callFake(function faux(rappel: Rappel) {
      rappels.push(rappel);
      return { observe: () => undefined, unobserve: () => undefined, disconnect: () => undefined };
    } as unknown as () => IntersectionObserver);
  });

  function monter() {
    const edition = buildEditionMorningBrief();
    const { parametres, requete } = monterLaFiche(edition.slug);
    const fixture = TestBed.createComponent(ArticleDetailComponent);
    fixture.autoDetectChanges();
    const servir = (slug: string) => {
      requete(slug).flush({ ...edition, slug });
      fixture.detectChanges();
    };
    servir(edition.slug);
    const page = fixture.nativeElement as HTMLElement;
    const bascule = () => page.querySelector<HTMLButtonElement>('.sommaire__bascule')!;
    const lire = (ancre: string) => {
      for (const rappel of rappels) {
        rappel([{ isIntersecting: true, target: page.querySelector(`#${ancre}`)! }]);
      }
      fixture.detectChanges();
    };
    return { fixture, page, bascule, parametres, servir, lire };
  }

  it('repart d’un sommaire fermé et sans partie lue sur l’édition suivante', async () => {
    const { fixture, bascule, parametres, servir, lire } = monter();
    await fixture.whenStable();
    bascule().click();
    lire('mb-deep-dive');

    parametres.next({ slug: 'morning-brief-2026-11-09' });
    servir('morning-brief-2026-11-09');

    expect(bascule().getAttribute('aria-expanded')).toBe('false');
    expect(texteDe(bascule())).toContain('Sommaire · 8 parties');
  });

  it('ouvre la liste par une seule commande, et la referme au choix d’une partie', () => {
    const { fixture, page, bascule } = monter();
    const liste = page.querySelector('.sommaire ol')!;

    expect(bascule().getAttribute('aria-expanded')).toBe('false');
    expect(bascule().getAttribute('aria-controls')).toBe(liste.id);
    expect(page.querySelector('.sommaire--ouvert')).toBeNull();

    bascule().click();
    fixture.detectChanges();
    expect(bascule().getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector('.sommaire--ouvert')).not.toBeNull();

    liste.querySelector<HTMLAnchorElement>('a')!.click();
    fixture.detectChanges();
    expect(bascule().getAttribute('aria-expanded')).toBe('false');
  });

  it('nomme la partie en cours de lecture, puis le nombre de parties avant toute lecture', async () => {
    const { fixture, bascule, lire } = monter();
    await fixture.whenStable();

    expect(texteDe(bascule())).toContain('Sommaire · 8 parties');

    lire('mb-deep-dive');

    expect(texteDe(bascule())).toContain('Sommaire · Le décryptage');
  });
});
