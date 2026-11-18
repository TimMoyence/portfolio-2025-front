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

  const CHAMPS_DE_L_INDEX = ['canonicalUrl', 'hreflangs', 'jsonLd'];

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
      const seo = await seoParCle('fr', 'home');

      expect(seo.title).toBe('Accueil — Tim Moyence Portfolio');
      expect(seo.description).toBe(
        'Découvrez mes services professionnels, réalisations et solutions digitales sur mesure. Tim Moyence, développeur web freelance à Bordeaux.',
      );
      expect(seo.index).toBeTrue();
    });

    it("devrait retourner la config SEO en anglais pour la cle 'home'", async () => {
      const seo = await seoParCle('en', 'home');

      expect(seo.title).toBe('Home — Tim Moyence, freelance web developer Bordeaux');
    });

    it('refuse une clé que seo-metadata.json ne connaît pas, au lieu d’inventer un SEO', () => {
      expect(() => createService('fr').getSeoByKey('cle-inexistante')).toThrowError(
        'clé SEO « cle-inexistante » absente de seo-metadata.json',
      );
    });

    it('ne donne à une page non indexée ni canonique, ni hreflang, ni données structurées', async () => {
      const seo = await seoParCle('fr', 'login');

      expect(Object.keys(seo).filter((cle) => CHAMPS_DE_L_INDEX.includes(cle))).toEqual([]);
    });

    it('devrait inclure les defaults (keywords, ogImage) si la page ne les definit pas', async () => {
      const seo = await seoParCle('fr', 'home');

      expect(seo.keywords).toBeDefined();
      expect(seo.keywords!.length).toBeGreaterThan(0);
      expect(seo.ogImage).toBe('/assets/images/logo.webp');
      expect(seo.twitterCard).toBe('summary_large_image');
    });

    it('devrait retourner index false pour la page login', async () => {
      expect((await seoParCle('fr', 'login')).index).toBeFalse();
    });

    it('devrait retourner les ogTitle et ogDescription depuis la page', async () => {
      const seo = await seoParCle('fr', 'home');

      expect(seo.ogTitle).toBe('Accueil de Tim Moyence');
      expect(seo.ogDescription).toBe(
        'Découvrez mes services professionnels et mes réalisations en développement web.',
      );
    });
  });

  describe('resolution de locale avec fallback', () => {
    it("devrait fallback sur la locale par defaut si la locale demandee n'existe pas dans la page", async () => {
      expect((await seoParCle('ja', 'home')).title).toBe('Accueil — Tim Moyence Portfolio');
    });

    it('devrait fallback depuis une locale composee vers la langue de base', async () => {
      expect((await seoParCle('fr-CA', 'home')).title).toBe('Accueil — Tim Moyence Portfolio');
    });
  });

  describe('JSON-LD de la page', () => {
    const itemsDuFil = async (locale: string): Promise<unknown[]> => {
      const blocs = (await seoParCle(locale, 'projets')).jsonLd as Record<string, unknown>[];
      const fil = blocs.find((bloc) => bloc['@type'] === 'BreadcrumbList');
      return (fil?.['itemListElement'] as { item: string }[]).map((element) => element.item);
    };

    for (const locale of ['fr', 'en']) {
      it(`ART-JSONLD-1 · sert le fil d Ariane dans la langue du bundle (${locale})`, async () => {
        expect(await itemsDuFil(locale)).toEqual([
          `https://asilidesign.fr/${locale}/`,
          `https://asilidesign.fr/${locale}/projets`,
        ]);
      });
    }
  });
});
