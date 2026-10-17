import {
  doublesDeLecteur,
  reponseJson,
  type DoublesDeLecteur,
} from '../testing/lecteur-http-simule';
import {
  garderEnCache,
  lireJsonJournalise,
  lireJsonSousDelai,
  messageDErreur,
} from './lecture-api';

const URL_API = 'https://asilidesign.fr/api/v1/portfolio25/articles';

describe('lecture JSON de l API', () => {
  let doubles: DoublesDeLecteur;

  beforeEach(() => {
    doubles = doublesDeLecteur(Date.UTC(2026, 8, 25));
  });

  describe('lireJsonSousDelai', () => {
    it('rend le corps JSON d une reponse reussie en demandant du JSON', async () => {
      doubles.appels.and.resolveTo(reponseJson({ items: [] }));

      expect(await lireJsonSousDelai(doubles.dependances.fetch, URL_API, 2_000)).toEqual({
        ok: true,
        corps: { items: [] },
      });
      const [url, options] = doubles.appels.calls.mostRecent().args;
      expect(url).toBe(URL_API);
      expect(options?.headers).toEqual({ accept: 'application/json' });
      expect(options?.signal).toBeInstanceOf(AbortSignal);
    });

    it('rend le statut d une reponse en echec sans lire son corps', async () => {
      doubles.appels.and.resolveTo(reponseJson({ erreur: 'indisponible' }, 503));

      expect(await lireJsonSousDelai(doubles.dependances.fetch, URL_API, 2_000)).toEqual({
        ok: false,
        statut: 503,
      });
    });

    it('interrompt la requete une fois le delai ecoule', () => {
      jasmine.clock().install();
      try {
        let signal: AbortSignal | undefined;
        doubles.appels.and.callFake((_url, options) => {
          signal = options?.signal ?? undefined;
          return new Promise<Response>(() => undefined);
        });

        void lireJsonSousDelai(doubles.dependances.fetch, URL_API, 2_000);
        jasmine.clock().tick(2_000);

        expect(signal?.aborted).toBeTrue();
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('propage l erreur reseau a l appelant', async () => {
      doubles.appels.and.rejectWith(new TypeError('fetch failed'));

      const erreur: unknown = await lireJsonSousDelai(
        doubles.dependances.fetch,
        URL_API,
        2_000,
      ).then(
        () => undefined,
        (rejet: unknown) => rejet,
      );

      expect(erreur).toBeInstanceOf(TypeError);
      expect((erreur as Error).message).toBe('fetch failed');
    });
  });

  describe('lireJsonJournalise', () => {
    const MESSAGES = {
      refus: (statut: number) => `refus ${statut}`,
      injoignable: (message: string) => `injoignable ${message}`,
    };

    it('rend le corps d une lecture reussie, meme nul, sans rien journaliser', async () => {
      doubles.appels.and.resolveTo(reponseJson(null));

      expect(await lireJsonJournalise(doubles.dependances, URL_API, MESSAGES)).toEqual({
        corps: null,
      });
      expect(doubles.journal.warn).not.toHaveBeenCalled();
    });

    it('journalise le statut d un refus et ne rend rien', async () => {
      doubles.appels.and.resolveTo(reponseJson({}, 503));

      expect(await lireJsonJournalise(doubles.dependances, URL_API, MESSAGES)).toBeNull();
      expect(doubles.journal.warn).toHaveBeenCalledOnceWith('refus 503');
    });

    it('journalise le message d une API injoignable et ne rend rien', async () => {
      doubles.appels.and.rejectWith(new TypeError('fetch failed'));

      expect(await lireJsonJournalise(doubles.dependances, URL_API, MESSAGES)).toBeNull();
      expect(doubles.journal.warn).toHaveBeenCalledOnceWith('injoignable fetch failed');
    });
  });
});

describe('garderEnCache', () => {
  it('relit la source seulement une fois les cinq minutes du cache ecoulees', async () => {
    let instant = 0;
    let lectures = 0;
    const lire = garderEnCache(
      () => instant,
      async () => {
        lectures += 1;
        return lectures;
      },
    );

    expect(await lire()).toBe(1);
    instant = 299_999;
    expect(await lire()).toBe(1);
    instant = 300_000;
    expect(await lire()).toBe(2);
  });
});

describe('messageDErreur', () => {
  it('lit le message d une Error et convertit toute autre valeur en texte', () => {
    expect(messageDErreur(new Error('delai depasse'))).toBe('delai depasse');
    expect(messageDErreur('refus')).toBe('refus');
  });

  it('lit le message d une sous-classe d Error', () => {
    expect(messageDErreur(new TypeError('connect ECONNREFUSED 3010'))).toBe(
      'connect ECONNREFUSED 3010',
    );
  });

  it('ecrit en texte un nombre, undefined et un objet qui imite une Error', () => {
    expect(messageDErreur(42)).toBe('42');
    expect(messageDErreur(undefined)).toBe('undefined');
    expect(messageDErreur({ message: 'pas une Error' })).toBe('[object Object]');
  });
});
