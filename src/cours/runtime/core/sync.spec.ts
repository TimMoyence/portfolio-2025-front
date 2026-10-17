import {
  buildResultatQuestion,
  buildResultatsDuFlux,
} from '../../../testing/factories/formations.factory';
import type { FluxFactice } from '../../../testing/flux-sse';
import { bloc, creerOuverture, laisserPasserLeFlux, vider } from '../../../testing/flux-sse';
import {
  createSync,
  refusDuFlux,
  type CheminFlux,
  type EtatSession,
  type IssueDuRenouvellement,
  type RaisonDeFin,
  type ResultatsDuFlux,
  type StatutFlux,
  type Sync,
  type SyncOptions,
} from './sync';
import { urlDeLaSeance } from './adresse-de-seance';
import { sousHorlogeSimulee } from '../../../testing/horloge-simulee';

const BASE = 'https://api.test';
const SESSION = 's1';
const JETON = 'jeton-participant';
const ENTETE_JETON = 'x-participant-token';

const ETAT: EtatSession = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 2,
  intervalleLibre: null,
  participants: 24,
  revision: 7,
  pilotage: {
    'B2-01-A3-01-VOTE-HAUSSE-BAISSE': { phase: 'revote' },
    'B2-01-A5-08-RECOMMANDATION': { revele: true },
    'B2-01-A3-06-INDICE-ET-TAUX-MOYEN': { etayage: 2 },
  },
  majLe: '2026-10-15T18:00:00.000Z',
};

const JETON_PRESENTATEUR = 'jwt-presentateur';

const RESULTATS: ResultatsDuFlux = buildResultatsDuFlux({
  participants: 12,
  questions: [
    buildResultatQuestion({
      questionId: 'Q-1',
      ecranId: 'E-1',
      total: 10,
      correctes: 6,
      neSaitPas: 1,
      confusions: [{ id: 'c1', libelle: 'Confusion frequente', nombre: 3 }],
      parOption: { a: 6, b: 3, __je_ne_sais_pas__: 1 },
      confusionDominante: 'c1',
      part: 6 / 10,
      sousLeSeuil: true,
      remediation: { confusionId: 'c1', ecranId: 'E-2' },
    }),
  ],
});

