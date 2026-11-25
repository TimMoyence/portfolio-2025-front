import {
  POINTEUR_INACTIF,
  attirerVersLAnneau,
  ondeDuPointeur,
  pousserParLOnde,
  suivreLePointeur,
  type EvenementDuPointeur,
} from './pointeur';

const evenement = (surcharge: Partial<EvenementDuPointeur>): EvenementDuPointeur => ({
  type: 'pointermove',
  pointerType: 'mouse',
  isPrimary: true,
  button: 0,
  clientX: 400,
  clientY: 300,
  ...surcharge,
});

const suite = (...evenements: EvenementDuPointeur[]) =>
  evenements.reduce(suivreLePointeur, POINTEUR_INACTIF);

describe('CON-03 · le pointeur actif est un point du réseau, lu par les Pointer Events', () => {
  it('CON-03 · une souris est active dès qu elle bouge, et jusqu à sa sortie du document', () => {
    expect(suite(evenement({}))).toEqual({ actif: true, x: 400, y: 300 });
    expect(suite(evenement({}), evenement({ type: 'sortie' })).actif).toBeFalse();
  });

  it('CON-03 · un doigt est actif tant qu il touche, puis plus rien, même si un mousemove de compatibilité arrive', () => {
    const doigt = { pointerType: 'touch' } as const;
    expect(suite(evenement({ ...doigt, type: 'pointerdown' })).actif).toBeTrue();
    expect(
      suite(
        evenement({ ...doigt, type: 'pointerdown' }),
        evenement({ ...doigt, type: 'pointerup' }),
        evenement({ type: 'mousemove' }),
      ).actif,
    ).toBeFalse();
    expect(
      suite(
        evenement({ ...doigt, type: 'pointerdown' }),
        evenement({ ...doigt, type: 'pointercancel' }),
      ).actif,
    ).toBeFalse();
  });

  it('CON-03 · avec deux doigts, seul le principal agit', () => {
    const second = evenement({ pointerType: 'touch', type: 'pointerdown', isPrimary: false });
    expect(suite(second).actif).toBeFalse();
  });

  for (const [distance, sens] of [
    [120, 'se rapproche'],
    [173, 'se rapproche'],
    [30, 's écarte'],
    [60, 'ne bouge pas'],
    [174, 'ne bouge pas'],
  ] as const) {
    it(`CON-03 · un point à ${distance} px du pointeur ${sens}`, () => {
      const point = { x: 400 + distance, y: 300 };
      attirerVersLAnneau(point, { actif: true, x: 400, y: 300 });
      const apres = point.x - 400;
      if (sens === 'se rapproche') expect(apres).toBeLessThan(distance);
      if (sens === 's écarte') expect(apres).toBeGreaterThan(distance);
      if (sens === 'ne bouge pas') expect(apres).toBe(distance);
    });
  }

  it('CON-03 · un pointeur inactif n attire rien', () => {
    const point = { x: 520, y: 300 };
    attirerVersLAnneau(point, POINTEUR_INACTIF);
    expect(point).toEqual({ x: 520, y: 300 });
  });
});

describe('CON-04 · un pointerdown envoie une onde de 420 px qui pousse les points vers l extérieur', () => {
  it('CON-04 · une pression de souris ou de doigt crée une onde ; un autre bouton ou un événement clavier non', () => {
    expect(ondeDuPointeur(evenement({ type: 'pointerdown', clientX: 500, clientY: 400 }))).toEqual({
      x: 500,
      y: 400,
      age: 0,
      poussees: new Set<number>(),
    });
    expect(ondeDuPointeur(evenement({ type: 'pointerdown', pointerType: 'touch' }))).not.toBeNull();
    expect(ondeDuPointeur(evenement({ type: 'pointerdown', button: 2 }))).toBeNull();
    expect(ondeDuPointeur(evenement({ type: 'click' }))).toBeNull();
  });

  it('CON-04 · le front pousse une fois le point à 400 px, jamais celui à 430 px', () => {
    const onde = ondeDuPointeur(evenement({ type: 'pointerdown', clientX: 500, clientY: 400 }));
    const points = [
      { x: 900, y: 400 },
      { x: 930, y: 400 },
    ];
    if (!onde) throw new Error('onde attendue');

    for (let image = 0; image < 120; image++) pousserParLOnde(onde, points, 1 / 60);

    expect(points[0].x).toBeGreaterThan(900);
    expect(points[1].x).toBe(930);
    expect([...onde.poussees]).toEqual([0]);
  });
});
