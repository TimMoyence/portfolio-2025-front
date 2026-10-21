import {
  doublesDeLecteur,
  reponseJson,
  type DoublesDeLecteur,
} from '../testing/lecteur-http-simule';
import { reponsesServiesPar } from '../testing/fixtures/reponses-servies';
import { avecUneCleHorsContrat } from '../testing/lecture-stricte';
import { CLE_INCONNUE } from '../testing/tolerances-des-schemas';
import { lecteurDArticlesDuSitemap, PAGES_MAX_PAR_LOCALE } from './article-sitemap';

const API = 'https://asilidesign.fr/api/v1/portfolio25';
const CINQ_MINUTES = 300_000;
const [ARTICLE_SERVI] = reponsesServiesPar('GET /api/articles/:slug') as readonly object[];

function article(slug: string): object {
  return { ...ARTICLE_SERVI, slug, updated_at: '2026-09-23T04:15:00.000Z' };
}

function page(slugs: readonly string[], nextCursor: string | null): Response {
  return reponseJson({ items: slugs.map(article), next_cursor: nextCursor });
}

describe('lecteurDArticlesDuSitemap', () => {
  let doubles: DoublesDeLecteur;

  function lecteur(apiBaseUrl: string | undefined) {
    return lecteurDArticlesDuSitemap({ apiBaseUrl, ...doubles.dependances });
  }

  function urlsAppelees(): string[] {
    return doubles.appels.calls.all().map((appel) => String(appel.args[0]));
  }

  beforeEach(() => {
    doubles = doublesDeLecteur(Date.UTC(2026, 8, 23));
  });

  it('ne publie rien, n appelle pas l API et le journalise sans URL, comme la lecture des cours', async () => {
    for (const absente of [undefined, '', '/']) {
      expect(await lecteur(absente)())
        .withContext(String(absente))
        .toEqual([]);
    }
    expect(doubles.appels).not.toHaveBeenCalled();
    expect(doubles.journal.warn).toHaveBeenCalledWith(
      jasmine.stringContaining('PORTFOLIO_ARTICLE_API_URL'),
    );
  });

  it('respecte le plafond de 24 de l API et suit le curseur jusqu au bout', async () => {
    doubles.appels.and.callFake(async (input) => {
      const url = new URL(String(input));
      const locale = url.searchParams.get('locale');
      if (locale === 'en') return page([], null);
      return url.searchParams.get('cursor') === 'MjQ='
        ? page(['b-c-d'], null)
        : page(['a-b-c'], 'MjQ=');
    });

    const entrees = await lecteur(`${API}/`)();

    expect(entrees.map((entree) => entree.slug)).toEqual(['a-b-c', 'b-c-d']);
    expect(urlsAppelees()).toHaveSize(3);
    expect(urlsAppelees()).toEqual(
      jasmine.arrayWithExactContents([
        `${API}/articles?locale=fr&limit=24`,
        `${API}/articles?locale=fr&limit=24&cursor=MjQ%3D`,
        `${API}/articles?locale=en&limit=24`,
      ]),
    );
    expect(urlsAppelees().some((url) => url.includes('limit=100'))).toBeFalse();
  });

  it('borne le nombre de pages lues par locale', async () => {
    doubles.appels.and.callFake(async () => page(['a-b-c'], 'suite'));

    await lecteur(API)();

    expect(doubles.appels.calls.count()).toBe(PAGES_MAX_PAR_LOCALE * 2);
    expect(doubles.journal.warn).toHaveBeenCalled();
  });

  it('garde les pages déjà lues quand une page suivante échoue', async () => {
    doubles.appels.and.callFake(async (input) => {
      const url = new URL(String(input));
      if (url.searchParams.get('locale') === 'en') return reponseJson({}, 503);
      return url.searchParams.has('cursor') ? reponseJson({}, 500) : page(['a-b-c'], 'suite');
    });

    const entrees = await lecteur(API)();

    expect(entrees).toEqual([{ locale: 'fr', slug: 'a-b-c', lastmod: '2026-09-23T04:15:00.000Z' }]);
    expect(doubles.journal.warn).toHaveBeenCalledTimes(2);
  });

  it('journalise le refus de l API et l API injoignable, chacun avec sa locale', async () => {
    doubles.appels.and.callFake(async (input) => {
      if (new URL(String(input)).searchParams.get('locale') === 'en') return reponseJson({}, 503);
      throw new TypeError('fetch failed');
    });

    expect(await lecteur(API)()).toEqual([]);
    expect(doubles.journal.warn.calls.allArgs()).toEqual(
      jasmine.arrayWithExactContents([
        ["[sitemap] articles en : l'API a répondu 503"],
        ['[sitemap] articles fr : API injoignable (fetch failed)'],
      ]),
    );
  });

  it('refuse une réponse hors contrat, la signale et arrête sa locale', async () => {
    doubles.appels.and.callFake(async (input) => {
      if (new URL(String(input)).searchParams.get('locale') === 'en') return page(['b-c-d'], null);
      return reponseJson({
        items: [avecUneCleHorsContrat(article('a-b-c'))],
        next_cursor: 'suite',
      });
    });

    const entrees = await lecteur(API)();

    expect(entrees.map((entree) => entree.slug)).toEqual(['b-c-d']);
    expect(doubles.appels).toHaveBeenCalledTimes(2);
    expect(doubles.journal.warn).toHaveBeenCalledOnceWith(
      `[sitemap] articles fr : réponse de l'API hors contrat (items.0.${CLE_INCONNUE})`,
    );
  });

  it('sert le cache cinq minutes', async () => {
    doubles.appels.and.callFake(async () => page(['a-b-c'], null));
    const lire = lecteur(API);

    await lire();
    doubles.horloge.maintenant += CINQ_MINUTES - 1;
    await lire();
    expect(doubles.appels.calls.count()).toBe(2);

    doubles.horloge.maintenant += 1;
    await lire();
    expect(doubles.appels.calls.count()).toBe(4);
  });
});
