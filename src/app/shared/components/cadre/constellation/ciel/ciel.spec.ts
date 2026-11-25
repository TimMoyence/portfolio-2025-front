import {
  figureDeLaPage,
  figureDeLaSection,
  rayonDeLEtoile,
  sectionActive,
  sommetsDuCiel,
} from './ciel';
import { ANNEAU, type Etoile, type Figure } from './figures';

const enHeures = (heures: number, declinaison: number): Etoile => [heures * 15, declinaison, 2];
const figure = (...etoiles: Etoile[]): Figure => ({ nom: 'essai', etoiles, segments: [] });
const boite = { left: 0, top: 0, width: 1000, height: 400 };
const arrondi = (valeur: number): number => Math.round(valeur * 100) / 100;
const positions = (sommets: readonly { x: number; y: number }[]) =>
  sommets.map(({ x, y }) => [arrondi(x), arrondi(y)]);

describe('CIEL-03 · le tracé complet de d3-celestial, sur l anneau de 16', () => {
  it('CIEL-02 · CIEL-03 · seize figures dans l ordre de l anneau, avec leur nombre d étoiles', () => {
    expect(ANNEAU.map(({ nom, etoiles }) => `${nom} ${etoiles.length}`)).toEqual([
      'Grande Ourse 20',
      'Bouvier 12',
      'Couronne boréale 7',
      'Hercule 17',
      'Lyre 6',
      'Cygne 9',
      'Aigle 8',
      'Dauphin 5',
      'Pégase 14',
      'Cassiopée 5',
      'Persée 23',
      'Cocher 9',
      'Taureau 12',
      'Orion 23',
      'Gémeaux 12',
      'Lion 9',
    ]);
  });

  it('CIEL-03 · chaque segment relie deux étoiles de sa figure, et chaque étoile en porte un', () => {
    for (const { nom, etoiles, segments } of ANNEAU) {
      const reliees = new Set(segments.flat());
      expect([...reliees].every((index) => index >= 0 && index < etoiles.length))
        .withContext(nom)
        .toBeTrue();
      expect(reliees.size).withContext(nom).toBe(etoiles.length);
    }
  });
});

describe('CIEL-03 · la projection : est à gauche, nord en haut, centrée, marge de 10 %', () => {
  it('CIEL-03 · (1 h ; −5°), (0 h ; −5°), (0,5 h ; +5°) dans 1000×400', () => {
    const sommets = sommetsDuCiel(
      figure(enHeures(1, -5), enHeures(0, -5), enHeures(0.5, 5)),
      boite,
    );

    expect(positions(sommets)).toEqual([
      [260, 360],
      [740, 360],
      [500, 40],
    ]);
  });

  it('CIEL-03 · à cheval sur 0 h : (23,5 h ; 0°), (0,5 h ; 0°), (0 h ; +10°), cos 5° appliqué', () => {
    const sommets = sommetsDuCiel(
      figure(enHeures(-0.5, 0), enHeures(0.5, 0), enHeures(0, 10)),
      boite,
    );

    expect(positions(sommets)).toEqual([
      [739.09, 360],
      [260.91, 360],
      [500, 40],
    ]);
  });

  it('CIEL-03 · la Grande Ourse, de part et d autre de ±180°, reste d un seul tenant dans sa boîte', () => {
    const xs = sommetsDuCiel(ANNEAU[0], boite).map(({ x }) => x);

    expect(Math.min(...xs)).toBeGreaterThanOrEqual(40);
    expect(Math.max(...xs)).toBeLessThanOrEqual(960);
  });

  for (const [largeur, hauteur] of [
    [375, 667],
    [1350, 940],
  ]) {
    it(`CIEL-03 · écran ${largeur}×${hauteur} : chaque étoile des 16 figures à la marge du bord`, () => {
      const marge = 0.1 * Math.min(largeur, hauteur);
      for (const uneFigure of ANNEAU) {
        const sommets = sommetsDuCiel(uneFigure, {
          left: 0,
          top: 0,
          width: largeur,
          height: hauteur,
        });
        expect(sommets.length).withContext(uneFigure.nom).toBe(uneFigure.etoiles.length);
        for (const { x, y } of sommets) {
          expect(x)
            .withContext(uneFigure.nom)
            .toBeGreaterThanOrEqual(marge - 1e-9);
          expect(x)
            .withContext(uneFigure.nom)
            .toBeLessThanOrEqual(largeur - marge + 1e-9);
          expect(y)
            .withContext(uneFigure.nom)
            .toBeGreaterThanOrEqual(marge - 1e-9);
          expect(y)
            .withContext(uneFigure.nom)
            .toBeLessThanOrEqual(hauteur - marge + 1e-9);
        }
      }
    });
  }

  it('CIEL-03 · la boîte de la bande décale la figure : même tracé, posé dans la bande', () => {
    const dansLEcran = sommetsDuCiel(ANNEAU[0], boite);
    const dansLaBande = sommetsDuCiel(ANNEAU[0], { ...boite, left: 75, top: 470 });

    expect(positions(dansLaBande)).toEqual(
      positions(dansLEcran.map(({ x, y }) => ({ x: x + 75, y: y + 470 }))),
    );
  });
});

