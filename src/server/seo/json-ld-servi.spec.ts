import { METADONNEES_DU_SITE } from '../../app/core/seo/site-servi';
import { type BlocJsonLd, jsonLdDeLaPage, serialiserJsonLd } from '../../app/core/seo/json-ld';
import { SeoRegistryService } from '../../app/core/seo/seo-registry.service';
import { buildPageSeoFr, buildSeoMetadata } from '../../testing/factories/seo-metadata.factory';
import { injectSeoHead } from './seo-injector';

const EMPTY_HTML = '<html><head><title>x</title></head><body></body></html>';

const blocsDeLaPage = (locale: string, id: string): BlocJsonLd[] | undefined => {
  let blocs: BlocJsonLd[] | undefined;
  new SeoRegistryService(locale).getSeoByKey(id).subscribe((resolu) => {
    blocs = resolu?.jsonLd as BlocJsonLd[] | undefined;
  });
  return blocs;
};

const typesDe = (blocs: BlocJsonLd[] | undefined): unknown[] | undefined =>
  blocs?.map((bloc) => bloc['@type']);

describe('JSON-LD servi', () => {
  it('ART-JSONLD-1 · la page écrit elle-même ses données structurées, que le serveur ne double pas', () => {
    const duSite = ['LocalBusiness', 'SiteNavigationElement'];

    expect(typesDe(blocsDeLaPage('fr', 'home'))).toEqual([...duSite, 'Person', 'WebSite']);
    expect(typesDe(blocsDeLaPage('fr', 'contact'))).toEqual([
      ...duSite,
      'Person',
      'ContactPage',
      'BreadcrumbList',
    ]);
    expect(typesDe(blocsDeLaPage('fr', 'presentation'))).toEqual([
      ...duSite,
      'Person',
      'ProfilePage',
      'BreadcrumbList',
    ]);
    expect(blocsDeLaPage('fr', 'login')).toBeUndefined();

    const servi = injectSeoHead(
      EMPTY_HTML,
      METADONNEES_DU_SITE,
      '/fr/contact',
      'https://asilidesign.fr',
    );
    expect(servi).toContain('application/rss+xml');
    expect(servi).not.toContain('application/ld+json');
  });

  for (const locale of ['fr', 'en']) {
    it(`REC-09 · sur /presentation, la personne servie est global.person composée dans la langue de la page, que tout autre bloc désigne par son seul @id (${locale})`, () => {
      const personne = `${METADONNEES_DU_SITE.site.baseUrl}/#person`;
      const decrites = (valeur: unknown): Record<string, unknown>[] => {
        if (Array.isArray(valeur)) return valeur.flatMap(decrites);
        if (valeur === null || typeof valeur !== 'object') return [];
        const bloc = valeur as Record<string, unknown>;
        const decrite = bloc['@id'] === personne && Object.keys(bloc).some((cle) => cle !== '@id');
        return [...(decrite ? [bloc] : []), ...Object.values(bloc).flatMap(decrites)];
      };

      expect(decrites(blocsDeLaPage(locale, 'presentation'))).toEqual(
        jsonLdDeLaPage(METADONNEES_DU_SITE, locale).filter((bloc) => bloc['@type'] === 'Person'),
      );
    });

    it(`ART-IDX-2 · l'accueil ne déclare aucune recherche interne (${locale})`, () => {
      const siteWeb = blocsDeLaPage(locale, 'home')?.find((bloc) => bloc['@type'] === 'WebSite');

      expect(siteWeb?.['url']).toBe('https://asilidesign.fr');
      expect(siteWeb?.['potentialAction']).toBeUndefined();
    });
  }
});

describe('serialiserJsonLd', () => {
  it('neutralise tout `<` du JSON, pas seulement `</script>`', () => {
    expect(serialiserJsonLd({ name: '<!--<script>alert(1)</script>-->' })).not.toContain('<');
  });

  it("laisse le JSON-LD strictement parsable et identique a l'objet source", () => {
    const source = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '<!--<script>x</script>-->',
      description: 'a < b && c </SCRIPT> d',
      areaServed: ['Bordeaux', '<b>Nouvelle-Aquitaine</b>'],
    };

    expect(JSON.parse(serialiserJsonLd(source))).toEqual(source);
  });

  it("preserve les valeurs sans chevron a l'identique", () => {
    const source = { '@type': 'LocalBusiness', name: 'Asili Design' };

    expect(serialiserJsonLd(source)).toBe(JSON.stringify(source));
  });
});

describe('jsonLdDeLaPage — fraicheur du JSON-LD de la page', () => {
  const blocsDatés = (jsonLd: BlocJsonLd): BlocJsonLd[] => {
    const page = buildPageSeoFr('article', '/', { jsonLd }, { lastmod: '2026-10-01' });
    return jsonLdDeLaPage(buildSeoMetadata([page]), 'fr', page);
  };

  it('date un bloc d un type connu du lastmod de la page', () => {
    expect(blocsDatés({ '@type': 'Article', headline: 'A' })).toEqual([
      jasmine.objectContaining({ dateModified: '2026-10-01', datePublished: '2026-10-01' }),
    ]);
  });

  it('laisse tel quel un bloc dont le type n est pas un texte', () => {
    const bloc = { '@type': ['Article'], headline: 'A' };

    expect(blocsDatés(bloc)).toEqual([bloc]);
  });
});
