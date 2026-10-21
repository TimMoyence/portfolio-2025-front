import { buildVisualCourse } from '../testing/factories/formation-catalogue.factory';
import { createJournalSpy, type JournalEspion } from '../testing/factories/journal.factory';
import { reponseJson } from '../testing/lecteur-http-simule';
import { lecteurDePublicationsDeCours } from './cours-publication';

const API = 'https://api.asilidesign.fr/api/v1/portfolio25';
const API_AVEC_BARRE = `${API}/`;
const SLUG = 'b2-01-traitement-information-chiffree';
const CINQ_MINUTES = 300_000;
const REPLI = 'repli sur le lastmod de seo-metadata.json';

function coursPublie(champs: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const cours: Record<string, unknown> = { ...buildVisualCourse({ ecrans: [] }) };
  delete cours['version'];
  delete cours['publieLe'];
  return { ...cours, ...champs };
}

describe('lecteurDePublicationsDeCours (H1)', () => {
  let appels: jasmine.Spy<typeof fetch>;
  let journal: JournalEspion;
  let maintenant: number;

  function lecteur(apiBaseUrl: string | undefined, slugs: readonly string[] = [SLUG]) {
    return lecteurDePublicationsDeCours({
      apiBaseUrl,
      slugs,
      fetch: appels,
      journal,
      maintenant: () => maintenant,
    });
  }

  beforeEach(() => {
    appels = jasmine.createSpy<typeof fetch>('fetch');
    journal = createJournalSpy();
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
    appels.and.resolveTo(reponseJson(coursPublie({ version: 3, publieLe: 'bientôt' })));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(
      jasmine.stringContaining("réponse de l'API hors contrat (publieLe)"),
    );
  });

  it('se replie quand la réponse porte un champ que le contrat du catalogue ne connaît pas', async () => {
    appels.and.resolveTo(
      reponseJson(coursPublie({ version: 3, publieLe: '2026-10-02T08:15:00.000Z', inconnu: 1 })),
    );

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(
      jasmine.stringContaining("réponse de l'API hors contrat (inconnu)"),
    );
  });

  it('se replie quand l API répond en erreur', async () => {
    appels.and.resolveTo(reponseJson({ message: 'indisponible' }, 503));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('503'));
    expect(journal.warn).toHaveBeenCalledOnceWith(
      `[sitemap] /formations/${SLUG} : GET /formations/catalogue/${SLUG} a répondu 503, ${REPLI}`,
    );
  });

  it('se replie quand l API ne répond pas', async () => {
    appels.and.rejectWith(new DOMException('délai dépassé', 'AbortError'));

    expect(await lecteur(API_AVEC_BARRE)()).toEqual([]);
    expect(journal.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('délai dépassé'));
    expect(journal.warn).toHaveBeenCalledOnceWith(
      `[sitemap] /formations/${SLUG} : API injoignable (délai dépassé), ${REPLI}`,
    );
  });

  it('encode le slug dans l URL du catalogue', async () => {
    appels.and.resolveTo(reponseJson({}));

    await lecteur(API, ['b2 01/x'])();

    expect(appels.calls.mostRecent().args[0]).toBe(`${API}/formations/catalogue/b2%2001%2Fx`);
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