describe('CIEL-06 · le rayon d une étoile suit sa magnitude', () => {
  for (const [nom, magnitude, rayon] of [
    ['Véga', 0.03, 3.1835],
    ['ε Lyr', 4.59, 1.2],
    ['Rigel', 0.18, 3.101],
    ['Arcturus', -0.05, 3.2275],
  ] as const) {
    it(`CIEL-06 · ${nom} (${magnitude}) → ${rayon} px`, () => {
      expect(rayonDeLEtoile(magnitude)).toBeCloseTo(rayon, 6);
    });
  }

  it('CIEL-06 · une étoile projetée porte le rayon de sa magnitude', () => {
    const lyre = sommetsDuCiel(ANNEAU[4], boite);

    expect(lyre.map(({ rayon }) => arrondi(rayon))).toEqual([1.2, 1.2, 3.18, 1.2, 1.41, 1.26]);
  });
});

describe('CIEL-01 · CIEL-02 · la figure de la page et de la section', () => {
  for (const [url, attendu] of [
    ['/', 0],
    ['/offer', 13],
    ['/projets', 9],
    ['/presentation', 4],
    ['/articles', 5],
    ['/articles/recit-du-matin', 10],
    ['/offer?utm_source=x#formules', 13],
    ['/?utm_source=x', 0],
    ['/contact', undefined],
    ['/projets/atlantic-bike', undefined],
    ['/articles/un/deux', undefined],
  ] as const) {
    it(`CIEL-01 · ${url} → ${attendu === undefined ? 'aucune figure' : ANNEAU[attendu].nom}`, () => {
      expect(figureDeLaPage(url)).toBe(attendu);
    });
  }

  const suite = (page: number, sections: number, bande: number): string[] =>
    Array.from(
      { length: sections },
      (_, section) => ANNEAU[figureDeLaSection(page, section, bande)].nom,
    );

  it('CIEL-02 · accueil, 8 sections, bande en 7', () => {
    expect(suite(0, 8, 7)).toEqual([
      'Cassiopée',
      'Persée',
      'Cocher',
      'Taureau',
      'Orion',
      'Gémeaux',
      'Lion',
      'Grande Ourse',
    ]);
  });

  it('CIEL-02 · /offer, 8 sections, bande en 7', () => {
    expect(suite(13, 8, 7)).toEqual([
      'Aigle',
      'Dauphin',
      'Pégase',
      'Cassiopée',
      'Persée',
      'Cocher',
      'Taureau',
      'Orion',
    ]);
  });

  it('CIEL-02 · /presentation, 7 sections, bande en 6', () => {
    expect(suite(4, 7, 6)).toEqual([
      'Gémeaux',
      'Lion',
      'Grande Ourse',
      'Bouvier',
      'Couronne boréale',
      'Hercule',
      'Lyre',
    ]);
  });

  it('CIEL-02 · /articles : la newsletter après la bande porte la figure suivante', () => {
    expect(suite(5, 4, 2)).toEqual(['Hercule', 'Lyre', 'Cygne', 'Aigle']);
  });

  it('CIEL-02 · article à 3 parties : édito, parties, bande, newsletter', () => {
    expect(suite(10, 6, 4)).toEqual([
      'Aigle',
      'Dauphin',
      'Pégase',
      'Cassiopée',
      'Persée',
      'Cocher',
    ]);
  });
});

describe('CIEL-01 · la section active : la dernière dont le haut a passé le milieu', () => {
  for (const [hauts, attendu] of [
    [[100, 470, 900], 1],
    [[100, 471, 900], 0],
    [[-2000, 300, 900], 1],
    [[500, 900], 0],
  ] as const) {
    it(`CIEL-01 · milieu 470, hauts ${hauts.join(', ')} → section ${attendu}`, () => {
      expect(sectionActive(hauts, 470)).toBe(attendu);
    });
  }
});