function sans(objet: object, cle: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(objet).filter(([nom]) => nom !== cle));
}

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

  async function ouvrirAvec(options: Pick<SyncOptions, 'chemin' | 'entetes'>): Promise<void> {
    sync = createSync({
      baseUrl: BASE,
      sessionId: SESSION,
      ouvrirFlux: creerOuverture(flux),
      ...options,
    });
    sync.ouvrir();
    await vider();
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

  async function collecterResultats(charges: readonly unknown[]): Promise<ResultatsDuFlux[]> {
    monter();
    const recus: ResultatsDuFlux[] = [];
    sync.onResultats((resultats) => recus.push(resultats));
    sync.ouvrir();
    await vider();
    for (const charge of charges) {
      await flux[0].envoyer(bloc('resultats', charge));
    }
    await attendreJusqua(() => recus.length > 0);
    return recus;
  }

  async function servirLaFin(
    morceau: string,
    etats: EtatSession[] = [],
  ): Promise<(RaisonDeFin | null)[]> {
    monter();
    const raisons: (RaisonDeFin | null)[] = [];
    sync.onState((etat) => etats.push(etat));
    sync.onFin((raison) => raisons.push(raison));
    sync.ouvrir();
    await vider();
    await flux[0].envoyer(morceau);
    await attendreJusqua(() => raisons.length > 0);
    return raisons;
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
    await ouvrirAvec({
      chemin: 'presenter-stream',
      entetes: () => ({ authorization: `Bearer ${JETON_PRESENTATEUR}` }),
    });
    expect(flux.length).toBe(1);
    expect(flux[0].url).toBe('https://api.test/sessions/s1/presenter-stream');
    expect(flux[0].entetes['authorization']).toBe(`Bearer ${JETON_PRESENTATEUR}`);
  });

  it('relit les en tetes personnalisees a chaque ouverture', async () => {
    let compteur = 0;
    await ouvrirAvec({
      entetes: () => {
        compteur += 1;
        return { 'x-compteur': String(compteur) };
      },
    });
    sync.ouvrir();
    await vider();
    expect(flux.length).toBe(2);
    expect(flux[0].entetes['x-compteur']).toBe('1');
    expect(flux[1].entetes['x-compteur']).toBe('2');
  });

  it('ouvrir sans identite ouvre le flux sur le chemin par defaut', async () => {
    await ouvrirAvec({});
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

  const arretsDefinitifs: readonly (readonly [string, () => Promise<void>])[] = [
    [
      'close annule la reconnexion en attente',
      async () => {
        await flux[0].couper();
        expect(flux.length).toBe(1);
        sync.close();
      },
    ],
    [
      'fin arrete toute relance ulterieure',
      async () => {
        await flux[0].envoyer(bloc('fin', { motif: 'seance terminee' }));
        await flux[0].couper();
      },
    ],
  ];

  for (const [cas, arreter] of arretsDefinitifs) {
    it(cas, async () => {
      jasmine.clock().install();
      try {
        monter();
        sync.ouvrir();
        await arreter();
        jasmine.clock().tick(60000);
        await vider();
        expect(flux.length).toBe(1);
      } finally {
        jasmine.clock().uninstall();
      }
    });
  }

  it('ne livre plus aucun etat servi dans le meme morceau que la fin', async () => {
    const recus: EtatSession[] = [];
    const raisons = await servirLaFin(
      bloc('fin', { raison: 'cloturee' }) + bloc('etat', { ...ETAT, ecranCourant: 51 }),
      recus,
    );

    expect(raisons).toEqual(['cloturee']);
    expect(recus).toEqual([]);
  });

  const finsServies: readonly (readonly [string, RaisonDeFin | null])[] = [
    ['cloturee', 'cloturee'],
    ['evince', 'evince'],
    ['revoque', 'revoque'],
    ['effondrement', null],
  ];

  for (const [servie, annoncee] of finsServies) {
    it(`annonce a ses ecouteurs la fin « ${servie} » avec la raison ${annoncee}`, async () => {
      const raisons = await servirLaFin(bloc('fin', { raison: servie }));

      expect(raisons).toEqual([annoncee]);
    });
  }

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
    const recus = await collecterResultats([RESULTATS]);
    expect(recus).toEqual([RESULTATS]);
  });

  it('transmet les jalons, les enigmes et le bareme des resultats en direct', async () => {
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
    };
    const recus = await collecterResultats([enDirect]);
    expect(recus).toEqual([enDirect]);
  });

  describe('contrat strict du flux servi par le back (L2b-SCHEMAS)', () => {
    const SORTIES_DE_MACHINE = {
      valeurs: { prix: 12 },
      resultat: { valeur: 3, affichage: '3,00 €' },
      etapes: [{ valeur: 12, affichage: '12,00 €' }],
      courbes: { marge: [{ x: 0, y: null }] },
      lignes: {
        marge: [
          {
            valeur: { valeur: 12, affichage: '12,00 €' },
            resultat: { valeur: 3, affichage: '3,00 €' },
            courante: true,
          },
        ],
      },
      phrase: 'La marge vaut 3,00 €.',
    };

    it('transmet la revision, le pilotage et l horodatage d un etat servi', async () => {
      const recus = await collecter([bloc('etat', ETAT)]);

      expect(recus).toEqual([ETAT]);
    });

    it('accepte le pilotage servi par le lot 2c', async () => {
      const servi = {
        ...ETAT,
        pilotage: {
          ...ETAT.pilotage,
          'B2-03-JUMELLE': {
            phase: 'vote' as const,
            questionAffichee: 'Q-A',
            questionOuverte: null,
          },
          'B2-03-MACHINE': { reglages: { prix: 12 }, sortiesProjetees: SORTIES_DE_MACHINE },
        },
      };

      const recus = await collecter([bloc('etat', servi)]);

      expect(recus).toEqual([servi]);
    });

    it('ignore un etat incomplet, malforme ou qui porte une cle que le back ne sert pas', async () => {
      const recus = await collecter([
        ...Object.keys(ETAT).map((cle) => bloc('etat', sans(ETAT, cle))),
        bloc('etat', { ...ETAT, revision: 'sept' }),
        bloc('etat', { ...ETAT, revision: 2 ** 53 }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A3-01': { phase: 'fin' } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A3-06': { etayage: -1 } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A5-08': { revele: 'oui' } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A2-03': { explicationsDevoilees: 1.5 } } }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A2-06': { etayageAtteint: -2 } } }),
        bloc('etat', { ...ETAT, inconnu: 1 }),
        bloc('etat', { ...ETAT, pilotage: { 'B2-01-A3-01': { phase: 'vote', inconnu: true } } }),
        bloc('etat', {
          ...ETAT,
          pilotage: { 'B2-03-MACHINE': { sortiesProjetees: { ...SORTIES_DE_MACHINE, x: 1 } } },
        }),
        bloc('etat', { ...ETAT, majLe: 'hier' }),
        bloc('etat', ETAT),
      ]);

      expect(recus).toEqual([ETAT]);
    });

    it('accepte la confusion dominante, la part, le seuil et la remediation du lot 2c', async () => {
      const [question] = RESULTATS.questions;
      const servis = {
        ...RESULTATS,
        questions: [
          {
            ...question,
            confusionDominante: 'c1',
            part: 0.3,
            sousLeSeuil: true,
            remediation: { confusionId: 'c1', ecranId: 'E-2' },
          },
        ],
      };

      const recus = await collecterResultats([servis]);

      expect(recus).toEqual([servis]);
    });

    it('ignore des resultats incomplets, malformes ou qui portent une cle que le back ne sert pas', async () => {
      const [question] = RESULTATS.questions;
      const recus = await collecterResultats([
        ...Object.keys(RESULTATS).map((cle) => sans(RESULTATS, cle)),
        ...Object.keys(question).map((cle) => ({ ...RESULTATS, questions: [sans(question, cle)] })),
        { ...RESULTATS, participants: 'douze' },
        { ...RESULTATS, bareme: null },
        { ...RESULTATS, jalons: { x: { perdu: 'deux' } } },
        { ...RESULTATS, questions: [{ ...question, type: 'graphique' }] },
        { ...RESULTATS, questions: [{ ...question, parOption: { a: 'six' } }] },
        { ...RESULTATS, questions: [{ ...question, parCle: { E3: { total: 2 } } }] },
        { ...RESULTATS, questions: [{ ...question, scoreMoyen: '0,7' }] },
        { ...RESULTATS, inconnu: 1 },
        { ...RESULTATS, questions: [{ ...question, inconnu: 1 }] },
        { ...RESULTATS, questions: [{ ...question, remediation: { confusionId: 'c1' } }] },
        RESULTATS,
      ]);

      expect(recus).toEqual([RESULTATS]);
    });

    it('ne lit pas la raison d une fin qui porte une cle que le back ne sert pas', async () => {
      const raisons = await servirLaFin(bloc('fin', { raison: 'cloturee', inconnu: 1 }));

      expect(raisons).toEqual([null]);
    });
  });

  it('un evenement resultats n atteint pas onState', async () => {
    monter();
    const etats: EtatSession[] = [];
    const resultats: ResultatsDuFlux[] = [];
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

    async function franchirLeSilenceMax(): Promise<void> {
      jasmine.clock().tick(SILENCE_MAX_MS - 1);
      await laisserPasserLeFlux();

      expect(flux.length).toBe(1);
      expect(statuts).toEqual([{ etat: 'connecte' }]);

      jasmine.clock().tick(1);
    }

    async function constaterLaRelanceApresUneSeconde(): Promise<void> {
      jasmine.clock().tick(1000);
      await laisserPasserLeFlux();

      expect(flux.length).toBe(2);
    }

    async function constaterLaReconnexionPuisLaRelance(): Promise<void> {
      await laisserPasserLeFlux();

      expect(statuts).toEqual([{ etat: 'connecte' }, { etat: 'reconnexion' }]);

      await constaterLaRelanceApresUneSeconde();
    }

    async function ouvrirEnSuivantLesStatuts(): Promise<void> {
      monter();
      suivreLesStatuts();
      sync.ouvrir();
      await vider();
    }

    async function ouvrirMalgreUnRefus(
      statut: number,
      chemin: CheminFlux,
    ): Promise<{ readonly nombre: number }> {
      const tentatives = { nombre: 0 };
      sync = createSync({
        baseUrl: BASE,
        sessionId: SESSION,
        chemin,
        ouvrirFlux: () => {
          tentatives.nombre += 1;
          return Promise.resolve(new Response(null, { status: statut }));
        },
      });
      suivreLesStatuts();
      sync.ouvrir();
      await vider();
      return tentatives;
    }

    sousHorlogeSimulee();

    it('annonce le flux connecte des que le serveur l accepte', async () => {
      await ouvrirEnSuivantLesStatuts();

      expect(statuts).toEqual([{ etat: 'connecte' }]);
    });

    it('annonce la reconnexion quand le flux se coupe, puis la connexion retrouvee', async () => {
      await ouvrirEnSuivantLesStatuts();

      await flux[0].couper();
      await constaterLaReconnexionPuisLaRelance();

      expect(statuts.at(-1)).toEqual({ etat: 'connecte' });
    });

    for (const statut of [401, 403]) {
      it(`cesse de rouvrir le flux apres un refus ${statut}, qu aucune relance ne resoudra`, async () => {
        const tentatives = await ouvrirMalgreUnRefus(statut, 'stream');
        jasmine.clock().tick(60_000);
        await vider();

        expect(tentatives.nombre).toBe(1);
        expect(statuts).toEqual([{ etat: 'refuse', statut }]);
      });

      it(`rouvre le flux apres un refus ${statut} si le poste le redemande lui-meme`, async () => {
        const tentatives = await ouvrirMalgreUnRefus(statut, 'stream');
        sync.ouvrir();
        await vider();

        expect(tentatives.nombre).toBe(2);
      });
    }

    describe('jeton du compte expire ou refuse au reveil d une veille plus longue que lui', () => {
      type Preparation = (forcer: boolean) => Promise<IssueDuRenouvellement>;

      let jeton: string;
      let expire: boolean;
      let ouvertures: string[];
      let preparer: jasmine.Spy<Preparation>;

      function renouvelerLeJeton(forcer: boolean): Promise<IssueDuRenouvellement> {
        if (forcer || expire) {
          jeton = 'jwt-neuf';
          expire = false;
        }
        return Promise.resolve('reussi');
      }

      function injoignableAuxPremiersEssais(essais: number, forces: boolean): Preparation {
        let restants = essais;
        return (forcer) => {
          if ((forcer || !forces) && restants > 0) {
            restants -= 1;
            return Promise.resolve('injoignable');
          }
          return renouvelerLeJeton(forcer);
        };
      }

      function ouvrirAuJeton({
        refusees = [] as readonly number[],
        expireALOuverture = false,
        preparation = renouvelerLeJeton as Preparation,
        statutDuRefus = 401,
      } = {}): void {
        jeton = 'jwt-perime';
        expire = expireALOuverture;
        ouvertures = [];
        preparer = jasmine.createSpy('preparerLaSession').and.callFake(preparation);
        const accepter = creerOuverture(flux);
        sync = createSync({
          baseUrl: BASE,
          sessionId: SESSION,
          chemin: 'presenter-stream',
          entetes: () => ({ authorization: `Bearer ${jeton}` }),
          preparerLaSession: preparer,
          ouvrirFlux: (url, entetes) => {
            ouvertures.push(entetes['authorization'] ?? '');
            return refusees.includes(ouvertures.length)
              ? Promise.resolve(new Response(null, { status: statutDuRefus }))
              : accepter(url, entetes);
          },
        });
        suivreLesStatuts();
        sync.ouvrir();
      }

      function refus(): StatutFlux[] {
        return statuts.filter((statut) => statut.etat === 'refuse');
      }

      it('rafraichit la session avant d ouvrir le flux d un jeton expire, qui ne part jamais', async () => {
        ouvrirAuJeton({ expireALOuverture: true });
        await vider();

        expect(ouvertures).toEqual(['Bearer jwt-neuf']);
        expect(statuts).toEqual([{ etat: 'connecte' }]);
      });

      it('renouvelle la session puis rouvre le flux avec le jeton neuf quand le serveur refuse le jeton', async () => {
        ouvrirAuJeton({ refusees: [1] });
        await vider();

        expect(preparer.calls.allArgs()).toEqual([[false], [true]]);
        expect(ouvertures).toEqual(['Bearer jwt-perime', 'Bearer jwt-neuf']);
        expect(statuts).toEqual([{ etat: 'reconnexion' }, { etat: 'connecte' }]);
      });

      it('tient pour definitif un second 401 apres un renouvellement reussi, sans boucler', async () => {
        ouvrirAuJeton({ refusees: [1, 2, 3] });
        await vider();
        jasmine.clock().tick(60_000);
        await vider();

        expect(preparer.calls.allArgs()).toEqual([[false], [true]]);
        expect(ouvertures.length).toBe(2);
        expect(statuts).toEqual([{ etat: 'reconnexion' }, { etat: 'refuse', statut: 401 }]);
      });

      it('ne rouvre pas un flux ferme pendant le renouvellement', async () => {
        let renouvele: () => void = () => undefined;
        ouvrirAuJeton({
          refusees: [1],
          preparation: (forcer) =>
            forcer
              ? new Promise<IssueDuRenouvellement>((resoudre) => {
                  renouvele = () => resoudre('reussi');
                })
              : Promise.resolve('reussi'),
        });
        await vider();
        sync.close();
        renouvele();
        await vider();

        expect(ouvertures.length).toBe(1);
      });

      it('rearme le renouvellement une fois le flux de nouveau accepte', async () => {
        ouvrirAuJeton({ refusees: [1, 3] });
        await vider();
        jeton = 'jwt-perime';
        await flux[0].couper();
        await laisserPasserLeFlux();
        jasmine.clock().tick(1000);
        await laisserPasserLeFlux();

        expect(preparer.calls.allArgs().filter(([forcer]) => forcer).length).toBe(2);
        expect(ouvertures).toEqual([
          'Bearer jwt-perime',
          'Bearer jwt-neuf',
          'Bearer jwt-perime',
          'Bearer jwt-neuf',
        ]);
        expect(statuts.at(-1)).toEqual({ etat: 'connecte' });
      });

      it('laisse definitif un refus 403, qu aucun jeton neuf ne levera', async () => {
        ouvrirAuJeton({ refusees: [1], statutDuRefus: 403 });
        await vider();

        expect(preparer).not.toHaveBeenCalledWith(true);
        expect(ouvertures.length).toBe(1);
        expect(statuts).toEqual([{ etat: 'refuse', statut: 403 }]);
      });

      it('garde la relance a delai croissant quand le renouvellement est injoignable, puis rouvre', async () => {
        ouvrirAuJeton({ refusees: [1], preparation: injoignableAuxPremiersEssais(2, true) });
        await vider();
        jasmine.clock().tick(1000);
        await vider();

        expect(ouvertures)
          .withContext('aucun essai avec le jeton refuse')
          .toEqual(['Bearer jwt-perime']);

        jasmine.clock().tick(2000);
        await laisserPasserLeFlux();

        expect(ouvertures).toEqual(['Bearer jwt-perime', 'Bearer jwt-neuf']);
        expect(refus()).withContext('aucun refus definitif').toEqual([]);
        expect(statuts.at(-1)).toEqual({ etat: 'connecte' });
      });

      it('n ouvre pas le flux d un jeton expire tant que le rafraichissement est injoignable', async () => {
        ouvrirAuJeton({
          expireALOuverture: true,
          preparation: injoignableAuxPremiersEssais(1, false),
        });
        await vider();

        expect(ouvertures).toEqual([]);
        expect(statuts).toEqual([{ etat: 'reconnexion' }]);

        jasmine.clock().tick(1000);
        await laisserPasserLeFlux();

        expect(ouvertures).toEqual(['Bearer jwt-neuf']);
        expect(statuts.at(-1)).toEqual({ etat: 'connecte' });
      });

      it('tient pour definitif un rafraichissement refuse, sans ouvrir le flux', async () => {
        ouvrirAuJeton({ expireALOuverture: true, preparation: () => Promise.resolve('refuse') });
        await vider();
        jasmine.clock().tick(60_000);
        await vider();

        expect(ouvertures).toEqual([]);
        expect(preparer).toHaveBeenCalledTimes(1);
        expect(statuts).toEqual([{ etat: 'refuse', statut: 401 }]);
      });
    });

    for (const statut of [429, 500, 503]) {
      it(`annonce un refus ${statut} a chaque essai sans le masquer par une reconnexion`, async () => {
        const tentatives = await ouvrirMalgreUnRefus(statut, 'presenter-stream');
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

      await franchirLeSilenceMax();
      await constaterLaReconnexionPuisLaRelance();

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
      await franchirLeSilenceMax();
      await constaterLaReconnexionPuisLaRelance();
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

    describe('au reveil du poste', () => {
      const signaux: readonly (readonly [string, () => void])[] = [
        ['le reseau revient', () => window.dispatchEvent(new Event('online'))],
        ['la page est restauree', () => window.dispatchEvent(new Event('pageshow'))],
        ['l onglet est degele', () => document.dispatchEvent(new Event('resume'))],
        ['l onglet redevient visible', () => document.dispatchEvent(new Event('visibilitychange'))],
      ];

      beforeEach(() => {
        jasmine.clock().mockDate(new Date(2026, 8, 25, 9, 0, 0));
      });

      for (const [signal, reveiller] of signaux) {
        it(`relance sans attendre la temporisation quand ${signal}`, async () => {
          monter();
          sync.ouvrir();
          await vider();
          await flux[0].couper();
          await laisserPasserLeFlux();
          await constaterLaRelanceApresUneSeconde();
          await flux[1].couper();
          await laisserPasserLeFlux();

          reveiller();
          await laisserPasserLeFlux();

          expect(flux.length).toBe(3);
        });
      }

      async function reveillerApresUnEtat(reveil: Date, reveiller: () => void): Promise<void> {
        monter();
        sync.ouvrir();
        await vider();
        await flux[0].envoyer(bloc('etat', ETAT));

        jasmine.clock().mockDate(reveil);
        reveiller();
        await vider();
      }

      it('rouvre un flux reste muet pendant la veille', async () => {
        await reveillerApresUnEtat(new Date(2026, 8, 25, 9, 5, 0), () =>
          window.dispatchEvent(new Event('online')),
        );

        expect(flux.length).toBe(2);
      });

      it('laisse en place un flux vivant quand l eleve revient sur l onglet', async () => {
        await reveillerApresUnEtat(new Date(2026, 8, 25, 9, 0, 10), () =>
          document.dispatchEvent(new Event('visibilitychange')),
        );

        expect(flux.length).toBe(1);
      });

      it('ne rouvre rien apres la fin de la seance ni apres une fermeture volontaire', async () => {
        monter();
        sync.ouvrir();
        await vider();
        await flux[0].envoyer(bloc('fin', { raison: 'cloturee' }));
        window.dispatchEvent(new Event('online'));
        await vider();

        const autre = createSync({
          baseUrl: BASE,
          sessionId: SESSION,
          ouvrirFlux: creerOuverture(flux),
        });
        autre.ouvrir();
        await vider();
        autre.close();
        window.dispatchEvent(new Event('online'));
        await vider();

        expect(flux.length).toBe(2);
      });
    });

    it('n annonce rien et ne relance pas apres une fermeture volontaire', async () => {
      await ouvrirEnSuivantLesStatuts();

      sync.close();
      jasmine.clock().tick(SILENCE_MAX_MS * 2);
      await vider();

      expect(statuts).toEqual([{ etat: 'connecte' }]);
      expect(flux.length).toBe(1);
    });
  });
});

describe('refusDuFlux', () => {
  const refus = (statut: number): StatutFlux => ({ etat: 'refuse', statut });

  it('classe 401 et 403 comme une session perdue, sans relance', () => {
    expect(refusDuFlux(refus(401))).toEqual({ statut: 401, motif: 'session' });
    expect(refusDuFlux(refus(403))).toEqual({ statut: 403, motif: 'session' });
  });

  it('classe 429 comme une saturation et tout autre refus comme autre', () => {
    expect(refusDuFlux(refus(429))).toEqual({ statut: 429, motif: 'saturation' });
    expect(refusDuFlux(refus(503))).toEqual({ statut: 503, motif: 'autre' });
  });

  it('ne rend aucun refus pour un flux connecte, en reconnexion ou inconnu', () => {
    expect(refusDuFlux({ etat: 'connecte' })).toBeNull();
    expect(refusDuFlux({ etat: 'reconnexion' })).toBeNull();
    expect(refusDuFlux(null)).toBeNull();
  });
});

describe('urlDeLaSeance', () => {
  it('nomme la seance sous la base de l API, son identifiant encode', () => {
    expect(urlDeLaSeance(BASE, SESSION)).toBe(`${BASE}/sessions/${SESSION}`);
    expect(urlDeLaSeance(BASE, 's1/../admin?x=1')).toBe(`${BASE}/sessions/s1%2F..%2Fadmin%3Fx%3D1`);
  });
});
