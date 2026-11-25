import { estTenue, liensDesEtapes, sommetsDuContour, traverse } from './formes';

const centres = (...hauteurs: number[]) => hauteurs.map((y, index) => ({ x: 100 * index, y }));

describe('CON-05 (a) · le lien vers une étape est plein quand elle a dépassé 60 % de la fenêtre', () => {
  for (const [hauteurDeLEtape, attendu] of [
    [500, 'plein'],
    [600, 'pointille'],
    [-50, 'plein'],
  ] as const) {
    it(`CON-05 · fenêtre de 1000 px, étape 02 à y = ${hauteurDeLEtape} → lien ${attendu}`, () => {
      expect(liensDesEtapes(centres(100, hauteurDeLEtape), 1000)).toEqual([attendu]);
    });
  }

  it('CON-05 · ordinateur, quatre étapes à y = 550 sur 940 → trois liens pleins', () => {
    expect(liensDesEtapes(centres(550, 550, 550, 550), 940)).toEqual(['plein', 'plein', 'plein']);
  });

  it('CON-05 · chargement à mi-page sur 823 px → 01→02 plein, les autres pointillés', () => {
    expect(liensDesEtapes(centres(100, 400, 700, 1000, 1300), 823)).toEqual([
      'plein',
      'pointille',
      'pointille',
      'pointille',
    ]);
  });
});

describe('CON-05 · une section est tenue quand la moitié de ses sommets est dans la fenêtre', () => {
  it('CON-05 · trois étapes sur cinq visibles → tenue ; deux sur cinq → libre', () => {
    expect(estTenue(centres(100, 400, 700, 1000, 1300), 412, 823)).toBeTrue();
    expect(estTenue(centres(100, 400, 900, 1000, 1300), 412, 823)).toBeFalse();
  });

  it('CON-05 · un sommet sur le bord droit ou bas est hors de la fenêtre', () => {
    expect(estTenue([{ x: 412, y: 10 }], 412, 823)).toBeFalse();
    expect(estTenue([{ x: 0, y: 0 }], 412, 823)).toBeTrue();
  });
});

describe('CON-05 (b) · le contour d une carte : 8 sommets à 12 px hors de sa boîte, en boucle', () => {
  it('CON-05 · carte 300×100 posée en (100, 200)', () => {
    expect(sommetsDuContour({ left: 100, top: 200, width: 300, height: 100 })).toEqual([
      { x: 88, y: 188 },
      { x: 250, y: 188 },
      { x: 412, y: 188 },
      { x: 412, y: 250 },
      { x: 412, y: 312 },
      { x: 250, y: 312 },
      { x: 88, y: 312 },
      { x: 88, y: 250 },
    ]);
  });
});

describe('VOI-01 · un trait coupe un bloc de texte, bord compris', () => {
  const bloc = { left: 100, top: 100, width: 200, height: 50 };
  for (const [cas, depart, arrivee, attendu] of [
    ['le traverse de part en part', { x: 50, y: 125 }, { x: 350, y: 125 }, true],
    ['entre dans le bloc et s y arrête', { x: 50, y: 50 }, { x: 150, y: 120 }, true],
    ['tient tout entier dans le bloc', { x: 120, y: 110 }, { x: 280, y: 140 }, true],
    ['longe le bord du haut', { x: 0, y: 100 }, { x: 400, y: 100 }, true],
    ['touche le coin bas droit', { x: 300, y: 150 }, { x: 400, y: 250 }, true],
    ['passe juste au-dessus', { x: 0, y: 99 }, { x: 400, y: 99 }, false],
    ['s arrête à un pixel du bord gauche', { x: 0, y: 125 }, { x: 99, y: 125 }, false],
    ['frôle le coin haut gauche sans le toucher', { x: 0, y: 99 }, { x: 99, y: 0 }, false],
    ['est un point dans le bloc', { x: 200, y: 120 }, { x: 200, y: 120 }, true],
    ['est un point hors du bloc', { x: 200, y: 160 }, { x: 200, y: 160 }, false],
  ] as const) {
    it(`VOI-01 · un trait qui ${cas} → ${attendu ? 'coupe' : 'ne coupe pas'}`, () => {
      expect(traverse(depart, arrivee, bloc)).toBe(attendu);
    });
  }
});
