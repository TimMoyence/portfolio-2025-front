import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import {
  CHEMIN_DU_COURS_B2,
  buildPageDuCoursB2,
  buildPageSeoFr,
  buildSeoMetadata,
  type PageSeo,
} from '../testing/factories/seo-metadata.factory';
import { buildLlmsFullTxt, buildLlmsTxt, buildRobotsTxt, buildSitemapXml } from './seo-builders';

const BASE_URL = 'https://asilidesign.fr';

const pageSeule = (id: string, path: string, index: boolean, titre = 'x'): SeoMetadataFile =>
  buildSeoMetadata([buildPageSeoFr(id, path, { title: titre }, { index })]);

const sansPage = (overrides: Partial<SeoMetadataFile> = {}): SeoMetadataFile =>
  buildSeoMetadata([], overrides);

const sansLocale = (defaultLocale: string, page: PageSeo): SeoMetadataFile =>
  buildSeoMetadata([page], { site: { defaultLocale, locales: [] as string[] } as never });

describe('buildRobotsTxt', () => {
  it('emet un Disallow pour chaque page non-indexable standard', () => {
    const robots = buildRobotsTxt(pageSeule('login', '/login', false), BASE_URL);

    expect(robots).toContain('Disallow: /login');
    expect(robots).toContain('Disallow: /fr/login');
    expect(robots).toContain('Disallow: /en/login');
  });

  it('ignore les pages dont le path contient un parametre de route', () => {
    const metadata = pageSeule(
      'toolkit-private',
      '/formations/ia-solopreneurs/toolkit/:token',
      false,
    );

    const robots = buildRobotsTxt(metadata, BASE_URL);

    expect(robots).not.toContain(':token');
    expect(robots).not.toContain('/formations/ia-solopreneurs/toolkit/');
  });

  it('ignore cookie-settings pour permettre crawl + noindex meta', () => {
    const robots = buildRobotsTxt(
      pageSeule('cookie-settings', '/cookie-settings', false),
      BASE_URL,
    );

    expect(robots).not.toContain('Disallow: /cookie-settings');
    expect(robots).not.toContain('Disallow: /fr/cookie-settings');
    expect(robots).not.toContain('Disallow: /en/cookie-settings');
  });

  it('emet le Sitemap absolu en fin de fichier', () => {
    expect(buildRobotsTxt(sansPage(), BASE_URL)).toContain(
      'Sitemap: https://asilidesign.fr/sitemap.xml',
    );
  });

  it('emet un bloc Allow / quand toutes les pages sont indexables', () => {
    const robots = buildRobotsTxt(pageSeule('home', '/', true), BASE_URL);

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).not.toContain('Disallow:');
  });

  it('inclut un bloc dedie pour chaque user-agent IA', () => {
    const robots = buildRobotsTxt(sansPage(), BASE_URL);

    expect(robots).toContain('User-agent: GPTBot');
    expect(robots).toContain('User-agent: ClaudeBot');
    expect(robots).toContain('User-agent: PerplexityBot');
    expect(robots).toContain('User-agent: Google-Extended');
  });

  it('supporte une metadata sans locales (fallback liste vide)', () => {
    const metadata = sansLocale('fr', buildPageSeoFr('login', '/login', {}, { index: false }));

    const robots = buildRobotsTxt(metadata, BASE_URL);

    expect(robots).toContain('Disallow: /login');
    expect(robots).not.toContain('Disallow: /fr/login');
  });
});

