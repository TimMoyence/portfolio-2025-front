import type { ResultatsSeance } from '../../content/types';
import { buildResumeBareme } from '../../../testing/factories/formations.factory';
import type { FluxFactice } from '../../../testing/flux-sse';
import { bloc, creerOuverture, laisserPasserLeFlux, vider } from '../../../testing/flux-sse';
import {
  createSync,
  type EtatSession,
  type RaisonDeFin,
  type ResultatsDuFlux,
  type StatutFlux,
  type Sync,
} from './sync';

const BASE = 'https://api.test';
const SESSION = 's1';
const JETON = 'jeton-participant';
const ENTETE_JETON = 'x-participant-token';

const ETAT_ANCIEN = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 2,
  intervalleLibre: null,
  participants: 24,
} satisfies Omit<EtatSession, 'revision' | 'pilotage'>;

const ETAT: EtatSession = {
  ...ETAT_ANCIEN,
  revision: 7,
  pilotage: {
    'B2-01-A3-01-VOTE-HAUSSE-BAISSE': { phase: 'revote' },
    'B2-01-A5-08-RECOMMANDATION': { revele: true },
    'B2-01-A3-06-INDICE-ET-TAUX-MOYEN': { etayage: 2 },
  },
};

const QUESTION_ANCIENNE = {
  questionId: 'Q-2',
  total: 8,
  correctes: 5,
  neSaitPas: 0,
  confusions: [],
};

const JETON_PRESENTATEUR = 'jwt-presentateur';

const RESULTATS: ResultatsSeance = {
  participants: 12,
  questions: [
    {
      questionId: 'Q-1',
      ecranId: 'E-1',
      type: 'vote',
      noteCompte: true,
      total: 10,
      correctes: 6,
      neSaitPas: 1,
      confusions: [{ id: 'c1', libelle: 'Confusion frequente', nombre: 3 }],
      parOption: { a: 6, b: 3, __je_ne_sais_pas__: 1 },
      scoreMoyen: null,
      parCle: null,
    },
  ],
};

const EN_DIRECT_ABSENT = { jalons: {}, enigmes: [], bareme: null };

