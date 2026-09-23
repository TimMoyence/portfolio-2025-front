import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import metadataDuSite from '../assets/seo/seo-metadata.json';
import { buildVisualCourse } from '../testing/factories/formation-catalogue.factory';
import {
  buildRequeteExpress,
  createReponseExpressStub,
} from '../testing/factories/express.factory';
import { CHEMIN_DU_COURS_B2, SLUG_DU_COURS_B2 } from '../testing/factories/seo-metadata.factory';
import { lastmodDeLaPage } from '../testing/sitemap-xml';
import { COURS_SERVIS_PAR_L_API, lecteurDePublicationsDeCours } from './cours-publication';
import { routeDuSitemap } from './sitemap-route';
import { buildBaseUrlFromRequest } from './url-utils';

const API = 'https://api.asilidesign.fr/api/v1/portfolio25';
const DELAI_DU_LECTEUR_MS = 2_000;

const metadata = metadataDuSite as unknown as SeoMetadataFile;
const metadataAvecLeCoursIndexe: SeoMetadataFile = {
  ...metadata,
  pages: metadata.pages.map((page) =>
    page.path === CHEMIN_DU_COURS_B2 ? { ...page, index: true } : page,
  ),
};

function lastmodDuCoursDansLeFichier(): string {
  const page = metadata.pages.find(({ path }) => path === CHEMIN_DU_COURS_B2);
  if (page?.lastmod === undefined) {
    throw new Error(`Aucun lastmod pour ${CHEMIN_DU_COURS_B2} dans seo-metadata.json`);
  }
  return page.lastmod;
}

function reponseDuCatalogue(publieLe?: string): Response {
  const cours = { ...buildVisualCourse({ ecrans: [] }), version: 3, publieLe };
  return new Response(JSON.stringify(cours), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

async function sitemap(appels: typeof fetch, journal: Pick<Console, 'warn'>): Promise<string> {
  const reponse = createReponseExpressStub();
  await routeDuSitemap({
    lireMetadata: () => metadataAvecLeCoursIndexe,
    lireArticles: () => Promise.resolve([]),
    lirePublicationsDeCours: lecteurDePublicationsDeCours({
      apiBaseUrl: API,
      slugs: COURS_SERVIS_PAR_L_API,
      fetch: appels,
      journal,
    }),
    baseUrlDe: buildBaseUrlFromRequest,
  })(buildRequeteExpress(), reponse.express);
  return reponse.corps ?? '';
}

function lastmodDuCours(xml: string): string {
  const lastmod = lastmodDeLaPage(xml, CHEMIN_DU_COURS_B2);
  if (lastmod === null) {
    throw new Error(`Le sitemap ne contient pas ${CHEMIN_DU_COURS_B2}`);
  }
  return lastmod;
}

describe('sitemap du cours servi par l API (H1, intégration)', () => {
  let journal: jasmine.SpyObj<Pick<Console, 'warn'>>;

  beforeEach(() => {
    journal = jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
  });

  it('date la page du cours par publieLe quand l API la publie après le dernier commit front', async () => {
    const appels = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(reponseDuCatalogue('2026-12-24T07:30:00.000Z'));

    const xml = await sitemap(appels, journal);

    expect(appels).toHaveBeenCalledOnceWith(
      `${API}/formations/catalogue/${SLUG_DU_COURS_B2}`,
      jasmine.anything(),
    );
    expect(lastmodDuCours(xml)).toBe('2026-12-24');
    expect(journal.warn).not.toHaveBeenCalled();
  });

  it('garde le lastmod du fichier SEO quand la publication lui est antérieure', async () => {
    const appels = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(reponseDuCatalogue('2020-01-01T00:00:00.000Z'));

    expect(lastmodDuCours(await sitemap(appels, journal))).toBe(lastmodDuCoursDansLeFichier());
  });

  it('garde le lastmod du fichier SEO quand le back ne renvoie pas encore publieLe', async () => {
    const appels = jasmine.createSpy<typeof fetch>('fetch').and.resolveTo(reponseDuCatalogue());

    expect(lastmodDuCours(await sitemap(appels, journal))).toBe(lastmodDuCoursDansLeFichier());
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('publieLe'));
  });

  it('abandonne au bout de deux secondes quand l API ne répond pas, sans casser le sitemap', async () => {
    const appels = jasmine.createSpy<typeof fetch>('fetch').and.callFake(
      (_url, init) =>
        new Promise<Response>((_, rejeter) => {
          init?.signal?.addEventListener('abort', () =>
            rejeter(new DOMException('The operation was aborted.', 'AbortError')),
          );
        }),
    );
    const depart = Date.now();

    const xml = await sitemap(appels, journal);

    expect(Date.now() - depart).toBeGreaterThanOrEqual(DELAI_DU_LECTEUR_MS - 50);
    expect(lastmodDuCours(xml)).toBe(lastmodDuCoursDansLeFichier());
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('injoignable'));
  });
});