describe('buildSitemapXml', () => {
  const SLUG_D_ARTICLE = 'morning-brief-2026-09-09-ia';

  const sitemapDArticle = (lastmod: string): string =>
    buildSitemapXml(sansPage(), BASE_URL, [{ locale: 'fr', slug: SLUG_D_ARTICLE, lastmod }]);

  it('emet une entree par locale active pour chaque page indexable', () => {
    const xml = buildSitemapXml(pageSeule('home', '/', true, 'Accueil'), BASE_URL);

    expect(xml).toContain('<?xml version=');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://asilidesign.fr/fr/</loc>');
    expect(xml).toContain('<loc>https://asilidesign.fr/en/</loc>');
  });

  it('ajoute les articles publies fournis par le catalogue dynamique', () => {
    const xml = sitemapDArticle('2026-09-09');

    expect(xml).toContain(`<loc>https://asilidesign.fr/fr/articles/${SLUG_D_ARTICLE}</loc>`);
    expect(xml).toContain('<lastmod>2026-09-09</lastmod>');
  });

  it('refuse un lastmod d article qui tenterait de sortir de sa balise', () => {
    const xml = sitemapDArticle(
      '2026-01-01</lastmod></url><url><loc>https://spam.example/</loc><lastmod>2026-01-01',
    );

    expect(xml).not.toContain('https://spam.example/');
    expect(xml).not.toContain('<lastmod>');
  });

  it('normalise en jour un lastmod d article servi en horodatage complet', () => {
    expect(sitemapDArticle('2026-09-09T14:32:07.000Z')).toContain('<lastmod>2026-09-09</lastmod>');
  });

  it('filtre les pages avec index:false', () => {
    expect(buildSitemapXml(pageSeule('login', '/login', false), BASE_URL)).not.toContain('/login');
  });

  it('emet lastmod, changefreq et priority quand fournis', () => {
    const metadata = buildSeoMetadata([
      buildPageSeoFr(
        'offer',
        '/offer',
        { title: 'Offre' },
        { lastmod: '2026-04-01', changefreq: 'weekly', priority: 0.8 },
      ),
    ]);

    const xml = buildSitemapXml(metadata, BASE_URL);

    expect(xml).toContain('<lastmod>2026-04-01</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');
  });

  it('omet lastmod/changefreq/priority quand absents', () => {
    const xml = buildSitemapXml(pageSeule('contact', '/contact', true, 'Contact'), BASE_URL);

    expect(xml).not.toContain('<lastmod>');
    expect(xml).not.toContain('<changefreq>');
    expect(xml).not.toContain('<priority>');
  });

  it('emet des alternates hreflang + x-default', () => {
    const xml = buildSitemapXml(pageSeule('home', '/', true, 'Accueil'), BASE_URL);

    expect(xml).toContain('hreflang="fr"');
    expect(xml).toContain('hreflang="en"');
    expect(xml).toContain('hreflang="x-default"');
  });

  it('traite home en mappant son path sur /', () => {
    const xml = buildSitemapXml(pageSeule('home', '/anything', true, 'Accueil'), BASE_URL);

    expect(xml).toContain('<loc>https://asilidesign.fr/fr/</loc>');
    expect(xml).not.toContain('/anything');
  });

  describe('lastmod d un cours servi par l API (H1)', () => {
    const cours = buildSeoMetadata([
      buildPageDuCoursB2('2026-09-19'),
      buildPageSeoFr('contact', '/contact', { title: 'Contact' }, { lastmod: '2026-09-01' }),
    ]);

    const lastmods = (xml: string): string[] =>
      Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g), ([, date]) => date);

    const lastmodsPublies = (metadata: SeoMetadataFile, publieLe?: string): string[] =>
      lastmods(
        buildSitemapXml(
          metadata,
          BASE_URL,
          [],
          publieLe === undefined ? [] : [{ chemin: CHEMIN_DU_COURS_B2, publieLe }],
        ),
      );

    it('garde le lastmod de seo-metadata.json sans API', () => {
      expect(lastmodsPublies(cours)).toEqual([
        '2026-09-19',
        '2026-09-19',
        '2026-09-01',
        '2026-09-01',
      ]);
    });

    it('publie la date de publication du cours quand elle est plus récente', () => {
      expect(lastmodsPublies(cours, '2026-10-02T08:15:00.000Z')).toEqual([
        '2026-10-02',
        '2026-10-02',
        '2026-09-01',
        '2026-09-01',
      ]);
    });

    it('garde le lastmod de seo-metadata.json quand la publication est plus ancienne', () => {
      expect(lastmodsPublies(cours, '2026-09-10T21:00:00.000Z')).toEqual([
        '2026-09-19',
        '2026-09-19',
        '2026-09-01',
        '2026-09-01',
      ]);
    });

    it('date une page sans lastmod par la seule publication', () => {
      const sansDate = buildSeoMetadata([buildPageDuCoursB2()]);

      expect(lastmodsPublies(sansDate, '2026-10-02T08:15:00.000Z')).toEqual([
        '2026-10-02',
        '2026-10-02',
      ]);
    });
  });

  it("retombe sur une locale unique vide quand aucune locale n'est definie", () => {
    const xml = buildSitemapXml(sansLocale('', buildPageSeoFr('page', '/page')), BASE_URL);

    expect(xml).toContain('<loc>https://asilidesign.fr/page</loc>');
  });
});

