import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Observable, firstValueFrom } from 'rxjs';
import { SeoRegistryService } from './seo-registry.service';

describe('SeoRegistryService', () => {
  function createService(locale: string): SeoRegistryService {
    TestBed.configureTestingModule({
      providers: [SeoRegistryService, { provide: LOCALE_ID, useValue: locale }],
    });
    return TestBed.inject(SeoRegistryService);
  }

  async function seoTrouve<T>(recherche: Observable<T | null>): Promise<T> {
    const result = await firstValueFrom(recherche);
    expect(result).not.toBeNull();
    return result!;
  }

  const seoParCle = (locale: string, cle: string) =>
    seoTrouve(createService(locale).getSeoByKey(cle));

  const seoParChemin = (path: string) => seoTrouve(createService('fr').getSeoByPath(path));

  describe('getBaseUrl', () => {
    it("devrait retourner l'URL de base du site", () => {
      const service = createService('fr');
      expect(service.getBaseUrl()).toBe('https://asilidesign.fr');
    });
  });

  describe('getLocales', () => {
    it('devrait retourner les locales configurees', () => {
      const service = createService('fr');
      const locales = service.getLocales();
      expect(locales).toContain('fr');
      expect(locales).toContain('en');
      expect(locales.length).toBe(2);
    });
  });

  describe('getLocaleId', () => {
    const localeCases: { label: string; locale: string; expected: string }[] = [
      { label: "devrait retourner 'fr' quand la locale est 'fr'", locale: 'fr', expected: 'fr' },
      { label: "devrait retourner 'en' quand la locale est 'en'", locale: 'en', expected: 'en' },
      {
        label: "devrait extraire la langue de base d'une locale composee (ex: fr-FR)",
        locale: 'fr-FR',
        expected: 'fr',
      },
      {
        label: 'devrait retourner la locale par defaut pour une locale inconnue',
        locale: 'ja',
        expected: 'fr',
      },
    ];

    for (const { label, locale, expected } of localeCases) {
      it(label, () => {
        const service = createService(locale);
        expect(service.getLocaleId()).toBe(expected);
      });
    }
  });

  describe('getDefaultLocale', () => {
    it("devrait retourner 'fr' comme locale par defaut", () => {
      const service = createService('fr');
      expect(service.getDefaultLocale()).toBe('fr');
    });
  });

  describe('getSeoByKey', () => {
    it("devrait retourner la config SEO pour la cle 'home'", async () => {
      const { seo, index, page } = await seoParCle('fr', 'home');

      expect(seo.title).toBe('Accueil — Tim Moyence Portfolio');
      expect(seo.description).toBe(
        'Découvrez mes services professionnels, réalisations et solutions digitales sur mesure. Tim Moyence, développeur web freelance à Bordeaux.',
      );
      expect(index).toBeTrue();
      expect(page.id).toBe('home');
    });

    it("devrait retourner la config SEO en anglais pour la cle 'home'", async () => {
      const { seo } = await seoParCle('en', 'home');

      expect(seo.title).toBe('Home — Tim Moyence, freelance web developer Bordeaux');
    });

    it('devrait retourner null pour une cle inexistante', async () => {
      const service = createService('fr');
      const result = await firstValueFrom(service.getSeoByKey('cle-inexistante'));

      expect(result).toBeNull();
    });

    it('devrait inclure les defaults (keywords, ogImage) si la page ne les definit pas', async () => {
      const { seo } = await seoParCle('fr', 'home');

      expect(seo.keywords).toBeDefined();
      expect(seo.keywords!.length).toBeGreaterThan(0);
      expect(seo.ogImage).toBe('/assets/images/logo.webp');
      expect(seo.twitterCard).toBe('summary_large_image');
    });

    it('devrait retourner index false pour la page login', async () => {
      const { index } = await seoParCle('fr', 'login');

      expect(index).toBeFalse();
    });

    it('devrait retourner les ogTitle et ogDescription depuis la page', async () => {
      const { seo } = await seoParCle('fr', 'home');

      expect(seo.ogTitle).toBe('Accueil de Tim Moyence');
      expect(seo.ogDescription).toBe(
        'Découvrez mes services professionnels et mes réalisations en développement web.',
      );
    });
  });

  describe('getSeoByPath', () => {
    const pathCases: { label: string; path: string; expectedId: string }[] = [
      {
        label: "devrait retourner la config SEO pour le chemin '/'",
        path: '/',
        expectedId: 'home',
      },
      {
        label: 'devrait normaliser le chemin en supprimant le prefixe de locale',
        path: '/fr/presentation',
        expectedId: 'presentation',
      },
      {
        label: "devrait normaliser le chemin '/home' vers la page d'accueil",
        path: '/home',
        expectedId: 'home',
      },
      {
        label: 'devrait ignorer les query params et fragments',
        path: '/contact?source=test#section',
        expectedId: 'contact',
      },
      {
        label: 'devrait normaliser les slashs en trop',
        path: '///contact///',
        expectedId: 'contact',
      },
      {
        label: 'devrait normaliser un chemin fait uniquement de slashs',
        path: '//////',
        expectedId: 'home',
      },
      {
        label: 'devrait normaliser un slash final isole',
        path: '/contact/',
        expectedId: 'contact',
      },
    ];

    for (const { label, path, expectedId } of pathCases) {
      it(label, async () => {
        const { page } = await seoParChemin(path);

        expect(page.id).toBe(expectedId);
      });
    }

    it("devrait retourner la config SEO pour '/presentation'", async () => {
      const { page, seo } = await seoParChemin('/presentation');

      expect(page.id).toBe('presentation');
      expect(seo.title).toBe('Présentation — Tim Moyence Portfolio');
    });

    it('devrait retourner null pour un chemin inexistant', async () => {
      const service = createService('fr');
      const result = await firstValueFrom(service.getSeoByPath('/chemin-inexistant'));

      expect(result).toBeNull();
    });
  });

  describe('resolution de locale avec fallback', () => {
    it("devrait fallback sur la locale par defaut si la locale demandee n'existe pas dans la page", async () => {
      expect((await seoParCle('ja', 'home')).seo.title).toBe('Accueil — Tim Moyence Portfolio');
    });

    it('devrait fallback depuis une locale composee vers la langue de base', async () => {
      expect((await seoParCle('fr-CA', 'home')).seo.title).toBe('Accueil — Tim Moyence Portfolio');
    });
  });
});
