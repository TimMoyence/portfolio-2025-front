import {
  buildRequeteExpress,
  createReponseExpressStub,
  type ReponseEnregistree,
} from '../testing/factories/express.factory';
import {
  buildPageDuCoursB2,
  buildSeoMetadata,
  CHEMIN_DU_COURS_B2,
} from '../testing/factories/seo-metadata.factory';
import type { PublicationDeCours } from './cours-publication';
import { lastmodsDuSitemap } from '../testing/sitemap-xml';
import { routeDuSitemap, type DependancesDuSitemap } from './sitemap-route';
import { buildBaseUrlFromRequest } from './url-utils';

const LASTMOD_DU_FICHIER = '2026-09-19';

function dependances(overrides: Partial<DependancesDuSitemap> = {}): DependancesDuSitemap {
  return {
    lireMetadata: () => buildSeoMetadata([buildPageDuCoursB2(LASTMOD_DU_FICHIER)]),
    lireArticles: () => Promise.resolve([]),
    lirePublicationsDeCours: () => Promise.resolve([]),
    baseUrlDe: buildBaseUrlFromRequest,
    ...overrides,
  };
}

async function appeler(overrides: Partial<DependancesDuSitemap> = {}): Promise<ReponseEnregistree> {
  const reponse = createReponseExpressStub();
  await routeDuSitemap(dependances(overrides))(buildRequeteExpress(), reponse.express);
  return reponse;
}

const lastmods = lastmodsDuSitemap;

describe('routeDuSitemap (H1, comportement de la route)', () => {
  it('répond 404 en texte quand seo-metadata.json est introuvable', async () => {
    const reponse = await appeler({ lireMetadata: () => null });

    expect(reponse.statut).toBe(404);
    expect(reponse.type).toBe('text/plain');
    expect(reponse.corps).toBe('Sitemap not available');
  });

  it('sert un XML mis en cache un jour, daté par le fichier SEO sans publication', async () => {
    const reponse = await appeler();

    expect(reponse.entetes['Content-Type']).toBe('application/xml');
    expect(reponse.entetes['Cache-Control']).toBe('public, max-age=86400, s-maxage=86400');
    expect(reponse.corps).toContain(`<loc>https://asilidesign.fr/fr${CHEMIN_DU_COURS_B2}</loc>`);
    expect(lastmods(reponse.corps)).toEqual([LASTMOD_DU_FICHIER, LASTMOD_DU_FICHIER]);
  });

  it('publie la date de publication du cours quand elle est plus récente', async () => {
    const publications: readonly PublicationDeCours[] = [
      { chemin: CHEMIN_DU_COURS_B2, publieLe: '2026-10-02T08:15:00.000Z' },
    ];

    const reponse = await appeler({ lirePublicationsDeCours: () => Promise.resolve(publications) });

    expect(lastmods(reponse.corps)).toEqual(['2026-10-02', '2026-10-02']);
  });

  it('interroge les articles et les publications en parallèle et attend les deux', async () => {
    const ordre: string[] = [];
    const differe = <T>(valeur: T, nom: string, delai: number): Promise<T> =>
      new Promise((resoudre) =>
        setTimeout(() => {
          ordre.push(nom);
          resoudre(valeur);
        }, delai),
      );

    const reponse = await appeler({
      lireArticles: () =>
        differe(
          [{ locale: 'fr', slug: 'morning-brief-2026-09-09-ia', lastmod: '2026-09-09' }],
          'articles',
          20,
        ),
      lirePublicationsDeCours: () =>
        differe([{ chemin: CHEMIN_DU_COURS_B2, publieLe: '2026-10-02T08:15:00.000Z' }], 'cours', 5),
    });

    expect(ordre).toEqual(['cours', 'articles']);
    expect(reponse.corps).toContain('/fr/articles/morning-brief-2026-09-09-ia');
    expect(lastmods(reponse.corps)).toContain('2026-10-02');
  });
});
