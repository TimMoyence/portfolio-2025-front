import {
  creerChamp,
  dureeDuFondu,
  fondre,
  fondreLesPartants,
  nombreDePoints,
  rapprocher,
  redimensionner,
} from './champ';

const hasardFixe = (): number => 0.5;

describe('CON-01 · le nombre de points suit la surface de la fenêtre', () => {
  for (const [largeur, hauteur, attendu] of [
    [1350, 940, 58],
    [412, 823, 18],
    [360, 640, 18],
    [1920, 1080, 80],
    [767, 1400, 46],
    [768, 1400, 49],
    [900, 1400, 57],
  ] as const) {
    it(`CON-01 · ${largeur}×${hauteur} porte ${attendu} points`, () => {
      expect(nombreDePoints(largeur, hauteur)).toBe(attendu);
      expect(creerChamp(largeur, hauteur, hasardFixe).points.length).toBe(attendu);
    });
  }
});

describe('CON-01 · un redimensionnement garde les points, il ne les recrée pas', () => {
  it('CON-01 · 1350×940 → 1350×880 retire 4 points, garde les 54 premiers et met leur hauteur à l échelle', () => {
    const champ = creerChamp(1350, 940, hasardFixe);
    const avant = [...champ.points];
    const hauteursAvant = avant.map(({ y }) => y);

    redimensionner(champ, 1350, 880, hasardFixe);

    expect(champ.points.length).toBe(54);
    champ.points.forEach((point, index) => {
      expect(point).toBe(avant[index]);
      expect(point.y).toBeCloseTo((hauteursAvant[index] * 880) / 940, 6);
    });
  });

  it('CON-01 · 412×823 → 412×760 garde les 18 mêmes points', () => {
    const champ = creerChamp(412, 823, hasardFixe);
    const avant = [...champ.points];

    redimensionner(champ, 412, 760, hasardFixe);

    expect(champ.points).toEqual(avant);
    champ.points.forEach((point, index) => expect(point).toBe(avant[index]));
  });

  it('CON-01 · 1350×880 → 1350×940 garde les 54 points et en fait naître 4 libres', () => {
    const champ = creerChamp(1350, 880, hasardFixe);
    const avant = [...champ.points];

    redimensionner(champ, 1350, 940, hasardFixe);

    expect(champ.points.length).toBe(58);
    avant.forEach((point, index) => expect(champ.points[index]).toBe(point));
  });
});

describe('CON-03 · un point rejoint sa place par ressort et apparaît en fondu', () => {
  it('CON-03 · chaque image parcourt 12 % du chemin restant, dans les deux sens', () => {
    const point = { x: 0, y: 100 };

    rapprocher(point, { x: 100, y: 0 }, false);
    expect(point).toEqual({ x: 12, y: 88 });

    rapprocher(point, { x: 12, y: 88 }, false);
    expect(point).toEqual({ x: 12, y: 88 });
  });

  it('CON-03 · avec « réduire », le point est posé sur sa place exacte', () => {
    const point = { x: 0.1, y: 100 };

    rapprocher(point, { x: 0.3, y: -7.25 }, true);

    expect(point).toEqual({ x: 0.3, y: -7.25 });
  });

  it('CON-03 · avec « réduire », le fondu est instantané ; sinon il dure le temps de l image', () => {
    expect(dureeDuFondu(2, true)).toBe(Infinity);
    expect(dureeDuFondu(0, true)).toBe(Infinity);
    expect(dureeDuFondu(2, false)).toBe(2);
  });

  it('CON-03 · une partante s efface en 400 ms puis quitte la liste ; une arrivante reste', () => {
    const partante = { opacite: 1, cible: 0 };
    const arrivante = { opacite: 0, cible: 1 };

    expect(fondreLesPartants([partante, arrivante], 0.2)).toEqual([partante, arrivante]);
    expect(partante.opacite).toBe(0.5);
    expect(fondreLesPartants([partante, arrivante], 0.2)).toEqual([arrivante]);
    expect(fondreLesPartants([], 0.2)).toEqual([]);
  });

  for (const [opacite, cible, secondes, attendue] of [
    [0, 1, 0.1, 0.25],
    [0, 1, 0.4, 1],
    [0.9, 1, 0.4, 1],
    [1, 0, 0.2, 0.5],
    [0.1, 0, 0.4, 0],
    [0.5, 0.5, 1, 0.5],
    [0, 1, Infinity, 1],
  ]) {
    it(`CON-03 · opacité ${opacite} vers ${cible} en ${secondes} s → ${attendue}, sans dépasser la cible`, () => {
      const point = { opacite, cible };

      fondre(point, secondes);

      expect(point.opacite).toBe(attendue);
    });
  }
});
