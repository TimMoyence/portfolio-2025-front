import { registerLocaleData } from '@angular/common';
import { HttpTestingController, type TestRequest } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  buildPublishedArticle,
  buildRecitDuMatin,
} from '../../../../testing/factories/article.factory';
import { fournirLaRoute } from '../../../../testing/factories/serveur/route.factory';
import { ancresDuSommaire, rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { texteDe } from '../../../../testing/texte/textes-dom';
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

describe('ArticleDetailComponent — l’édition d’avant la refonte, en texte suivi', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-20 · se replie sur le markdown et nomme ses sources quand l’article n’a pas de sections', () => {
    const page = rendreLaFiche(
      buildPublishedArticle({
        content_markdown: '## Veille\n\nUn paragraphe.',
        sources: [{ nom: 'Le Monde', url: 'https://www.lemonde.fr/x', publie_le: null }],
      }),
    );

    expect(texteDe(page.querySelector('h1'))).toBe('Veille IA');
    expect(texteDe(page.querySelector('.article-markdown'))).toContain('Un paragraphe.');
    expect(page.querySelector('.sommaire')).toBeNull();
    const lien = page.querySelector('.article-sources a');
    expect(lien?.getAttribute('href')).toBe('https://www.lemonde.fr/x');
    expect(texteDe(lien)).toBe('Le Monde');
  });
});

describe('ArticleDetailComponent — sommaire repliable sur mobile', () => {
  type Rappel = (entrees: readonly Partial<IntersectionObserverEntry>[]) => void;
  let rappels: Rappel[];
  let deconnexions: number;

  beforeAll(() => registerLocaleData(localeFr));

  beforeEach(() => {
    rappels = [];
    deconnexions = 0;
    spyOn(window, 'IntersectionObserver').and.callFake(function faux(rappel: Rappel) {
      rappels.push(rappel);
      return {
        observe: () => undefined,
        unobserve: () => undefined,
        disconnect: () => (deconnexions += 1),
      };
    } as unknown as () => IntersectionObserver);
  });

  function monter() {
    const edition = buildRecitDuMatin();
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

  it('ouvre un sommaire d’ancres vers chaque partie du récit, chacune présente sur la page', () => {
    const { page } = monter();

    expect(ancresDuSommaire(page)).toEqual([
      'recit-sujet',
      'recit-shot',
      'recit-decodeur',
      'recit-a-tester',
      'recit-sorties',
      'recit-chiffre',
      'recit-citation',
      'recit-a-part-ca',
    ]);
    expect(
      ancresDuSommaire(page).every((ancre) => page.querySelector(`[id="${ancre}"]`)),
    ).toBeTrue();
  });

  it('repart d’un sommaire fermé et sans partie lue sur l’édition suivante', async () => {
    const { fixture, bascule, parametres, servir, lire } = monter();
    await fixture.whenStable();
    bascule().click();
    lire('recit-shot');

    const avant = deconnexions;
    parametres.next({ slug: 'morning-brief-2026-11-12' });
    expect(deconnexions).toBe(avant + 1);
    servir('morning-brief-2026-11-12');

    expect(bascule().getAttribute('aria-expanded')).toBe('false');
    expect(texteDe(bascule())).toContain('Sommaire · 8 parties');
  });

  it('pose le focus sur la partie choisie, la liste refermée', () => {
    const { page, bascule } = monter();
    bascule().click();

    page.querySelector<HTMLAnchorElement>('.sommaire ol a')!.click();

    expect(document.activeElement).toBe(page.querySelector('#recit-sujet'));
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

    lire('recit-shot');

    expect(texteDe(bascule())).toContain('Sommaire · Le Shot');
  });
});
