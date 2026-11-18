import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { ReplaySubject, Subject, of } from 'rxjs';
import { fournirLaRoute } from '../../../testing/factories/serveur/route.factory';
import { SeoRegistryService } from '../../core/seo/seo-registry.service';
import type { SeoConfig } from '../../core/seo/seo.interface';
import { SeoService } from '../../core/seo/seo.service';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { SeoManagerComponent } from './seo-manager.component';

describe('SeoManagerComponent', () => {
  let component: SeoManagerComponent;
  let fixture: ComponentFixture<SeoManagerComponent>;
  let routerEvents$: Subject<NavigationEnd>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let seoRegistrySpy: jasmine.SpyObj<SeoRegistryService>;
  let routeData$: Subject<Record<string, unknown>>;
  let routerStub: { events: unknown; url: string };

  const baseSeoConfig = {
    index: true,
    title: 'Page de test',
    description: 'Description de test',
    keywords: ['test', 'seo'],
    ogImage: '/assets/images/test.webp',
    twitterCard: 'summary_large_image',
  } satisfies SeoConfig;

  const resolvedConfig: SeoConfig = baseSeoConfig;

  beforeEach(async () => {
    routerEvents$ = new Subject<NavigationEnd>();
    routeData$ = new ReplaySubject<Record<string, unknown>>(1);

    seoServiceSpy = jasmine.createSpyObj<SeoService>('SeoService', ['updateSeoMetadata']);

    seoRegistrySpy = jasmine.createSpyObj<SeoRegistryService>('SeoRegistryService', [
      'getSeoByKey',
      'getLocales',
      'getDefaultLocale',
      'getLocaleId',
    ]);
    seoRegistrySpy.getLocales.and.returnValue(['fr', 'en']);
    seoRegistrySpy.getDefaultLocale.and.returnValue('fr');
    seoRegistrySpy.getLocaleId.and.returnValue('fr');
    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));

    routerStub = {
      events: routerEvents$.asObservable(),
      url: '/fr/test',
    };

    await configure('https://example.com');
  });

  async function configure(appBaseUrl: string): Promise<void> {
    await setupTestBed({
      http: false,
      imports: [SeoManagerComponent],
      appConfig: { baseUrl: appBaseUrl },
      providers: [
        { provide: Router, useValue: routerStub },
        fournirLaRoute({ donnees: routeData$ }),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: SeoRegistryService, useValue: seoRegistrySpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeoManagerComponent);
    component = fixture.componentInstance;
  }

  function naviguer(
    url: string,
    donnees: Record<string, unknown> = { seoKey: 'test-page' },
  ): SeoConfig {
    fixture.detectChanges();
    routerEvents$.next(new NavigationEnd(1, url, url));
    routeData$.next(donnees);
    return seoServiceSpy.updateSeoMetadata.calls.mostRecent().args[0];
  }

  it('devrait se creer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appliquer la config SEO depuis le registre par cle', () => {
    const call = naviguer('/fr/test');

    expect(seoRegistrySpy.getSeoByKey).toHaveBeenCalledWith('test-page');
    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(1);
    expect(call.title).toBe('Page de test');
  });

  it('garde le SEO de la page quand la navigation ne change que l’ancre', () => {
    const page = '/fr/articles/morning-brief-2026-11-08';
    const ancre = `${page}#mb-essential`;
    naviguer(page);
    routerEvents$.next(new NavigationEnd(2, ancre, ancre));
    routerEvents$.next(new NavigationEnd(3, page, page));

    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(1);
  });

  it('applique le SEO de la page suivante, même quand elle porte une ancre', () => {
    naviguer('/fr/articles/morning-brief-2026-11-08#mb-essential');
    const suivante = '/fr/articles#archives';
    routerEvents$.next(new NavigationEnd(2, suivante, suivante));

    expect(seoServiceSpy.updateSeoMetadata).toHaveBeenCalledTimes(2);
  });

  it('laisse la page poser son SEO quand sa route ne porte aucune clé SEO', () => {
    fixture.detectChanges();
    const page = '/fr/articles/morning-brief-2026-11-08';
    routerEvents$.next(new NavigationEnd(1, page, page));
    routeData$.next({});

    expect(seoRegistrySpy.getSeoByKey).not.toHaveBeenCalled();
    expect(seoServiceSpy.updateSeoMetadata).not.toHaveBeenCalled();
  });

  it('ART-IDX-4 · lit l indexation dans seo-metadata seul, qu aucune donnée de route ne contredit', () => {
    seoRegistrySpy.getSeoByKey.and.returnValue(of({ ...baseSeoConfig, index: false }));
    expect(naviguer('/fr/test').index).toBeFalse();

    seoRegistrySpy.getSeoByKey.and.returnValue(of(resolvedConfig));
    expect(
      naviguer('/fr/test', { seoKey: 'test-page', robots: 'noindex, nofollow' }).index,
    ).toBeTrue();
  });

  it('ne donne à une page non indexée ni canonique ni hreflang, qu elle ne servirait pas', () => {
    seoRegistrySpy.getSeoByKey.and.returnValue(
      of({ title: 'Connexion', description: 'Connexion', index: false }),
    );
    routerStub.url = '/fr/login';

    const call = naviguer('/fr/login');

    expect(Object.keys(call).filter((cle) => ['canonicalUrl', 'hreflangs'].includes(cle))).toEqual(
      [],
    );
    expect(call.ogUrl).toBe('https://example.com/fr/login');
  });

  it('devrait construire les hreflangs pour toutes les locales', () => {
    const call = naviguer('/fr/test');

    expect(call.hreflangs).toBeDefined();
    expect(call.hreflangs!['fr']).toBe('https://example.com/fr/test');
    expect(call.hreflangs!['en']).toBe('https://example.com/en/test');
    expect(call.hreflangs!['x-default']).toBe('https://example.com/fr/test');
  });

  it('devrait construire les URLs canoniques correctement', () => {
    const call = naviguer('/fr/test');

    expect(call.canonicalUrl).toBe('https://example.com/fr/test');
    expect(call.ogUrl).toBe('https://example.com/fr/test');
  });

  it('devrait resoudre les URLs absolues pour ogImage', () => {
    const configAvecImageRelative: SeoConfig = {
      ...baseSeoConfig,
      ogImage: '/assets/images/og.webp',
    };
    seoRegistrySpy.getSeoByKey.and.returnValue(of(configAvecImageRelative));

    expect(naviguer('/fr/test').ogImage).toBe('https://example.com/assets/images/og.webp');
  });

  describe('accueil, aligne sur le canonical rendu par le serveur', () => {
    for (const url of ['/', '/fr', '/fr/']) {
      it(`canonise ${url} en /fr/ et annonce /fr/ et /en/`, () => {
        routerStub.url = url;

        const call = naviguer(url);

        expect(call.canonicalUrl).toBe('https://example.com/fr/');
        expect(call.hreflangs).toEqual({
          fr: 'https://example.com/fr/',
          en: 'https://example.com/en/',
          'x-default': 'https://example.com/fr/',
        });
      });
    }

    it('garde la locale portee par le chemin', () => {
      routerStub.url = '/en/';

      expect(naviguer('/en/').canonicalUrl).toBe('https://example.com/en/');
    });

    it('canonise dans la locale du build quand router.url ne porte pas de locale, comme en prod', () => {
      seoRegistrySpy.getLocaleId.and.returnValue('en');
      routerStub.url = '/';

      const accueil = naviguer('/');

      expect(accueil.canonicalUrl).toBe('https://example.com/en/');
      expect(accueil.hreflangs).toEqual({
        fr: 'https://example.com/fr/',
        en: 'https://example.com/en/',
        'x-default': 'https://example.com/fr/',
      });

      routerStub.url = '/contact?utm=x';

      expect(naviguer('/contact?utm=x').canonicalUrl).toBe('https://example.com/en/contact');
    });
  });

  describe('normalisation des slashes', () => {
    it('retire les slashes de tete et de queue du chemin', () => {
      routerStub.url = '//fr//test//';

      const call = naviguer('//fr//test//');

      expect(call.canonicalUrl).toBe('https://example.com/fr/test');
      expect(call.hreflangs!['en']).toBe('https://example.com/en/test');
    });

    it('retire les slashes finaux de la base URL', async () => {
      TestBed.resetTestingModule();
      await configure('https://example.com//');

      expect(naviguer('/fr/test').canonicalUrl).toBe('https://example.com/fr/test');
    });
  });
});
