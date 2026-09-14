import type { Identity } from './identity';
import { pending } from './queue';
import { removeKey } from './storage';
import { createSync, type EtatSession, type OuvertureFlux, type Sync } from './sync';

const CLE_FILE = 'fp.file-reponses';
const BASE = 'https://api.test';
const SESSION = 's1';
const JETON = 'jeton-participant';
const ENTETE_JETON = 'x-participant-token';

const ENCODEUR = new TextEncoder();

interface FluxFactice {
  url: string;
  entetes: Record<string, string>;
  envoyer(morceau: string): Promise<void>;
  couper(): Promise<void>;
}

async function vider(): Promise<void> {
  for (let tour = 0; tour < 200; tour += 1) {
    await Promise.resolve();
  }
}

function creerOuverture(flux: FluxFactice[]): OuvertureFlux {
  return (url, entetes) => {
    const enAttente: Array<{ morceau: string | null; servi: () => void }> = [];
    let reclame: (() => void) | null = null;

    const corps = new ReadableStream<Uint8Array>({
      pull: async (controleur) => {
        while (enAttente.length === 0) {
          await new Promise<void>((resoudre) => {
            reclame = resoudre;
          });
        }
        const suivant = enAttente.shift();
        if (!suivant) {
          return;
        }
        if (suivant.morceau === null) {
          controleur.close();
        } else {
          controleur.enqueue(ENCODEUR.encode(suivant.morceau));
        }
        suivant.servi();
      },
    });

    const deposer = (morceau: string | null): Promise<void> =>
      new Promise<void>((resoudre) => {
        enAttente.push({ morceau, servi: resoudre });
        reclame?.();
        reclame = null;
      });

    flux.push({
      url,
      entetes,
      envoyer: async (morceau) => {
        await deposer(morceau);
        await vider();
      },
      couper: async () => {
        await deposer(null);
        await vider();
      },
    });
    return Promise.resolve(new Response(corps, { status: 200 }));
  };
}

function bloc(nom: string, charge: unknown): string {
  return `event: ${nom}\ndata: ${JSON.stringify(charge)}\n\n`;
}

const IDENTITE: Identity = {
  studentKey: 'etu-1',
  prenom: 'Theo',
  nom: 'Martin',
  email: 'theo@example.com',
};

const ETAT: EtatSession = {
  etat: 'en_cours',
  modeRythme: 'pilote',
  ecranCourant: 2,
  intervalleLibre: null,
  participants: 24,
};

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

  async function collecter(morceaux: readonly string[], attendus = 1): Promise<EtatSession[]> {
    monter();
    const recus: EtatSession[] = [];
    sync.onState((etat) => recus.push(etat));
    sync.join(IDENTITE);
    await vider();
    if (flux.length === 0) {
      throw new Error('aucun flux ouvert : le double d ouverture n a pas ete appele');
    }
    for (const morceau of morceaux) {
      await flux[0].envoyer(morceau);
    }
    for (let tour = 0; tour < 40 && recus.length < attendus; tour += 1) {
      await new Promise((resoudre) => setTimeout(resoudre, 0));
    }
    await vider();
    return recus;
  }

  beforeEach(() => {
    removeKey(CLE_FILE);
    flux = [];
  });

  afterEach(() => {
    sync.close();
  });

  it('pose l en tete du jeton de participant sur l ouverture du flux', async () => {
    monter();
    sync.join(IDENTITE);
    await vider();
    expect(flux.length).toBe(1);
    expect(flux[0].entetes[ENTETE_JETON]).toBe(JETON);
    expect(flux[0].url).toBe('https://api.test/sessions/s1/stream');
  });

  it('n envoie aucun en tete de jeton quand aucun jeton n est fourni', async () => {
    monter('');
    sync.join(IDENTITE);
    await vider();
    expect(flux[0].entetes[ENTETE_JETON]).toBeUndefined();
  });

  it('ignore un battement de coeur sans notifier les abonnes', async () => {
    const recus = await collecter([bloc('heartbeat', { ts: '2026-09-11T08:00:00.000Z' })], 0);
    expect(recus).toEqual([]);
  });

  it('le desabonnement onState arrete les notifications futures', async () => {
    monter();
    const recus: EtatSession[] = [];
    const arreter = sync.onState((etat) => recus.push(etat));
    sync.join(IDENTITE);
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
      sync.join(IDENTITE);
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
      sync.join(IDENTITE);
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
      sync.join(IDENTITE);
      await flux[0].envoyer(bloc('fin', { motif: 'seance terminee' }));
      await flux[0].couper();
      jasmine.clock().tick(60000);
      await vider();
      expect(flux.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
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
      sync.join(IDENTITE);
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
        sync.join(IDENTITE);
        sync.submit('Q-1', 'a', 1000);
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

  it('met la reponse en file d attente apres join', () => {
    monter();
    sync.join(IDENTITE);
    sync.submit('Q-1', 'b', 1500);
    expect(pending()).toEqual([
      {
        id: jasmine.any(Number),
        sessionId: SESSION,
        studentKey: 'etu-1',
        questionId: 'Q-1',
        valeur: 'b',
        dureeMs: 1500,
        horodatage: jasmine.any(String),
      },
    ]);
  });

  it('refuse d envoyer une reponse avant d avoir rejoint la session', () => {
    monter();
    expect(() => sync.submit('Q-1', 'b', 1500)).toThrow();
  });

  it('submit repercute l echec quand la file d attente est pleine', () => {
    monter();
    sync.join(IDENTITE);
    for (let indice = 0; indice < 200; indice += 1) {
      sync.submit(`Q-${indice}`, 'a', 100);
    }
    expect(() => sync.submit('Q-200', 'a', 100)).toThrow();
  });
});
