import { buildVisualCourse } from '../testing/factories/formation-catalogue.factory';
import { lecteurDePublicationsDeCours } from './cours-publication';

const API = 'https://api.asilidesign.fr/api/v1/portfolio25';
const API_AVEC_BARRE = `${API}/`;
const SLUG = 'b2-01-traitement-information-chiffree';
const CINQ_MINUTES = 300_000;

function reponseJson(corps: unknown, status = 200): Response {
  return new Response(JSON.stringify(corps), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function coursPublie(champs: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return { ...buildVisualCourse({ ecrans: [] }), ...champs };
}

describe('lecteurDePublicationsDeCours (H1)', () => {
  let appels: jasmine.Spy<typeof fetch>;
  let journal: jasmine.SpyObj<Pick<Console, 'warn'>>;
  let maintenant: number;

  function lecteur(apiBaseUrl: string | undefined) {
    return lecteurDePublicationsDeCours({
      apiBaseUrl,
      slugs: [SLUG],
      fetch: appels,
      journal,
      maintenant: () => maintenant,
    });
  }

  beforeEach(() => {
    appels = jasmine.createSpy<typeof fetch>('fetch');
    journal = jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
    maintenant = Date.UTC(2026, 9, 2);
  });

  it('lit publieLe sur GET /formations/catalogue/:slug', async () => {
    appels.and.resolveTo(
      reponseJson(coursPublie({ version: 3, publieLe: '2026-10-02T08:15:00.000Z' })),
    );

    const publications = await lecteur(API_AVEC_BARRE)();

    expect(publications).toEqual([
      { chemin: `/formations/${SLUG}`, publieLe: '2026-10-02T08:15:00.000Z' },
    ]);
    const [url, init] = appels.calls.mostRecent().args;
    expect(url).toBe(`${API}/formations/catalogue/${SLUG}`);
    expect(init?.signal).toEqual(jasmine.any(AbortSignal));
    expect(journal.warn).not.toHaveBeenCalled();
  });

  it('se replie sans publication et le journalise quand publieLe est absent', async () => {
    appels.and.resolveTo(reponseJson(coursPublie({})));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining(`${SLUG}`));
    expect(journal.warn.calls.mostRecent().args[0]).toContain('publieLe');
  });

  it('se replie quand publieLe n est pas une date', async () => {
    appels.and.resolveTo(reponseJson(coursPublie({ publieLe: 'bientôt' })));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledTimes(1);
  });

  it('se replie quand l API répond en erreur', async () => {
    appels.and.resolveTo(reponseJson({ message: 'indisponible' }, 503));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('503'));
  });

  it('se replie quand l API ne répond pas', async () => {
    appels.and.rejectWith(new DOMException('délai dépassé', 'AbortError'));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('délai dépassé'));
  });

  it('se replie sans appel réseau quand l URL de l API n est pas configurée', async () => {
    expect(await lecteur(undefined)()).toEqual([]);
    expect(appels).not.toHaveBeenCalled();
    expect(journal.warn).toHaveBeenCalledOnceWith(
      jasmine.stringContaining('PORTFOLIO_ARTICLE_API_URL'),
    );
  });

  it('garde la lecture en cache cinq minutes', async () => {
    appels.and.callFake(() =>
      Promise.resolve(reponseJson(coursPublie({ publieLe: '2026-10-02T08:15:00.000Z' }))),
    );
    const lire = lecteur(API_AVEC_BARRE);

    await lire();
    maintenant += CINQ_MINUTES - 1;
    await lire();
    expect(appels).toHaveBeenCalledTimes(1);

    maintenant += 1;
    await lire();
    expect(appels).toHaveBeenCalledTimes(2);
  });
});
