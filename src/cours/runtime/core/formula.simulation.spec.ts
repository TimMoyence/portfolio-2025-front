import * as fc from 'fast-check';
import type { CodeErreur, Feuille, ResultatFormule } from './formula';
import {
  FeuilleHorsLimitesError,
  NOMBRE_MAX_CELLULES,
  evaluerCellule,
  evaluerExpression,
  evaluerFeuille,
} from './formula';

const GRAINE = 20260920;
const TOURS = 150;
const CODES: readonly CodeErreur[] = ['#REF!', '#DIV/0!', '#NOM?', '#VALEUR!'];
const COLONNES = ['A', 'B', 'C', 'D', 'E'] as const;
const HAUTEUR = 8;
const CENTAINES = 600;
const DECIMALES = 6;

function nomDe(colonne: number, ligne: number): string {
  return `${COLONNES[colonne]}${ligne + 1}`;
}

function estRecevable(resultat: ResultatFormule): boolean {
  return resultat.erreur === null
    ? typeof resultat.valeur === 'number' && Number.isFinite(resultat.valeur)
    : resultat.valeur === null && CODES.includes(resultat.erreur);
}

function tousRecevables(resultats: ReadonlyMap<string, ResultatFormule>): boolean {
  return [...resultats.values()].every(estRecevable);
}

const nombreDeCellule = fc.integer({ min: -100_000, max: 100_000 }).map((entier) => entier / 100);

const formuleGeneree = fc.oneof(
  fc
    .tuple(
      fc.integer({ min: 0, max: COLONNES.length - 1 }),
      fc.integer({ min: 0, max: HAUTEUR - 1 }),
      fc.constantFrom('+', '-', '*', '/', '^', '<', '>=', '<>'),
    )
    .map(([colonne, ligne, signe]) => `=${nomDe(colonne, ligne)}${signe}2`),
  fc
    .tuple(
      fc.constantFrom('SOMME', 'MOYENNE', 'RACINE', 'SI'),
      fc.integer({ min: 0, max: HAUTEUR - 1 }),
      fc.integer({ min: 0, max: HAUTEUR - 1 }),
    )
    .map(([fonction, debut, fin]) => `=${fonction}(A${debut + 1}:A${fin + 1})`),
  fc
    .tuple(fc.integer({ min: 0, max: 9 }), fc.integer({ min: 0, max: 9 }))
    .map(([gauche, droite]) => `=ARRONDI($A$1*${gauche};${droite})`),
);

const contenuGenere = fc.oneof(
  fc.constantFrom('', '   ', 'Canal', 'Total'),
  nombreDeCellule.map((valeur) => String(valeur).replace('.', ',')),
  formuleGeneree,
);

const feuilleGeneree = fc
  .array(
    fc.tuple(
      fc.integer({ min: 0, max: COLONNES.length - 1 }),
      fc.integer({ min: 0, max: HAUTEUR - 1 }),
      contenuGenere,
    ),
    { minLength: 1, maxLength: 40 },
  )
  .map((entrees): Feuille => {
    const cellules: Record<string, string> = {};
    for (const [colonne, ligne, contenu] of entrees) {
      cellules[nomDe(colonne, ligne)] = contenu;
    }
    return { lignes: HAUTEUR, colonnes: COLONNES.length, cellules };
  });