describe('buildLlmsTxt', () => {
  const baseGlobal = {
    localBusiness: {
      name: 'Asili Design',
      description: 'Studio web Tim Moyence',
      founder: { name: 'Tim Moyence' },
    },
    siteNavigation: {},
  } as never;

  const llmsDe = (...pages: PageSeo[]): string =>
    buildLlmsTxt(buildSeoMetadata(pages, { global: baseGlobal }), BASE_URL);

  it('groupe les pages par section (Services, A propos, Contact, Legal)', () => {
    const txt = llmsDe(
      buildPageSeoFr('offer', '/offer', { title: 'Offre', description: "Voir l'offre" }),
      buildPageSeoFr('presentation', '/presentation', {
        title: 'Presentation',
        description: 'A propos',
      }),
      buildPageSeoFr('weather', '/atelier/meteo', { title: 'Meteo', description: 'Ancienne app' }),
      buildPageSeoFr('contact', '/contact', { title: 'Contact', description: 'Nous ecrire' }),
      buildPageSeoFr('terms', '/terms', { title: 'CGU', description: 'Conditions' }),
    );

    expect(txt).toContain('# Asili Design — Tim Moyence');
    expect(txt).toContain('## Services');
    expect(txt).toContain('## A propos');
    expect(txt).not.toContain('## Applications metier');
    expect(txt).not.toContain('/atelier');
    expect(txt).toContain('## Contact');
    expect(txt).toContain('## Legal');
    expect(txt).toContain('[Offre](https://asilidesign.fr/fr/offer)');
  });

  it('liste la page des realisations (/projets) dans le fichier curate', () => {
    const txt = llmsDe(
      buildPageSeoFr('projets', '/projets', {
        title: 'Projets',
        description: 'Realisations web & IA',
      }),
    );

    expect(txt).toContain('[Projets](https://asilidesign.fr/fr/projets)');
  });

  it('inclut formations comme Services (hub + sous-formations)', () => {
    const txt = llmsDe(
      buildPageSeoFr('formations', '/formations', { title: 'Formations', description: 'Hub' }),
      buildPageSeoFr('formations-ia-solo', '/formations/ia-solopreneurs', {
        title: 'IA Solo',
        description: 'Formation IA',
      }),
    );

    expect(txt).toContain('## Services');
    expect(txt).toContain('[Formations]');
    expect(txt).toContain('[IA Solo]');
  });

  it('utilise homeTagline en quote si home est indexable', () => {
    const txt = llmsDe(
      buildPageSeoFr('home', '/', { title: 'Accueil', description: 'Mon tagline' }),
    );

    expect(txt).toContain('> Mon tagline');
  });

  const sansAccueil: readonly (readonly [string, SeoMetadataFile['global'], string])[] = [
    ['retombe sur siteDescription quand pas de home', baseGlobal, '> Studio web Tim Moyence'],
    [
      'utilise les fallbacks par defaut quand global.localBusiness est absent',
      undefined,
      '# Asili Design — Tim Moyence',
    ],
  ];

  for (const [cas, global, attendu] of sansAccueil) {
    it(cas, () => {
      const metadata = { ...pageSeule('offer', '/offer', true, 'Offre'), global };

      expect(buildLlmsTxt(metadata, BASE_URL)).toContain(attendu);
    });
  }

  it('utilise une description vide quand meta.description manquante', () => {
    const txt = llmsDe(buildPageSeoFr('offer', '/offer', { title: 'Offre', description: '' }));

    expect(txt).toContain('[Offre](https://asilidesign.fr/fr/offer)');
    expect(txt).not.toContain('[Offre](https://asilidesign.fr/fr/offer):');
  });

  it("retombe sur la premiere locale quand defaultLocale n'a pas de meta", () => {
    const txt = llmsDe(
      buildPageSeoFr(
        'offer',
        '/offer',
        {},
        { locales: { en: { title: 'Offer EN', description: 'Service' } } },
      ),
    );

    expect(txt).toContain('Offer EN');
  });

  it('ignore les pages avec index:false', () => {
    expect(
      llmsDe(buildPageSeoFr('login', '/login', { title: 'Login' }, { index: false })),
    ).not.toContain('Login');
  });
});

