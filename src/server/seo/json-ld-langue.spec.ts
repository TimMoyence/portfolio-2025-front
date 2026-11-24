import { METADONNEES_DU_SITE } from '../../app/core/seo/site-servi';
import { type BlocJsonLd, jsonLdDeLaPage } from '../../app/core/seo/json-ld';
import { pagesIndexables } from '../../app/core/seo/pages/pages-seo';
import type { SeoPageEntry } from '../../app/core/seo/seo-metadata.model';
import { buildPageSeoFr, buildSeoMetadata } from '../../testing/factories/seo-metadata.factory';

const CLES_TECHNIQUES = new Set([
  '@context',
  '@type',
  '@id',
  'url',
  'item',
  'image',
  'logo',
  'sameAs',
  'inLanguage',
  'knowsLanguage',
]);

const blocDuSite = (langue: string, type: string): BlocJsonLd | undefined =>
  jsonLdDeLaPage(METADONNEES_DU_SITE, langue).find((bloc) => bloc['@type'] === type);

const CLES_NEUTRES = new Set([...CLES_TECHNIQUES, 'streetAddress', 'legalName', 'hasMap']);

const ACCENT_FRANCAIS = /[àâçéèêëîïôùûüœ]/i;

const chaines = (valeur: unknown, ignorees: ReadonlySet<string> = CLES_TECHNIQUES): string[] => {
  if (typeof valeur === 'string') return [valeur];
  if (Array.isArray(valeur)) return valeur.flatMap((sous) => chaines(sous, ignorees));
  if (valeur === null || typeof valeur !== 'object') return [];
  return Object.entries(valeur).flatMap(([cle, sous]) =>
    ignorees.has(cle) ? [] : chaines(sous, ignorees),
  );
};

const accentueesServies = (langue: string): string[] =>
  pagesIndexables(METADONNEES_DU_SITE).flatMap((page) =>
    chaines(jsonLdDeLaPage(METADONNEES_DU_SITE, langue, page), CLES_NEUTRES)
      .filter((chaine) => ACCENT_FRANCAIS.test(chaine))
      .map((chaine) => `${page.path} : ${chaine}`),
  );

const champsDeLaLangue = (langue: string): Set<string> =>
  new Set([
    ...METADONNEES_DU_SITE.pages.flatMap((page: SeoPageEntry) => {
      const meta = page.locales[langue];
      return meta ? [meta.title, ...(meta.nom ? [meta.nom] : []), ...chaines(meta.jsonLd)] : [];
    }),
    ...chaines(METADONNEES_DU_SITE.global?.textes?.[langue]),
  ]);

describe('SEO-1 · une page /en/ sert tout son JSON-LD en anglais', () => {
  it('SEO-1 · /en/ : la personne est « Website creator & trainer », son profil est /en/presentation', () => {
    expect(blocDuSite('en', 'Person')).toEqual(
      jasmine.objectContaining({
        jobTitle: 'Website creator & trainer',
        url: 'https://asilidesign.fr/en/presentation',
      }),
    );
  });

  it('SEO-1 · /fr/ : la personne garde son titre français et son profil /fr/presentation', () => {
    expect(blocDuSite('fr', 'Person')).toEqual(
      jasmine.objectContaining({
        jobTitle: 'Créateur de sites web & formateur',
        url: 'https://asilidesign.fr/fr/presentation',
      }),
    );
  });

  it('SEO-1 · l entreprise se décrit dans la langue de la page et garde l URL du site', () => {
    const fr = blocDuSite('fr', 'LocalBusiness');
    const en = blocDuSite('en', 'LocalBusiness');

    expect(en?.['url']).toBe('https://asilidesign.fr');
    expect(en?.['description']).toEqual(
      jasmine.stringMatching(/^Websites & mobile apps in Bordeaux/),
    );
    expect(fr?.['description']).toEqual(
      jasmine.stringMatching(/^Création de sites web & apps mobiles à Bordeaux/),
    );
  });

  it('SEO-1 · la personne et l entreprise décrivent les mêmes faits dans les deux langues', () => {
    for (const type of ['Person', 'LocalBusiness']) {
      const cles = (langue: string): string[] =>
        Object.keys(blocDuSite(langue, type) ?? {}).sort((a, b) => a.localeCompare(b));
      const [fr, en] = [cles('fr'), cles('en')];

      expect(en).withContext(type).toEqual(fr);
    }
  });

  it('SEO-1 · aucune page /en/ ne sert une chaîne propre au français', () => {
    const anglais = champsDeLaLangue('en');
    const propresAuFrancais = new Set([...champsDeLaLangue('fr')].filter((c) => !anglais.has(c)));
    const servies = pagesIndexables(METADONNEES_DU_SITE).flatMap((page) =>
      chaines(jsonLdDeLaPage(METADONNEES_DU_SITE, 'en', page))
        .filter((chaine) => propresAuFrancais.has(chaine))
        .map((chaine) => `${page.path} : ${chaine}`),
    );

    expect(propresAuFrancais.size).toBeGreaterThan(0);
    expect(servies).toEqual([]);
  });

  it('SEO-1 · aucune page /en/ ne sert un mot accentué à la française, hors adresse et raison sociale', () => {
    expect(accentueesServies('fr').length).toBeGreaterThan(0);
    expect(accentueesServies('en')).toEqual([]);
  });

  it('SEO-1 · /en/projets/gestion-de-chais ne sert pas « Gestion de chais »', () => {
    const page = METADONNEES_DU_SITE.pages.find(({ path }) => path === '/projets/gestion-de-chais');

    expect(page).toBeDefined();
    expect(
      chaines(jsonLdDeLaPage(METADONNEES_DU_SITE, 'en', page)).filter((chaine) =>
        chaine.includes('Gestion de chais'),
      ),
    ).toEqual([]);
  });

  it('SEO-1 · aucun lien /fr/ dans le JSON-LD d une page /en/', () => {
    const liens = (valeur: unknown): string[] => {
      if (typeof valeur === 'string') return valeur.includes('/fr/') ? [valeur] : [];
      if (Array.isArray(valeur)) return valeur.flatMap(liens);
      if (valeur === null || typeof valeur !== 'object') return [];
      return Object.values(valeur).flatMap(liens);
    };

    expect(
      pagesIndexables(METADONNEES_DU_SITE).flatMap((page) =>
        liens(jsonLdDeLaPage(METADONNEES_DU_SITE, 'en', page)),
      ),
    ).toEqual([]);
  });

  it('SEO-1 · un texte écrit dans une seule langue est refusé', () => {
    const metadonnees = buildSeoMetadata([buildPageSeoFr('home', '/')], {
      global: {
        localBusiness: {},
        navigation: [],
        person: { '@type': 'Person' },
        textes: {
          fr: { person: { jobTitle: 'Formateur', knowsAbout: ['Référencement'] } },
          en: { person: { jobTitle: 'Trainer' } },
        },
      },
    });

    expect(() => jsonLdDeLaPage(metadonnees, 'fr')).toThrowError(
      'texte localisé sans traduction : person.knowsAbout (en)',
    );
  });
});
