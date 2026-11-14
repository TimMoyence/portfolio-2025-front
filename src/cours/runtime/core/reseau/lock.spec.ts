import { createLock, type Incident, type Lock } from './lock';

describe('lock', () => {
  let lock: Lock | null = null;

  afterEach(() => {
    lock?.disarm();
    lock = null;
  });

  for (const regime of ['ouvert', 'focus'] as const) {
    it(`le regime ${regime} ne bloque ni ne journalise le copier`, () => {
      lock = createLock(regime);
      lock.arm();
      const copie = new Event('copy', { cancelable: true });
      document.dispatchEvent(copie);

      expect(copie.defaultPrevented).toBe(false);
      expect(lock.incidents()).toEqual([]);
    });
  }

  const sansJournal: readonly (readonly [string, () => Lock])[] = [
    [
      'le regime ouvert ne journalise pas une perte de focus de la fenetre',
      () => {
        const verrou = createLock('ouvert');
        verrou.arm();
        return verrou;
      },
    ],
    [
      'disarm retire les ecouteurs poses en regime focus',
      () => {
        const verrou = createLock('focus');
        verrou.arm();
        verrou.disarm();
        return verrou;
      },
    ],
  ];

  for (const [nom, preparer] of sansJournal) {
    it(nom, () => {
      lock = preparer();
      window.dispatchEvent(new Event('blur'));

      expect(lock.incidents()).toEqual([]);
    });
  }

  it('le regime focus ne journalise un changement de visibilite que si l onglet est cache', () => {
    lock = createLock('focus');
    lock.arm();
    const cache = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);

    document.dispatchEvent(new Event('visibilitychange'));
    expect(lock.incidents()).toEqual([]);

    cache.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('tab_hidden');
  });

  it('le regime focus journalise une perte de focus de la fenetre', () => {
    lock = createLock('focus');
    lock.arm();
    window.dispatchEvent(new Event('blur'));
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('window_blur');
  });

  const perdreLeFocus = (): void => {
    window.dispatchEvent(new Event('blur'));
  };

  const reArmements: readonly (readonly [string, (verrou: Lock) => void])[] = [
    [
      'arm est idempotent et ne pose pas les ecouteurs deux fois',
      (verrou) => {
        verrou.arm();
        verrou.arm();
        perdreLeFocus();
      },
    ],
    [
      'un nouvel arm apres un disarm repose les ecouteurs',
      (verrou) => {
        verrou.arm();
        verrou.disarm();
        perdreLeFocus();
        verrou.arm();
        perdreLeFocus();
      },
    ],
  ];

  for (const [titre, jouer] of reArmements) {
    it(titre, () => {
      lock = createLock('focus');
      jouer(lock);
      expect(lock.incidents().length).toBe(1);
    });
  }

  it('disarm avant tout arm ne leve pas d erreur', () => {
    lock = createLock('focus');
    expect(() => lock?.disarm()).not.toThrow();
  });

  it('le journal est horodate en ISO 8601', () => {
    lock = createLock('focus');
    lock.arm();
    window.dispatchEvent(new Event('blur'));
    expect(lock.incidents()[0].horodatage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('le journal est borne a 200 entrees et conserve les plus recentes', () => {
    lock = createLock('focus');
    lock.arm();
    for (let i = 0; i < 205; i += 1) {
      perdreLeFocus();
    }
    spyOnProperty(document, 'hidden', 'get').and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));

    const journal = lock.incidents();
    expect(journal.length).toBe(200);
    expect(journal[199].type).toBe('tab_hidden');
  });

  it('onIncident notifie les abonnes a chaque incident', () => {
    lock = createLock('focus');
    lock.arm();
    const recus: Incident[] = [];
    lock.onIncident((incident) => recus.push(incident));
    window.dispatchEvent(new Event('blur'));
    expect(recus.length).toBe(1);
    expect(recus[0].type).toBe('window_blur');
  });

  it('onIncident permet de se desabonner', () => {
    lock = createLock('focus');
    lock.arm();
    const recus: Incident[] = [];
    const desabonner = lock.onIncident((incident) => recus.push(incident));
    window.dispatchEvent(new Event('blur'));
    desabonner();
    window.dispatchEvent(new Event('blur'));
    expect(recus.length).toBe(1);
    expect(lock.incidents().length).toBe(2);
  });
});
