import { lecteurDArticlesDuSitemap, PAGES_MAX_PAR_LOCALE } from './article-sitemap';

const API = 'https://asilidesign.fr/api/v1/portfolio25';
const CINQ_MINUTES = 300_000;

function reponseJson(corps: unknown, status = 200): Response {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function page(slugs: readonly string[], nextCursor: string | null): Response {
  return reponseJson({
    items: slugs.map((slug) => ({ slug, updated_at: '2026-09-23T04:15:00.000Z' })),
    next_cursor: nextCursor,
  });
}

describe('lecteurDArticlesDuSitemap', () => {
  let appels: jasmine.Spy<typeof fetch>;
  let journal: jasmine.SpyObj<Pick<Console, 'warn'>>;
  let maintenant: number;

  function lecteur(apiBaseUrl: string | undefined) {
    return lecteurDArticlesDuSitemap({
      apiBaseUrl,
      fetch: appels,
      journal,
      maintenant: () => maintenant,
    });
  }

  function urlsAppelees(): string[] {
    return appels.calls.all().map((appel) => String(appel.args[0]));
  }

  beforeEach(() => {
    appels = jasmine.createSpy<typeof fetch>('fetch');
    journal = jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
    maintenant = Date.UTC(2026, 8, 23);
  });

  it('ne publie rien et n appelle pas l API sans URL', async () => {
    expect(await lecteur(undefined)()).toEqual([]);
    expect(appels).not.toHaveBeenCalled();
  });

  it('respecte le plafond de 24 de l API et suit le curseur jusqu au bout', async () => {
    appels.and.callFake(async (input) => {
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
    appels.and.callFake(async () => page(['a-b-c'], 'suite'));

    await lecteur(API)();

    expect(appels.calls.count()).toBe(PAGES_MAX_PAR_LOCALE * 2);
    expect(journal.warn).toHaveBeenCalled();
  });

  it('garde les pages déjà lues quand une page suivante échoue', async () => {
    appels.and.callFake(async (input) => {
      const url = new URL(String(input));
      if (url.searchParams.get('locale') === 'en') return reponseJson({}, 503);
      return url.searchParams.has('cursor') ? reponseJson({}, 500) : page(['a-b-c'], 'suite');
    });

    const entrees = await lecteur(API)();

    expect(entrees).toEqual([{ locale: 'fr', slug: 'a-b-c', lastmod: '2026-09-23T04:15:00.000Z' }]);
    expect(journal.warn).toHaveBeenCalledTimes(2);
  });

  it('ignore les éléments mal formés', async () => {
    appels.and.callFake(async () =>
      reponseJson({ items: [{ slug: 42 }, { slug: 'ok-ok-ok' }, null], next_cursor: null }),
    );

    const entrees = await lecteur(API)();

    expect(entrees.map((entree) => entree.slug)).toEqual(['ok-ok-ok', 'ok-ok-ok']);
    expect(entrees[0].lastmod).toBeUndefined();
  });

  it('sert le cache cinq minutes', async () => {
    appels.and.callFake(async () => page(['a-b-c'], null));
    const lire = lecteur(API);

    await lire();
    maintenant += CINQ_MINUTES - 1;
    await lire();
    expect(appels.calls.count()).toBe(2);

    maintenant += 1;
    await lire();
    expect(appels.calls.count()).toBe(4);
  });
});