describe('simulation : le moteur de formules borne ce qu il rend', () => {
  it('rend pour chaque cellule remplie une valeur finie ou un code d erreur connu', () => {
    fc.assert(
      fc.property(feuilleGeneree, (feuille) => {
        const resultats = evaluerFeuille(feuille);
        const remplies = Object.values(feuille.cellules).filter(
          (contenu) => contenu.trim().length > 0,
        );

        expect(resultats.size).toBe(remplies.length);
        expect(tousRecevables(resultats)).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('rend deux fois de suite le meme resultat pour la meme feuille', () => {
    fc.assert(
      fc.property(feuilleGeneree, (feuille) => {
        const premier = Object.fromEntries(evaluerFeuille(feuille));
        const second = Object.fromEntries(evaluerFeuille(feuille));

        expect(second).toEqual(premier);
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('donne a chaque cellule prise seule le resultat que la passe complete lui donne', () => {
    fc.assert(
      fc.property(feuilleGeneree, (feuille) => {
        const passe = evaluerFeuille(feuille);

        for (const [nom, attendu] of passe) {
          expect(evaluerCellule(feuille, nom)).toEqual(attendu);
        }
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});

describe('simulation : la somme ne depend ni du decoupage ni de l ordre', () => {
  it('coupe une plage en deux sans changer le total', () => {
    fc.assert(
      fc.property(
        fc.array(nombreDeCellule, { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 1, max: 19 }),
        (valeurs, coupure) => {
          const hauteur = valeurs.length;
          const rupture = Math.min(coupure, hauteur - 1);
          const cellules: Record<string, string> = {};
          valeurs.forEach((valeur, rang) => {
            cellules[`A${rang + 1}`] = String(valeur);
          });
          cellules['B1'] = `=SOMME(A1:A${hauteur})`;
          cellules['B2'] = `=SOMME(A1:A${rupture})+SOMME(A${rupture + 1}:A${hauteur})`;
          cellules['B3'] = `=SOMME(A${hauteur}:A1)`;
          const resultats = evaluerFeuille({ lignes: hauteur + 4, colonnes: 3, cellules });
          const total = resultats.get('B1')?.valeur ?? Number.NaN;

          expect(resultats.get('B2')?.valeur).toBeCloseTo(total, DECIMALES);
          expect(resultats.get('B3')?.valeur).toBeCloseTo(total, DECIMALES);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('arrondit une expression au millionieme sans jamais rendre un infini', () => {
    fc.assert(
      fc.property(nombreDeCellule, nombreDeCellule, (gauche, droite) => {
        const resultat = evaluerExpression('a/b', { a: gauche, b: droite });

        if (droite === 0) {
          expect(resultat.erreur).toBe('#DIV/0!');
          return;
        }
        expect(resultat.erreur).toBeNull();
        expect(Number.isFinite(resultat.valeur ?? Number.NaN)).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});

describe('simulation : cycles et references invalides', () => {
  it('rend #REF! sur chaque maillon d un cycle, quelle que soit sa longueur', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 200 }), (longueur) => {
        const cellules: Record<string, string> = {};
        for (let rang = 1; rang <= longueur; rang += 1) {
          cellules[`A${rang}`] = `=A${(rang % longueur) + 1}+1`;
        }

        const resultats = evaluerFeuille({ lignes: longueur, colonnes: 1, cellules });

        expect(resultats.size).toBe(longueur);
        expect([...resultats.values()].every((resultat) => resultat.erreur === '#REF!')).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('rend #REF! pour toute reference hors de la grille servie', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: HAUTEUR + 1, max: 9999 }),
        fc.constantFrom('F', 'G', 'AA', 'ZZ'),
        (ligne, colonne) => {
          const feuille: Feuille = {
            lignes: HAUTEUR,
            colonnes: COLONNES.length,
            cellules: { A1: `=A${ligne}`, A2: `=${colonne}1`, A3: `=SOMME(A1:${colonne}${ligne})` },
          };

          const resultats = evaluerFeuille(feuille);

          expect([...resultats.values()].map((resultat) => resultat.erreur)).toEqual([
            '#REF!',
            '#REF!',
            '#REF!',
          ]);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });

  it('ne leve jamais sur une formule generee, il rend un code', () => {
    fc.assert(
      fc.property(formuleGeneree, fc.string({ maxLength: 12 }), (formule, bruit) => {
        const feuille: Feuille = {
          lignes: HAUTEUR,
          colonnes: COLONNES.length,
          cellules: { A1: '4', A2: `${formule}${bruit}` },
        };

        expect(tousRecevables(evaluerFeuille(feuille))).toBeTrue();
        expect(estRecevable(evaluerExpression(`${formule}${bruit}`, { a: 1 }))).toBeTrue();
      }),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});

describe('simulation : la borne du nombre de cellules', () => {
  it('evalue plusieurs centaines de cellules et les rend toutes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 200, max: CENTAINES }), (nombre) => {
        const cellules: Record<string, string> = { A1: '3' };
        for (let rang = 2; rang <= nombre; rang += 1) {
          cellules[`A${rang}`] = '=$A$1*2+1';
        }

        const resultats = evaluerFeuille({ lignes: nombre, colonnes: 1, cellules });

        expect(resultats.size).toBe(nombre);
        expect(tousRecevables(resultats)).toBeTrue();
        expect(resultats.get(`A${nombre}`)?.valeur).toBe(7);
      }),
      { seed: GRAINE, numRuns: 20 },
    );
  });

  it('refuse toute feuille qui depasse la borne, sans en evaluer une cellule', () => {
    const cellules: Record<string, string> = {};
    for (let rang = 1; rang <= NOMBRE_MAX_CELLULES + 1; rang += 1) {
      cellules[`A${rang}`] = '=1+1';
    }
    const feuille: Feuille = { lignes: NOMBRE_MAX_CELLULES + 1, colonnes: 1, cellules };

    expect(() => evaluerFeuille(feuille)).toThrowError(FeuilleHorsLimitesError);
    expect(() => evaluerCellule(feuille, 'A1')).toThrowError(FeuilleHorsLimitesError);
  });

  it('refuse toute grille qui n est pas un couple d entiers positifs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -9999, max: -1 }),
          fc.integer({ min: 0, max: 39 }).map((entier) => entier + 0.5),
          fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY),
        ),
        (grille) => {
          expect(() =>
            evaluerFeuille({ lignes: grille, colonnes: 4, cellules: { A1: '1' } }),
          ).toThrowError(FeuilleHorsLimitesError);
          expect(() =>
            evaluerFeuille({ lignes: 4, colonnes: grille, cellules: { A1: '1' } }),
          ).toThrowError(FeuilleHorsLimitesError);
        },
      ),
      { seed: GRAINE, numRuns: TOURS },
    );
  });
});
