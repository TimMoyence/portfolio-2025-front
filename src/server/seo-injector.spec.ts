import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import seoMetadata from '../assets/seo/seo-metadata.json';
import { injectSeoHead, isKnownRoute } from './seo-injector';

const BASE_URL = 'https://asilidesign.fr';
const EMPTY_HTML = '<html><head><title>x</title></head><body></body></html>';

const buildMetadata = (
  localBusiness: Record<string, unknown>,
  overrides: Partial<SeoMetadataFile> = {},
): SeoMetadataFile =>
  ({
    site: {
      baseUrl: BASE_URL,
      defaultLocale: 'fr',
      locales: ['fr', 'en'],
      homePath: '/',
    },
    global: { localBusiness, siteNavigation: undefined },
    pages: [],
    ...overrides,
  }) as unknown as SeoMetadataFile;

const extractFirstJsonLd = (html: string): string => {
  const match = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  return match ? match[1] : '';
};

describe('injectSeoHead — echappement JSON-LD', () => {
  it('neutralise tout `<` dans le JSON serialise, pas seulement `</script>`', () => {
    const metadata = buildMetadata({
      '@type': 'LocalBusiness',
      name: '<!--<script>alert(1)</script>-->',
    });

    const html = injectSeoHead(EMPTY_HTML, metadata, '/fr/', BASE_URL);

    expect(html).not.toContain('<!--');
    expect(html).not.toContain('<script>alert');
    expect(extractFirstJsonLd(html)).not.toContain('<');
  });

  it("laisse le JSON-LD strictement parsable et identique a l'objet source", () => {
    const source = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '<!--<script>x</script>-->',
      description: 'a < b && c </SCRIPT> d',
      areaServed: ['Bordeaux', '<b>Nouvelle-Aquitaine</b>'],
    };
    const metadata = buildMetadata(source);

    const html = injectSeoHead(EMPTY_HTML, metadata, '/fr/', BASE_URL);
    const parsed: unknown = JSON.parse(extractFirstJsonLd(html));

    expect(parsed).toEqual(source);
  });

  it("preserve les valeurs sans chevron a l'identique", () => {
    const source = { '@type': 'LocalBusiness', name: 'Asili Design' };
    const metadata = buildMetadata(source);

    const html = injectSeoHead(EMPTY_HTML, metadata, '/fr/', BASE_URL);

    expect(extractFirstJsonLd(html)).toBe(JSON.stringify(source));
  });
});

describe('isKnownRoute', () => {
  it('reconnait une route declaree et rejette les autres', () => {
    const metadata = buildMetadata(
      { '@type': 'LocalBusiness' },
      {
        pages: [{ id: 'contact', path: '/contact', locales: {} }] as SeoMetadataFile['pages'],
      },
    );

    expect(isKnownRoute('/contact', metadata)).toBeTrue();
    expect(isKnownRoute('/inconnue', metadata)).toBeFalse();
  });
});

describe('seo-metadata.json — parcours B2 servi par le serveur', () => {
  const METADONNEES = seoMetadata as unknown as SeoMetadataFile;
  const CHEMIN_B2 = '/formations/b2-01-traitement-information-chiffree';

  const blocsJsonLd = (html: string): Record<string, unknown>[] =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (trouve) => JSON.parse(trouve[1]) as Record<string, unknown>,
    );

  it('déclare la page B2 comme une route connue', () => {
    expect(isKnownRoute(CHEMIN_B2, METADONNEES)).toBeTrue();
  });

  it('injecte la canonique et le Course du B2 tels que le fichier les déclare', () => {
    const html = injectSeoHead(EMPTY_HTML, METADONNEES, `/fr${CHEMIN_B2}`, BASE_URL);

    expect(html).toContain(`<link rel="canonical" href="${BASE_URL}/fr${CHEMIN_B2}" />`);
    const cours = blocsJsonLd(html).find((bloc) => bloc['@type'] === 'Course');
    expect(cours?.['duration']).toBe('PT3H30M');
    expect(cours?.['description']).toContain('72 écrans');
    expect(cours?.['url']).toBe(`${BASE_URL}/fr${CHEMIN_B2}`);
  });
});
