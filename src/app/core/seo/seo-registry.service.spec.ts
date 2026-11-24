import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Observable, firstValueFrom } from 'rxjs';
import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { type FicheServie, jsonLdDUneFiche } from './json-ld';
import { SeoRegistryService } from './seo-registry.service';
import { METADONNEES_DU_SITE } from './site-servi';

const accueil = seoMetadata.pages.find(({ id }) => id === 'home')!.locales;

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

      expect(seo.title).toBe(accueil.fr.title);
      expect(seo.description).toBe(accueil.fr.description);
      expect(seo.index).toBeTrue();
    });

    it("devrait retourner la config SEO en anglais pour la cle 'home'", async () => {
      const seo = await seoParCle('en', 'home');

      expect(seo.title).toBe(accueil.en.title);
      expect(seo.title).not.toBe(accueil.fr.title);
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

      expect(seo.ogTitle).toBe(accueil.fr.ogTitle);
      expect(seo.ogDescription).toBe(accueil.fr.ogDescription);
    });
  });

  describe('resolution de locale avec fallback', () => {
    it("devrait fallback sur la locale par defaut si la locale demandee n'existe pas dans la page", async () => {
      expect((await seoParCle('ja', 'home')).title).toBe(accueil.fr.title);
    });

    it('devrait fallback depuis une locale composee vers la langue de base', async () => {
      expect((await seoParCle('fr-CA', 'home')).title).toBe(accueil.fr.title);
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

  describe('jsonLdDUneFiche · le fil d une fiche suit la langue servie et refuse un parent sans page', () => {
    const ficheSous = (parent: string, url: string): FicheServie => ({
      parent,
      nom: 'Morning brief',
      url,
      bloc: { '@context': 'https://schema.org', '@type': 'Article' },
    });

    const filDeLaFiche = (locale: string, fiche: FicheServie): unknown =>
      jsonLdDUneFiche(METADONNEES_DU_SITE, locale, fiche).find(
        (bloc) => bloc['@type'] === 'BreadcrumbList',
      )?.['itemListElement'];

    const etapes = (noms: readonly (readonly [string, string])[]): unknown =>
      noms.map(([name, item], rang) => ({ '@type': 'ListItem', position: rang + 1, name, item }));

    it('en anglais, chaque étape porte son nom court anglais et son URL en /en', () => {
      const url = 'https://asilidesign.fr/en/articles/morning-brief';

      expect(filDeLaFiche('en', ficheSous('/articles', url))).toEqual(
        etapes([
          ['Home', 'https://asilidesign.fr/en/'],
          ['Articles', 'https://asilidesign.fr/en/articles'],
          ['Morning brief', url],
        ]),
      );
    });

    it('sous l accueil, le fil compte l accueil puis la fiche', () => {
      const url = 'https://asilidesign.fr/fr/morning-brief';

      expect(filDeLaFiche('fr', ficheSous('/', url))).toEqual(
        etapes([
          ['Accueil', 'https://asilidesign.fr/fr/'],
          ['Morning brief', url],
        ]),
      );
    });

    it('un parent sans page indexable est refusé', () => {
      const fiche = ficheSous('/inconnu', 'https://asilidesign.fr/fr/inconnu/fiche');

      expect(() => jsonLdDUneFiche(METADONNEES_DU_SITE, 'fr', fiche)).toThrowError(
        'préfixe sans page indexable : /inconnu (de /inconnu)',
      );
    });
  });
});
