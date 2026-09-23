import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import seoMetadata from '../assets/seo/seo-metadata.json';
import { buildLlmsFullTxt, buildLlmsTxt, buildSitemapXml } from './seo-builders';
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

describe('injectSeoHead — flux RSS des articles', () => {
  const metadata = buildMetadata({ '@type': 'LocalBusiness' });

  it('annonce le flux RSS de la langue de la page', () => {
    const html = injectSeoHead(EMPTY_HTML, metadata, '/en/articles', BASE_URL);

    expect(html).toContain(
      '<link rel="alternate" type="application/rss+xml" title="AI Watch — Asili Design" href="https://asilidesign.fr/api/v1/portfolio25/articles/feed.xml?locale=en" />',
    );
  });

  it('retombe sur la langue par défaut hors préfixe', () => {
    const html = injectSeoHead(EMPTY_HTML, metadata, '/', BASE_URL);

    expect(html).toContain(
      'title="Veille IA — Asili Design" href="https://asilidesign.fr/api/v1/portfolio25/articles/feed.xml?locale=fr"',
    );
  });

  it('ne duplique pas le lien sur un HTML déjà injecté', () => {
    const once = injectSeoHead(EMPTY_HTML, metadata, '/fr/', BASE_URL);
    const twice = injectSeoHead(once, metadata, '/fr/', BASE_URL);

    expect(twice.match(/application\/rss\+xml/g)?.length).toBe(1);
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

  it('déclare la page B2 comme une route connue', () => {
    expect(isKnownRoute(CHEMIN_B2, METADONNEES)).toBeTrue();
  });

  it('L1 · ne pose plus de canonique sur la page B2 retirée, qui mène au poste étudiant', () => {
    const html = injectSeoHead(EMPTY_HTML, METADONNEES, `/fr${CHEMIN_B2}`, BASE_URL);

    expect(html).not.toContain('rel="canonical"');
  });

  it('L1 · ne publie plus la page B2 retirée au sitemap ni à llms.txt', () => {
    const sitemap = buildSitemapXml(METADONNEES, BASE_URL);
    const llms = buildLlmsTxt(METADONNEES, BASE_URL);
    const llmsComplet = buildLlmsFullTxt(METADONNEES, BASE_URL);

    expect([sitemap, llms, llmsComplet].filter((texte) => texte.includes(CHEMIN_B2))).toEqual([]);
  });

  it('L1 · annonce le nombre d écrans de la version 3 servie', () => {
    const page = METADONNEES.pages.find((candidate) => candidate.path === CHEMIN_B2);
    const textes = JSON.stringify(page?.locales);

    expect(textes).not.toContain('72');
    expect(textes).toContain('55 écrans');
    expect(textes).toContain('55 screens');
  });
});
