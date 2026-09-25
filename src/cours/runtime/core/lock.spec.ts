import { createLock, type Incident, type IncidentType, type Lock } from './lock';

function dispatcherEvenementsSensibles(): { copie: Event; raccourci: KeyboardEvent } {
  const copie = new Event('copy', { cancelable: true });
  document.dispatchEvent(copie);
  const raccourci = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true });
  document.dispatchEvent(raccourci);
  window.dispatchEvent(new Event('blur'));
  return { copie, raccourci };
}

function attendreQueRienNeSoitBloque(verrou: Lock): void {
  const { copie, raccourci } = dispatcherEvenementsSensibles();
  expect(copie.defaultPrevented).toBe(false);
  expect(raccourci.defaultPrevented).toBe(false);
  expect(verrou.incidents()).toEqual([]);
}

function typesEcoutes(espion: jasmine.Spy): string[] {
  return espion.calls.allArgs().map(([type]) => String(type));
}

describe('lock', () => {
  let lock: Lock | null = null;

  afterEach(() => {
    lock?.disarm();
    lock = null;
  });

  it('le regime ouvert n enregistre rien et ne bloque rien', () => {
    lock = createLock('ouvert');
    lock.arm();
    attendreQueRienNeSoitBloque(lock);
  });

  it('le regime focus ne journalise un changement de visibilite que si l onglet est cache', () => {
    lock = createLock('focus');
    lock.arm();
    const cache = spyOnProperty(document, 'hidden', 'get').and.returnValue(false);

    document.dispatchEvent(new Event('visibilitychange'));
    expect(lock.incidents()).toEqual([]);

    cache.and.returnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('visibility');
  });

  it('le regime focus journalise une perte de focus de la fenetre', () => {
    lock = createLock('focus');
    lock.arm();
    window.dispatchEvent(new Event('blur'));
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('blur');
  });

  it('le regime focus ne bloque ni ne journalise le copier', () => {
    lock = createLock('focus');
    lock.arm();
    const copie = new Event('copy', { cancelable: true });
    document.dispatchEvent(copie);
    expect(copie.defaultPrevented).toBe(false);
    expect(lock.incidents()).toEqual([]);
  });

  const EVENEMENTS_EMPECHES: readonly IncidentType[] = ['copy', 'paste', 'contextmenu'];

  for (const type of EVENEMENTS_EMPECHES) {
    it(`le regime examen empeche et journalise l evenement ${type}`, () => {
      lock = createLock('examen');
      lock.arm();
      const evenement = new Event(type, { cancelable: true });
      document.dispatchEvent(evenement);
      expect(evenement.defaultPrevented).toBe(true);
      expect(lock.incidents().length).toBe(1);
      expect(lock.incidents()[0].type).toBe(type);
    });
  }

  const RACCOURCIS_EMPECHES: readonly string[] = ['p', 's', 'u'];

  for (const touche of RACCOURCIS_EMPECHES) {
    it(`le regime examen empeche et journalise ctrl+${touche}`, () => {
      lock = createLock('examen');
      lock.arm();
      const evenement = new KeyboardEvent('keydown', {
        key: touche,
        ctrlKey: true,
        cancelable: true,
      });
      document.dispatchEvent(evenement);
      expect(evenement.defaultPrevented).toBe(true);
      expect(lock.incidents().length).toBe(1);
      expect(lock.incidents()[0].type).toBe('blocked_shortcut');
      expect(lock.incidents()[0].detail).toEqual({ touche });
    });
  }

  it('le regime examen empeche aussi cmd+p sur mac, via metaKey', () => {
    lock = createLock('examen');
    lock.arm();
    const evenement = new KeyboardEvent('keydown', { key: 'p', metaKey: true, cancelable: true });
    document.dispatchEvent(evenement);
    expect(evenement.defaultPrevented).toBe(true);
    expect(lock.incidents()[0].type).toBe('blocked_shortcut');
  });

  it('F12 n est pas considere comme bloque, seulement journalise', () => {
    lock = createLock('examen');
    lock.arm();
    const evenement = new KeyboardEvent('keydown', { key: 'F12', cancelable: true });
    const nonAnnule = document.dispatchEvent(evenement);
    expect(nonAnnule).toBe(true);
    expect(evenement.defaultPrevented).toBe(false);
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('devtools_key');
  });

  it('le regime examen avertit avant de quitter la page et journalise la tentative', () => {
    const ecouteurs = new Map<string, EventListener>();
    spyOn(window, 'addEventListener').and.callFake(
      (type: string, ecouteur: EventListenerOrEventListenerObject | null) => {
        ecouteurs.set(type, ecouteur as EventListener);
      },
    );
    lock = createLock('examen');
    lock.arm();
    const dechargement = {
      empeche: false,
      returnValue: 'valeur-intacte',
      preventDefault(): void {
        dechargement.empeche = true;
      },
    };
    ecouteurs.get('beforeunload')?.(dechargement as unknown as Event);
    expect(dechargement.empeche).toBe(true);
    expect(dechargement.returnValue).toBe('');
    expect(lock.incidents().length).toBe(1);
    expect(lock.incidents()[0].type).toBe('page_unload');
  });

  it('seul le regime examen retient la page, et disarm rend la main', () => {
    const pose = spyOn(window, 'addEventListener').and.stub();
    const retire = spyOn(window, 'removeEventListener').and.stub();
    const ouvert = createLock('focus');
    ouvert.arm();
    expect(typesEcoutes(pose)).not.toContain('beforeunload');
    ouvert.disarm();
    lock = createLock('examen');
    lock.arm();
    expect(typesEcoutes(pose)).toContain('beforeunload');
    lock.disarm();
    expect(typesEcoutes(retire)).toContain('beforeunload');
  });

  it('disarm retire tous les ecouteurs poses en regime examen', () => {
    lock = createLock('examen');
    lock.arm();
    lock.disarm();
    attendreQueRienNeSoitBloque(lock);
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
    lock = createLock('examen');
    expect(() => lock?.disarm()).not.toThrow();
  });

  it('le journal est horodate en ISO 8601', () => {
    lock = createLock('focus');
    lock.arm();
    window.dispatchEvent(new Event('blur'));
    expect(lock.incidents()[0].horodatage).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('le journal est borne a 200 entrees et conserve les plus recentes', () => {
    lock = createLock('examen');
    lock.arm();
    for (let i = 0; i < 205; i += 1) {
      document.dispatchEvent(new Event('copy', { cancelable: true }));
    }
    const raccourci = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true });
    document.dispatchEvent(raccourci);

    const journal = lock.incidents();
    expect(journal.length).toBe(200);
    expect(journal[199].type).toBe('blocked_shortcut');
  });

  it('onIncident notifie les abonnes a chaque incident', () => {
    lock = createLock('focus');
    lock.arm();
    const recus: Incident[] = [];
    lock.onIncident((incident) => recus.push(incident));
    window.dispatchEvent(new Event('blur'));
    expect(recus.length).toBe(1);
    expect(recus[0].type).toBe('blur');
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

  const CAS_SEUIL_REPONSE: ReadonlyArray<{ dureeMs: number; attendu: number }> = [
    { dureeMs: 400, attendu: 1 },
    { dureeMs: 2500, attendu: 0 },
    { dureeMs: 1000, attendu: 0 },
  ];

  for (const cas of CAS_SEUIL_REPONSE) {
    it(`en regime examen une reponse de ${cas.dureeMs}ms face a un seuil de 1000ms produit ${cas.attendu} incident fast_answer`, () => {
      lock = createLock('examen', { seuilReponseRapideMs: 1000 });
      lock.arm();
      lock.recordAnswerDuration(cas.dureeMs);
      expect(lock.incidents().length).toBe(cas.attendu);
    });
  }

  it('l incident fast_answer porte la duree de reponse en detail', () => {
    lock = createLock('examen', { seuilReponseRapideMs: 1000 });
    lock.arm();
    lock.recordAnswerDuration(400);
    expect(lock.incidents()[0].detail).toEqual({ dureeMs: 400 });
  });

  it('recordAnswerDuration ne fait rien en regime focus', () => {
    lock = createLock('focus', { seuilReponseRapideMs: 100000 });
    lock.arm();
    lock.recordAnswerDuration(1);
    expect(lock.incidents()).toEqual([]);
  });

  it('recordAnswerDuration ne fait rien avant l appel a arm', () => {
    lock = createLock('examen', { seuilReponseRapideMs: 100000 });
    lock.recordAnswerDuration(1);
    expect(lock.incidents()).toEqual([]);
  });
});
