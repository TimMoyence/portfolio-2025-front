import {
  doublesDeLecteur,
  reponseJson,
  type DoublesDeLecteur,
} from '../testing/lecteur-http-simule';
import { lireJsonSousDelai, messageDErreur } from './lecture-api';

const URL_API = 'https://asilidesign.fr/api/v1/portfolio25/articles';

describe('lireJsonSousDelai', () => {
  let doubles: DoublesDeLecteur;

  beforeEach(() => {
    doubles = doublesDeLecteur(Date.UTC(2026, 8, 25));
  });

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

    const erreur: unknown = await lireJsonSousDelai(doubles.dependances.fetch, URL_API, 2_000).then(
      () => undefined,
      (rejet: unknown) => rejet,
    );

    expect(erreur).toBeInstanceOf(TypeError);
    expect((erreur as Error).message).toBe('fetch failed');
  });
});

describe('messageDErreur', () => {
  it('lit le message d une Error et convertit toute autre valeur en texte', () => {
    expect(messageDErreur(new Error('delai depasse'))).toBe('delai depasse');
    expect(messageDErreur('refus')).toBe('refus');
  });
});
