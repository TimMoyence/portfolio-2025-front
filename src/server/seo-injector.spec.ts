import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import { injectSeoHead, isKnownRoute } from './seo-injector';

const BASE_URL = 'https://asilidesign.fr';
const EMPTY_HTML = '<html><head><title>x</title></head><body></body></html>';

/**
 * Construit un `SeoMetadataFile` minimal centre sur un unique bloc JSON-LD
 * global, suffisant pour exercer la serialisation des scripts injectes.
 */
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

/** Extrait le contenu brut du premier bloc `application/ld+json` du HTML. */
const extractFirstJsonLd = (html: string): string => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return match ? match[1] : '';
};

describe('injectSeoHead — echappement JSON-LD', () => {
  it('neutralise tout `<` dans le JSON serialise, pas seulement `</script>`', () => {
    // Sequence qui ouvre l'etat « script data double escaped » du parseur HTML :
    // `<!--` puis `<script` empeche le `</script>` suivant de fermer le bloc.
    const metadata = buildMetadata({
      '@type': 'LocalBusiness',
      name: '<!--<script>alert(1)</script>-->',
    });

    const html = injectSeoHead(EMPTY_HTML, metadata, '/fr/', BASE_URL);

    expect(html).not.toContain('<!--');
    expect(html).not.toContain('<script>alert');
    // Aucun `<` residuel a l'interieur du bloc JSON-LD.
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
