import { METADONNEES_DU_SITE } from '../../app/core/seo/site-servi';
import { type BlocJsonLd, jsonLdDeLaPage } from '../../app/core/seo/json-ld';
import { nomCourt } from '../../app/core/seo/noms-courts';
import { estPageDAccueil, pagesIndexables } from '../../app/core/seo/pages/pages-seo';
import type { SeoMetadataFile, SeoPageEntry } from '../../app/core/seo/seo-metadata.model';
import { buildPageSeoFr, buildSeoMetadata } from '../../testing/factories/seo-metadata.factory';

const LANGUES = ['fr', 'en'] as const;

interface Etape {
  readonly position: number;
  readonly name: string;
  readonly item: string;
}

const pageA = (metadonnees: SeoMetadataFile, chemin: string): SeoPageEntry => {
  const page = metadonnees.pages.find(({ path }) => path === chemin);
  if (page === undefined) throw new Error(`aucune page à ${chemin}`);
  return page;
};

const etapesDuFil = (
  chemin: string,
  langue: string,
  metadonnees: SeoMetadataFile = METADONNEES_DU_SITE,
): readonly Etape[] | undefined => {
  const blocs: BlocJsonLd[] = jsonLdDeLaPage(metadonnees, langue, pageA(metadonnees, chemin));
  const fil = blocs.find((bloc) => bloc['@type'] === 'BreadcrumbList');
  return fil?.['itemListElement'] as readonly Etape[] | undefined;
};

const nomsDuFil = (chemin: string, langue: string): readonly string[] | undefined =>
  etapesDuFil(chemin, langue)?.map(({ name }) => name);

describe('SEO-2 · SEO-3 · le fil d Ariane se déduit du chemin, nommé par le nom court de chaque page', () => {
  it('SEO-3 · /fr/projets/atlanticbike : Accueil › Réalisations › AtlanticBike', () => {
    expect(nomsDuFil('/projets/atlanticbike', 'fr')).toEqual([
      'Accueil',
      'Réalisations',
      'AtlanticBike',
    ]);
  });

  it('SEO-3 · /en/projets/atlanticbike : Home › Work › AtlanticBike', () => {
    expect(nomsDuFil('/projets/atlanticbike', 'en')).toEqual(['Home', 'Work', 'AtlanticBike']);
  });

  it('SEO-3 · /fr/formations/ia-solopreneurs/toolkit : quatre étapes, de la racine canonique à la page', () => {
    expect(etapesDuFil('/formations/ia-solopreneurs/toolkit', 'fr')).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://asilidesign.fr/fr/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Formations',
        item: 'https://asilidesign.fr/fr/formations',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: "L'IA au service des solopreneurs",
        item: 'https://asilidesign.fr/fr/formations/ia-solopreneurs',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Toolkit IA',
        item: 'https://asilidesign.fr/fr/formations/ia-solopreneurs/toolkit',
      },
    ] as unknown as readonly Etape[]);
  });

  it('SEO-3 · /en/formations/ia-solopreneurs/toolkit : Home › Courses › AI for Solopreneurs › AI Toolkit', () => {
    expect(nomsDuFil('/formations/ia-solopreneurs/toolkit', 'en')).toEqual([
      'Home',
      'Courses',
      'AI for Solopreneurs',
      'AI Toolkit',
    ]);
  });

  it('SEO-3 · /fr/growth-audit et /fr/articles portent le nom court de la page, pas la tête de leur titre', () => {
    expect(nomsDuFil('/growth-audit', 'fr')).toEqual(['Accueil', 'Diagnostic gratuit']);
    expect(nomsDuFil('/articles', 'fr')).toEqual(['Accueil', 'Articles']);
  });

  it('SEO-3 · /en/presentation et /en/terms : Home › About, Home › Terms of use, sur des liens /en/', () => {
    expect(etapesDuFil('/presentation', 'en')?.map(({ name, item }) => [name, item])).toEqual([
      ['Home', 'https://asilidesign.fr/en/'],
      ['About', 'https://asilidesign.fr/en/presentation'],
    ]);
    expect(nomsDuFil('/terms', 'en')).toEqual(['Home', 'Terms of use']);
  });

  it('SEO-3 · l accueil ne sert aucun fil', () => {
    expect(nomsDuFil('/', 'fr')).toBeUndefined();
    expect(nomsDuFil('/', 'en')).toBeUndefined();
  });

  for (const langue of LANGUES) {
    it(`SEO-3 · chaque page indexable hors accueil sert une étape par préfixe de son chemin, la dernière à son nom court (${langue})`, () => {
      const ecarts = pagesIndexables(METADONNEES_DU_SITE)
        .filter((page) => !estPageDAccueil(page))
        .flatMap((page) => {
          const etapes = etapesDuFil(page.path, langue) ?? [];
          const attendues = page.path.split('/').filter(Boolean).length + 1;
          const derniere = etapes.at(-1);
          return etapes.length === attendues &&
            derniere?.name === nomCourt(page, langue) &&
            etapes.every(({ name }, i) => name !== '' && etapes[i].position === i + 1)
            ? []
            : [page.path];
        });

      expect(ecarts).toEqual([]);
    });
  }

  it('SEO-3 · aucune page ne saisit plus son fil à la main', () => {
    expect(
      METADONNEES_DU_SITE.pages.filter((page) => 'breadcrumb' in page).map(({ id }) => id),
    ).toEqual([]);
  });

  for (const [cas, parents] of [
    ['un préfixe sans page', []],
    ['un parent non indexable', [buildPageSeoFr('a', '/a', { title: 'A — x' }, { index: false })]],
  ] as const) {
    it(`SEO-3 · ${cas} : la page qui en descend est refusée`, () => {
      const metadonnees = buildSeoMetadata([
        buildPageSeoFr('home', '/'),
        ...parents,
        buildPageSeoFr('b', '/a/b', { title: 'B — x' }),
      ]);

      expect(() => etapesDuFil('/a/b', 'fr', metadonnees)).toThrowError(
        'préfixe sans page indexable : /a (de /a/b)',
      );
    });
  }

  it('SEO-7 · le fil déduit de /contact pointe sur la racine canonique et suit la langue', () => {
    const metadonnees = buildSeoMetadata([
      buildPageSeoFr('home', '/', { title: 'Asili Design — x', nom: 'Accueil' }),
      buildPageSeoFr('contact', '/contact', { title: 'Contact — x' }),
    ]);

    expect(etapesDuFil('/contact', 'fr', metadonnees)?.map(({ item }) => item)).toEqual([
      'https://asilidesign.fr/fr/',
      'https://asilidesign.fr/fr/contact',
    ]);
    expect(etapesDuFil('/contact', 'en', metadonnees)?.map(({ item }) => item)).toEqual([
      'https://asilidesign.fr/en/',
      'https://asilidesign.fr/en/contact',
    ]);
  });
});