describe('sync', () => {
  let sync: Sync;
  let flux: FluxFactice[];

  function monter(jeton = JETON): Sync {
    sync = createSync({
      baseUrl: BASE,
      sessionId: SESSION,
      jeton,
      ouvrirFlux: creerOuverture(flux),
    });
    return sync;
  }

  async function attendreJusqua(condition: () => boolean): Promise<void> {
    for (let tour = 0; tour < 40 && !condition(); tour += 1) {
      await new Promise((resoudre) => setTimeout(resoudre, 0));
    }
    await vider();
  }

  async function collecter(morceaux: readonly string[], attendus = 1): Promise<EtatSession[]> {
    monter();
    const recus: EtatSession[] = [];
    sync.onState((etat) => recus.push(etat));
    sync.ouvrir();
    await vider();
    if (flux.length === 0) {
      throw new Error('aucun flux ouvert : le double d ouverture n a pas ete appele');
    }
    for (const morceau of morceaux) {
      await flux[0].envoyer(morceau);
    }
    await attendreJusqua(() => recus.length >= attendus);
    return recus;
  }

  beforeEach(() => {
    flux = [];
  });

  afterEach(() => {
    sync.close();
  });

  it('pose l en tete du jeton de participant sur l ouverture du flux', async () => {
    monter();
    sync.ouvrir();
    await vider();
    expect(flux.length).toBe(1);
    expect(flux[0].entetes[ENTETE_JETON]).toBe(JETON);
    expect(flux[0].url).toBe('https://api.test/sessions/s1/stream');
  });

  it('n envoie aucun en tete de jeton quand aucun jeton n est fourni', async () => {
    monter('');
    sync.ouvrir();
    await vider();
    expect(flux[0].entetes[ENTETE_JETON]).toBeUndefined();
  });

  it('ouvre le flux du presentateur sur le chemin dedie avec l en tete authorization', async () => {
    sync = createSync({
      baseUrl: BASE,
      sessionId: SESSION,
      chemin: 'presenter-stream',
      entetes: () => ({ authorization: `Bearer ${JETON_PRESENTATEUR}` }),
      ouvrirFlux: creerOuverture(flux),
    });
    sync.ouvrir();
    await vider();
    expect(flux.length).toBe(1);
    expect(flux[0].url).toBe('https://api.test/sessions/s1/presenter-stream');
    expect(flux[0].entetes['authorization']).toBe(`Bearer ${JETON_PRESENTATEUR}`);
  });

  it('relit les en tetes personnalisees a chaque ouverture', async () => {
    let compteur = 0;
    sync = createSync({
      baseUrl: BASE,
      sessionId: SESSION,
      ouvrirFlux: creerOuverture(flux),
      entetes: () => {
        compteur += 1;
        return { 'x-compteur': String(compteur) };
      },
    });
    sync.ouvrir();
    await vider();
    sync.ouvrir();
    await vider();
    expect(flux.length).toBe(2);
    expect(flux[0].entetes['x-compteur']).toBe('1');
    expect(flux[1].entetes['x-compteur']).toBe('2');
  });

  it('ouvrir sans identite ouvre le flux sur le chemin par defaut', async () => {
    sync = createSync({
      baseUrl: BASE,
      sessionId: SESSION,
      ouvrirFlux: creerOuverture(flux),
    });
    sync.ouvrir();
    await vider();
    expect(flux.length).toBe(1);
    expect(flux[0].url).toBe('https://api.test/sessions/s1/stream');
  });

  it('ignore un battement de coeur sans notifier les abonnes', async () => {
    const recus = await collecter([bloc('heartbeat', { ts: '2026-09-11T08:00:00.000Z' })], 0);
    expect(recus).toEqual([]);
  });

  it('le desabonnement onState arrete les notifications futures', async () => {
    monter();
    const recus: EtatSession[] = [];
    const arreter = sync.onState((etat) => recus.push(etat));
    sync.ouvrir();
    arreter();
    await flux[0].envoyer(bloc('etat', ETAT));
    expect(recus).toEqual([]);
  });

  it('reconnecte apres une coupure avec une temporisation doublee plafonnee a 30s', async () => {
    jasmine.clock().install();
    try {
      const tentatives = { nombre: 0 };
      sync = createSync({
        baseUrl: BASE,
        sessionId: SESSION,
        ouvrirFlux: () => {
          tentatives.nombre += 1;
          return Promise.reject(new Error('reseau'));
        },
      });
      sync.ouvrir();
      await vider();
      expect(tentatives.nombre).toBe(1);
      for (const [indice, attendu] of [1000, 2000, 4000, 8000, 16000, 30000, 30000].entries()) {
        jasmine.clock().tick(attendu - 1);
        await vider();
        expect(tentatives.nombre).toBe(indice + 1);
        jasmine.clock().tick(1);
        await vider();
        expect(tentatives.nombre).toBe(indice + 2);
      }
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('close annule la reconnexion en attente', async () => {
    jasmine.clock().install();
    try {
      monter();
      sync.ouvrir();
      await flux[0].couper();
      expect(flux.length).toBe(1);
      sync.close();
      jasmine.clock().tick(60000);
      await vider();
      expect(flux.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('fin arrete toute relance ulterieure', async () => {
    jasmine.clock().install();
    try {
      monter();
      sync.ouvrir();
      await flux[0].envoyer(bloc('fin', { motif: 'seance terminee' }));
      await flux[0].couper();
      jasmine.clock().tick(60000);
      await vider();
      expect(flux.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ne livre plus aucun etat servi dans le meme morceau que la fin', async () => {
    monter();
    const recus: EtatSession[] = [];
    const raisons: (RaisonDeFin | null)[] = [];
    sync.onState((etat) => recus.push(etat));
    sync.onFin((raison) => raisons.push(raison));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(
      bloc('fin', { raison: 'cloturee' }) + bloc('etat', { ...ETAT, ecranCourant: 51 }),
    );
    await attendreJusqua(() => raisons.length > 0);

    expect(raisons).toEqual(['cloturee']);
    expect(recus).toEqual([]);
  });

  it('annonce la fin a ses ecouteurs avec sa raison, ou null si elle est inconnue', async () => {
    monter();
    const raisons: (RaisonDeFin | null)[] = [];
    sync.onFin((raison) => raisons.push(raison));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(bloc('fin', { raison: 'cloturee' }));
    await attendreJusqua(() => raisons.length > 0);

    expect(raisons).toEqual(['cloturee']);

    monter();
    const inconnues: (RaisonDeFin | null)[] = [];
    sync.onFin((raison) => inconnues.push(raison));
    sync.ouvrir();
    await vider();
    await flux[1].envoyer(bloc('fin', { raison: 'effondrement' }));
    await attendreJusqua(() => inconnues.length > 0);

    expect(inconnues).toEqual([null]);
  });

  it('close interrompt la requete fetch ouverte par defaut', () => {
    const capture: { init: RequestInit | undefined } = { init: undefined };
    const original = globalThis.fetch;
    globalThis.fetch = ((_url: RequestInfo | URL, init?: RequestInit) => {
      capture.init = init;
      return new Promise<Response>(() => undefined);
    }) as typeof fetch;
    try {
      sync = createSync({ baseUrl: BASE, sessionId: SESSION, jeton: JETON });
      sync.ouvrir();
      expect(new Headers(capture.init?.headers).get(ENTETE_JETON)).toBe(JETON);
      sync.close();
      expect(capture.init?.signal?.aborted).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('se degrade sans lever quand fetch est absent du contexte', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
    Object.defineProperty(globalThis, 'fetch', { value: undefined, configurable: true });
    try {
      expect(() => {
        sync = createSync({ baseUrl: BASE, sessionId: SESSION });
        sync.ouvrir();
        sync.onState(() => undefined);
        sync.close();
      }).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(globalThis, 'fetch', original);
      } else {
        delete (globalThis as { fetch?: unknown }).fetch;
      }
    }
  });

  it('notifie les ecouteurs de resultats sur un evenement resultats valide', async () => {
    monter();
    const recus: ResultatsSeance[] = [];
    sync.onResultats((resultats) => recus.push(resultats));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(bloc('resultats', RESULTATS));
    await attendreJusqua(() => recus.length > 0);
    expect(recus).toEqual([{ ...RESULTATS, ...EN_DIRECT_ABSENT }]);
  });

  it('ignore un evenement resultats malforme', async () => {
    monter();
    const recus: ResultatsSeance[] = [];
    sync.onResultats((resultats) => recus.push(resultats));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(bloc('resultats', { participants: 'douze' }));
    await flux[0].envoyer(bloc('resultats', RESULTATS));
    await attendreJusqua(() => recus.length > 0);
    expect(recus).toEqual([{ ...RESULTATS, ...EN_DIRECT_ABSENT }]);
  });

  it('transmet les jalons, les enigmes et le bareme des resultats en direct', async () => {
    monter();
    const recus: ResultatsDuFlux[] = [];
    sync.onResultats((resultats) => recus.push(resultats));
    sync.ouvrir();
    await vider();
    const enDirect = {
      ...RESULTATS,
      jalons: { 'b2-01-jalon-1': { perdu: 2, 'ca-va': 5, clair: 4, total: 11 } },
      enigmes: [
        {
          parcoursId: 'b2-01-coffre',
          enigmeId: 'enigme-1',
          ouvertes: 11,
          resolues: 7,
          tentativesMoyennes: 2.5,
          epuisees: 1,
        },
      ],
      bareme: buildResumeBareme(),
    };
    await flux[0].envoyer(bloc('resultats', { ...enDirect, jalons: { x: { perdu: 'deux' } } }));
    await flux[0].envoyer(bloc('resultats', enDirect));
    await attendreJusqua(() => recus.length > 0);
    expect(recus).toEqual([enDirect]);
  });

  describe('forme du flux servie par un serveur v2 ou v3 (F20)', () => {
    async function collecterResultats(charges: readonly unknown[]): Promise<ResultatsSeance[]> {
      monter();
      const recus: ResultatsSeance[] = [];
      sync.onResultats((resultats) => recus.push(resultats));
      sync.ouvrir();
      await vider();
      for (const charge of charges) {
        await flux[0].envoyer(bloc('resultats', charge));
      }
      await attendreJusqua(() => recus.length > 0);
      return recus;
    }

    it('complete un etat de l ancienne forme par une revision nulle et un pilotage vide', async () => {
      const recus = await collecter([bloc('etat', ETAT_ANCIEN)]);

      expect(recus).toEqual([{ ...ETAT_ANCIEN, revision: 0, pilotage: {} }]);
    });

    it('transmet la revision et le pilotage d un etat de la forme finale', async () => {
      const recus = await collecter([bloc('etat', ETAT)]);

      expect(recus).toEqual([ETAT]);
    });

    it('ignore un etat dont la revision ou le pilotage est malforme', async () => {
      const recus = await collecter([
        bloc('etat', { ...ETAT, revision: 'sept' }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A3-01': { phase: 'fin' } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A3-06': { etayage: -1 } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A5-08': { revele: 'oui' } } }),
        bloc('etat', ETAT),
      ]);

      expect(recus).toEqual([ETAT]);
    });

    it('complete une question de resultats de l ancienne forme sans toucher ses comptes', async () => {
      const recus = await collecterResultats([
        { participants: 12, questions: [QUESTION_ANCIENNE] },
      ]);

      expect(recus).toEqual([
        {
          ...EN_DIRECT_ABSENT,
          participants: 12,
          questions: [
            {
              ...QUESTION_ANCIENNE,
              ecranId: '',
              type: 'vote',
              noteCompte: true,
              parOption: null,
              scoreMoyen: null,
              parCle: null,
            },
          ],
        },
      ]);
    });

    it('ignore des resultats dont un champ de la forme finale est malforme', async () => {
      const [question] = RESULTATS.questions;
      const recus = await collecterResultats([
        { ...RESULTATS, questions: [{ ...question, type: 'graphique' }] },
        { ...RESULTATS, questions: [{ ...question, parOption: { a: 'six' } }] },
        { ...RESULTATS, questions: [{ ...question, parCle: { E3: { total: 2 } } }] },
        { ...RESULTATS, questions: [{ ...question, scoreMoyen: '0,7' }] },
        RESULTATS,
      ]);

      expect(recus).toEqual([{ ...RESULTATS, ...EN_DIRECT_ABSENT }]);
    });
  });

  it('un evenement resultats n atteint pas onState', async () => {
    monter();
    const etats: EtatSession[] = [];
    const resultats: ResultatsSeance[] = [];
    sync.onState((etat) => etats.push(etat));
    sync.onResultats((recu) => resultats.push(recu));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(bloc('resultats', RESULTATS));
    await attendreJusqua(() => resultats.length > 0);
    expect(etats).toEqual([]);
  });

  describe('sante du flux', () => {
    const SILENCE_MAX_MS = 45_000;
    let statuts: StatutFlux[];

    function suivreLesStatuts(): void {
      statuts = [];
      sync.onStatut((statut) => statuts.push(statut));
    }

    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('annonce le flux connecte des que le serveur l accepte', async () => {
      monter();
      suivreLesStatuts();

      sync.ouvrir();
      await vider();

      expect(statuts).toEqual([{ etat: 'connecte' }]);
    });

    it('annonce la reconnexion quand le flux se coupe, puis la connexion retrouvee', async () => {
      monter();
      suivreLesStatuts();
      sync.ouvrir();
      await vider();

      await flux[0].couper();
      await laisserPasserLeFlux();

      expect(statuts).toEqual([{ etat: 'connecte' }, { etat: 'reconnexion' }]);

      jasmine.clock().tick(1000);
      await laisserPasserLeFlux();

      expect(flux.length).toBe(2);
      expect(statuts.at(-1)).toEqual({ etat: 'connecte' });
    });

    for (const statut of [401, 403]) {
      it(`cesse de rouvrir le flux apres un refus ${statut}, qu aucune relance ne resoudra`, async () => {
        const tentatives = { nombre: 0 };
        sync = createSync({
          baseUrl: BASE,
          sessionId: SESSION,
          chemin: 'stream',
          ouvrirFlux: () => {
            tentatives.nombre += 1;
            return Promise.resolve(new Response(null, { status: statut }));
          },
        });
        suivreLesStatuts();

        sync.ouvrir();
        await vider();
        jasmine.clock().tick(60_000);
        await vider();

        expect(tentatives.nombre).toBe(1);
        expect(statuts).toEqual([{ etat: 'refuse', statut }]);
      });

      it(`rouvre le flux apres un refus ${statut} si le poste le redemande lui-meme`, async () => {
        const tentatives = { nombre: 0 };
        sync = createSync({
          baseUrl: BASE,
          sessionId: SESSION,
          chemin: 'stream',
          ouvrirFlux: () => {
            tentatives.nombre += 1;
            return Promise.resolve(new Response(null, { status: statut }));
          },
        });
        suivreLesStatuts();

        sync.ouvrir();
        await vider();
        sync.ouvrir();
        await vider();

        expect(tentatives.nombre).toBe(2);
      });
    }

    for (const statut of [429, 500, 503]) {
      it(`annonce un refus ${statut} a chaque essai sans le masquer par une reconnexion`, async () => {
        const tentatives = { nombre: 0 };
        sync = createSync({
          baseUrl: BASE,
          sessionId: SESSION,
          chemin: 'presenter-stream',
          ouvrirFlux: () => {
            tentatives.nombre += 1;
            return Promise.resolve(new Response(null, { status: statut }));
          },
        });
        suivreLesStatuts();

        sync.ouvrir();
        await vider();
        jasmine.clock().tick(1000);
        await vider();

        expect(tentatives.nombre).toBe(2);
        expect(statuts).toEqual([
          { etat: 'refuse', statut },
          { etat: 'refuse', statut },
        ]);
      });
    }

    it('coupe et relance un flux reste muet trois battements de suite', async () => {
      monter();
      const etats: EtatSession[] = [];
      sync.onState((etat) => etats.push(etat));
      suivreLesStatuts();
      sync.ouvrir();
      await flux[0].envoyer(bloc('etat', ETAT));
      await laisserPasserLeFlux();

      expect(etats).toEqual([ETAT]);

      jasmine.clock().tick(SILENCE_MAX_MS - 1);
      await laisserPasserLeFlux();

      expect(statuts).toEqual([{ etat: 'connecte' }]);

      jasmine.clock().tick(1);
      await laisserPasserLeFlux();

      expect(statuts).toEqual([{ etat: 'connecte' }, { etat: 'reconnexion' }]);

      jasmine.clock().tick(1000);
      await laisserPasserLeFlux();

      expect(flux.length).toBe(2);
      expect(etats.at(-1)).withContext('l etat connu est redonne a la reconnexion').toEqual(ETAT);
    });

    it('garde ouvert un flux dont les battements arrivent, puis le relance quand ils cessent', async () => {
      monter();
      suivreLesStatuts();
      sync.ouvrir();
      await laisserPasserLeFlux();

      for (let battement = 0; battement < 6; battement += 1) {
        jasmine.clock().tick(15_000);
        await flux[0].envoyer(bloc('heartbeat', { ts: '2026-09-21T08:00:00.000Z' }));
        await laisserPasserLeFlux();
      }
      jasmine.clock().tick(SILENCE_MAX_MS - 1);
      await laisserPasserLeFlux();

      expect(flux.length).toBe(1);
      expect(statuts).toEqual([{ etat: 'connecte' }]);

      jasmine.clock().tick(1);
      await laisserPasserLeFlux();

      expect(statuts).toEqual([{ etat: 'connecte' }, { etat: 'reconnexion' }]);
    });

    it('relance une ouverture restee sans reponse', async () => {
      const ouvertures: RequestInit[] = [];
      const original = globalThis.fetch;
      globalThis.fetch = ((_url: RequestInfo | URL, init?: RequestInit) => {
        ouvertures.push(init ?? {});
        return new Promise<Response>((_resoudre, rejeter) => {
          init?.signal?.addEventListener('abort', () => rejeter(new DOMException('abort')));
        });
      }) as typeof fetch;
      try {
        sync = createSync({ baseUrl: BASE, sessionId: SESSION, jeton: JETON });
        suivreLesStatuts();
        sync.ouvrir();

        jasmine.clock().tick(SILENCE_MAX_MS);
        await vider();
        jasmine.clock().tick(1000);
        await vider();

        expect(ouvertures.length).toBe(2);
        expect(ouvertures[0].signal?.aborted).toBeTrue();
        expect(statuts).toEqual([{ etat: 'reconnexion' }]);
      } finally {
        sync.close();
        globalThis.fetch = original;
      }
    });

    it('n annonce rien et ne relance pas apres une fermeture volontaire', async () => {
      monter();
      suivreLesStatuts();
      sync.ouvrir();
      await vider();

      sync.close();
      jasmine.clock().tick(SILENCE_MAX_MS * 2);
      await vider();

      expect(statuts).toEqual([{ etat: 'connecte' }]);
      expect(flux.length).toBe(1);
    });
  });
});
