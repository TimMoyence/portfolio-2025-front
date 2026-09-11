import type { Identity } from './identity';
import { pending } from './queue';
import { removeKey } from './storage';
import { createSync, type EtatSession, type Sync } from './sync';

const CLE_FILE = 'fp.file-reponses';

interface SourceFactice {
  addEventListener: (type: string, ecoute: (event: Event) => void) => void;
  close: jasmine.Spy;
  onopen: (() => void) | null;
  onerror: (() => void) | null;
  emettre: (type: string, donnees: unknown) => void;
  emettreBrut: (type: string, donneesBrutes: string) => void;
}

function creerFabrique(sourcesCreees: SourceFactice[]): (url: string) => EventSource {
  return () => {
    const ecoutes = new Map<string, (event: Event) => void>();
    const source: SourceFactice = {
      addEventListener: (type, ecoute) => {
        ecoutes.set(type, ecoute);
      },
      close: jasmine.createSpy('close'),
      onopen: null,
      onerror: null,
      emettre: (type, donnees) => {
        ecoutes.get(type)?.(new MessageEvent(type, { data: JSON.stringify(donnees) }));
      },
      emettreBrut: (type, donneesBrutes) => {
        ecoutes.get(type)?.(new MessageEvent(type, { data: donneesBrutes }));
      },
    };
    sourcesCreees.push(source);
    return source as unknown as EventSource;
  };
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
  let sources: SourceFactice[];

  beforeEach(() => {
    removeKey(CLE_FILE);
    sources = [];
  });

  afterEach(() => {
    sync.close();
  });

  it('transmet aux abonnes l etat recu via l evenement etat', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    const recus: EtatSession[] = [];
    sync.onState((etat) => recus.push(etat));
    sync.join(IDENTITE);
    sources[0].emettre('etat', ETAT);
    expect(recus).toEqual([ETAT]);
  });

  it('ignore un message malforme sans casser le flux', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    const recus: EtatSession[] = [];
    sync.onState((etat) => recus.push(etat));
    sync.join(IDENTITE);
    sources[0].emettreBrut('etat', '{ceci n est pas du json');
    expect(recus).toEqual([]);
    sources[0].emettre('etat', ETAT);
    expect(recus).toEqual([ETAT]);
  });

  it('close ferme la source EventSource sous-jacente', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    sync.join(IDENTITE);
    sync.close();
    expect(sources[0].close).toHaveBeenCalledTimes(1);
  });

  it('reconnecte apres une deconnexion avec une temporisation croissante plafonnee a 30s', () => {
    jasmine.clock().install();
    try {
      sync = createSync({
        baseUrl: 'https://api.test',
        sessionId: 's1',
        creerSource: creerFabrique(sources),
      });
      sync.join(IDENTITE);
      expect(sources.length).toBe(1);

      const delaisAttendus = [1000, 2000, 4000, 8000, 16000, 30000, 30000];
      for (const [indice, delaiAttendu] of delaisAttendus.entries()) {
        sources[indice].onerror?.();
        jasmine.clock().tick(delaiAttendu - 1);
        expect(sources.length).toBe(indice + 1);
        jasmine.clock().tick(1);
        expect(sources.length).toBe(indice + 2);
      }
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('arrete de relancer une reconnexion apres close', () => {
    jasmine.clock().install();
    try {
      sync = createSync({
        baseUrl: 'https://api.test',
        sessionId: 's1',
        creerSource: creerFabrique(sources),
      });
      sync.join(IDENTITE);
      sync.close();
      sources[0].onerror?.();
      jasmine.clock().tick(60000);
      expect(sources.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('onopen reinitialise la temporisation apres une reconnexion reussie', () => {
    jasmine.clock().install();
    try {
      sync = createSync({
        baseUrl: 'https://api.test',
        sessionId: 's1',
        creerSource: creerFabrique(sources),
      });
      sync.join(IDENTITE);
      sources[0].onerror?.();
      jasmine.clock().tick(1000);
      sources[1].onopen?.();
      sources[1].onerror?.();
      jasmine.clock().tick(999);
      expect(sources.length).toBe(2);
      jasmine.clock().tick(1);
      expect(sources.length).toBe(3);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('heartbeat reinitialise la temporisation', () => {
    jasmine.clock().install();
    try {
      sync = createSync({
        baseUrl: 'https://api.test',
        sessionId: 's1',
        creerSource: creerFabrique(sources),
      });
      sync.join(IDENTITE);
      sources[0].onerror?.();
      jasmine.clock().tick(1000);
      sources[1].emettre('heartbeat', { ts: '2026-09-11T08:00:00.000Z' });
      sources[1].onerror?.();
      jasmine.clock().tick(999);
      expect(sources.length).toBe(2);
      jasmine.clock().tick(1);
      expect(sources.length).toBe(3);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('fin ferme la source et empeche toute relance ulterieure', () => {
    jasmine.clock().install();
    try {
      sync = createSync({
        baseUrl: 'https://api.test',
        sessionId: 's1',
        creerSource: creerFabrique(sources),
      });
      sync.join(IDENTITE);
      sources[0].emettre('fin', {});
      expect(sources[0].close).toHaveBeenCalled();
      sources[0].onerror?.();
      jasmine.clock().tick(60000);
      expect(sources.length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('le desabonnement onState arrete les notifications futures', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    const recus: EtatSession[] = [];
    const arreter = sync.onState((etat) => recus.push(etat));
    sync.join(IDENTITE);
    arreter();
    sources[0].emettre('etat', ETAT);
    expect(recus).toEqual([]);
  });

  it('se degrade sans lever quand EventSource est absent du contexte', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'EventSource');
    Object.defineProperty(globalThis, 'EventSource', { value: undefined, configurable: true });
    try {
      expect(() => {
        sync = createSync({ baseUrl: 'https://api.test', sessionId: 's1' });
        sync.join(IDENTITE);
        sync.submit('Q-1', 'a', 1000);
        sync.onState(() => undefined);
        sync.close();
      }).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(globalThis, 'EventSource', original);
      } else {
        delete (globalThis as { EventSource?: unknown }).EventSource;
      }
    }
  });

  it('met la reponse en file d attente apres join', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    sync.join(IDENTITE);
    sync.submit('Q-1', 'b', 1500);
    expect(pending()).toEqual([
      {
        sessionId: 's1',
        studentKey: 'etu-1',
        questionId: 'Q-1',
        valeur: 'b',
        dureeMs: 1500,
        horodatage: jasmine.any(String),
      },
    ]);
  });

  it('refuse d envoyer une reponse avant d avoir rejoint la session', () => {
    sync = createSync({
      baseUrl: 'https://api.test',
      sessionId: 's1',
      creerSource: creerFabrique(sources),
    });
    expect(() => sync.submit('Q-1', 'b', 1500)).toThrow();
  });
});
