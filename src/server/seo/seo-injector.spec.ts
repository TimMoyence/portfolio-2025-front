import { METADONNEES_DU_SITE } from '../../app/core/seo/site-servi';
import { cheminDuCoursEnSeance, COURS_EN_SEANCE } from '../../app/core/config/cours-en-seance';
import { buildPageSeoFr, buildSeoMetadata } from '../../testing/factories/seo-metadata.factory';
import { buildLlmsFullTxt, buildLlmsTxt, buildSitemapXml } from './seo-builders';
import { injectSeoHead } from './seo-injector';

const BASE_URL = 'https://asilidesign.fr';
const EMPTY_HTML = '<html><head><title>x</title></head><body></body></html>';

describe('injectSeoHead — flux RSS des articles', () => {
  const metadata = buildSeoMetadata([]);

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

describe('injectSeoHead — fiche article', () => {
  const FICHE = 'https://asilidesign.fr/fr/articles/morning-brief-2026-11-17';
  const RENDU_DE_LA_FICHE = [
    '<html><head><title>x</title>',
    `<link rel="canonical" href="${FICHE}">`,
    `<link rel="alternate" hreflang="fr" href="${FICHE}">`,
    '</head><body></body></html>',
  ].join('');
  const metadata = buildSeoMetadata([buildPageSeoFr('articles', '/articles')]);

  it("ART-IDX-1 · garde le canonical et le hreflang qu'une fiche article a posés", () => {
    const html = injectSeoHead(
      RENDU_DE_LA_FICHE,
      metadata,
      '/fr/articles/morning-brief-2026-11-17',
      BASE_URL,
    );

    expect(html.match(/rel="canonical"[^>]*>/g)).toEqual([`rel="canonical" href="${FICHE}">`]);
    expect(html).toContain(`<link rel="alternate" hreflang="fr" href="${FICHE}">`);
  });

  it('ART-IDX-1 · sert tels quels le canonical et le hreflang rendus par une page déclarée', () => {
    const html = injectSeoHead(RENDU_DE_LA_FICHE, metadata, '/fr/articles', BASE_URL);

    expect(html.match(/<link rel="(?:canonical|alternate" hreflang)[^>]*>/g)).toEqual([
      `<link rel="canonical" href="${FICHE}">`,
      `<link rel="alternate" hreflang="fr" href="${FICHE}">`,
    ]);
  });
});

for (const slug of COURS_EN_SEANCE) {
  describe(`seo-metadata.json — cours ${slug} servi par le serveur`, () => {
    const CHEMIN_B2 = `/${cheminDuCoursEnSeance(slug)}`;

    it('L1 · déclare la page du cours non indexable : servie en noindex, elle ne porte aucune canonique', () => {
      const page = METADONNEES_DU_SITE.pages.find((candidate) => candidate.path === CHEMIN_B2);

      expect(page?.id).toBe(`formations-${slug}`);
      expect(page?.index).toBeFalse();
    });

    it('L1 · ne publie pas la page du cours au sitemap statique ni à llms.txt', () => {
      const sitemap = buildSitemapXml(METADONNEES_DU_SITE, BASE_URL);
      const llms = buildLlmsTxt(METADONNEES_DU_SITE, BASE_URL);
      const llmsComplet = buildLlmsFullTxt(METADONNEES_DU_SITE, BASE_URL);

      expect([sitemap, llms, llmsComplet].filter((texte) => texte.includes(CHEMIN_B2))).toEqual([]);
    });

    it('L1 · n annonce aucun nombre d écrans, qui suit le contenu servi', () => {
      const page = METADONNEES_DU_SITE.pages.find((candidate) => candidate.path === CHEMIN_B2);
      const textes = JSON.stringify(page?.locales);

      expect(page).toBeDefined();
      expect(textes).not.toMatch(/\d (?:écrans|screens)/);
    });
  });
}