describe('buildLlmsFullTxt', () => {
  const baseGlobal = {
    localBusiness: { name: 'Asili Design', description: 'Studio web' },
    siteNavigation: {},
  } as never;

  const llmsFullDe = (...pages: PageSeo[]): string =>
    buildLlmsFullTxt(buildSeoMetadata(pages, { global: baseGlobal }), BASE_URL);

  const offre = (fr: Partial<PageSeo['locales'][string]>, overrides: Partial<PageSeo> = {}) =>
    buildPageSeoFr('offer', '/offer', { title: 'Offre', ...fr }, overrides);

  it('emet un header avec le nom du site', () => {
    expect(llmsFullDe()).toContain('# Asili Design — llms-full');
  });

  it('emet une section par page indexable avec URL et description', () => {
    const txt = llmsFullDe(offre({ description: "Voir l'offre detaillee" }));

    expect(txt).toContain('## Offre');
    expect(txt).toContain('- URL: https://asilidesign.fr/fr/offer');
    expect(txt).toContain("Voir l'offre detaillee");
  });

  it('inclut Last modified quand lastmod est defini', () => {
    expect(llmsFullDe(offre({}, { lastmod: '2026-05-01' }))).toContain(
      '- Last modified: 2026-05-01',
    );
  });

  it('inclut Keywords (max 10) quand definis', () => {
    expect(llmsFullDe(offre({ keywords: ['a', 'b', 'c'] }))).toContain('- Keywords: a, b, c');
  });

  it('omet keywords si liste vide', () => {
    expect(llmsFullDe(offre({ keywords: [] }))).not.toContain('- Keywords:');
  });

  it('traite home en mappant son path sur /', () => {
    const txt = llmsFullDe(buildPageSeoFr('home', '/whatever', { title: 'Accueil' }));

    expect(txt).toContain('- URL: https://asilidesign.fr/fr');
    expect(txt).not.toContain('/whatever');
  });

  it("ignore les pages dont le defaultLocale n'a pas de meta (ni fallback)", () => {
    expect(llmsFullDe(buildPageSeoFr('ghost', '/ghost', {}, { locales: {} }))).not.toContain(
      '/ghost',
    );
  });

  it('retombe sur Asili Design quand global.localBusiness est absent', () => {
    expect(buildLlmsFullTxt(sansPage({ global: undefined }), BASE_URL)).toContain(
      '# Asili Design — llms-full',
    );
  });
});
