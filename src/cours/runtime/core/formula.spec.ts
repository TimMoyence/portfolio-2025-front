import {
  type Feuille,
  decalerFormule,
  evaluerCellule,
  evaluerExpression,
  formaterResultat,
  lettreColonne,
  nomCellule,
  remplirGabarit,
} from './formula';

const GRILLE = { lignes: 12, colonnes: 6 };
const DELAI_MAX_MS = 200;
const IMBRICATIONS = 200;

function feuille(cellules: Readonly<Record<string, string>>): Feuille {
  return { ...GRILLE, cellules };
}

function valeurDe(cellules: Readonly<Record<string, string>>, nom = 'A1'): number | null {
  return evaluerCellule(feuille(cellules), nom).valeur;
}

function erreurDe(cellules: Readonly<Record<string, string>>, nom = 'A1'): string | null {
  return evaluerCellule(feuille(cellules), nom).erreur;
}

function calcul(formule: string): number | null {
  return valeurDe({ A1: formule });
}

function refus(formule: string): string | null {
  return erreurDe({ A1: formule });
}

function approche(formule: string): number {
  return calcul(formule) ?? Number.NaN;
}

describe('core/formula', () => {
  describe('priorite des operateurs et parentheses', () => {
    it('applique la priorite multiplicative avant l addition', () => {
      expect(calcul('=2+3*4')).toBe(14);
      expect(calcul('=2*3+4')).toBe(10);
      expect(calcul('=20-6/3')).toBe(18);
    });

    it('laisse les parentheses renverser la priorite', () => {
      expect(calcul('=(2+3)*4')).toBe(20);
      expect(calcul('=2*(3+4)')).toBe(14);
      expect(calcul('=((2+3)*(4-1))/5')).toBe(3);
    });

    it('eleve a la puissance avant de multiplier et associe a droite', () => {
      expect(calcul('=2*3^2')).toBe(18);
      expect(calcul('=2^3^2')).toBe(512);
      expect(calcul('=-2^2'))
        .withContext('le signe unaire lie plus fort que l exposant, comme dans un tableur')
        .toBe(4);
    });

    it('accepte le nombre decimal a la francaise et le point-virgule des arguments', () => {
      expect(calcul('=1,5+2,25')).toBe(3.75);
      expect(calcul('=SOMME(1,5;2,5)')).toBe(4);
      expect(calcul('=1.5*2')).toBe(3);
    });
  });

  describe('references', () => {
    it('lit une reference relative, absolue et mixte de la meme facon', () => {
      const cellules = { A1: '=B2+$C$1+B$2+$B2', B2: '10', C1: '5' };
      expect(valeurDe(cellules)).toBe(35);
    });

    it('compte une cellule vide pour zero sans rendre d erreur', () => {
      expect(valeurDe({ A1: '=B2+1' })).toBe(1);
      expect(erreurDe({ A1: '=B2+1' })).toBeNull();
      expect(valeurDe({ A1: '=SOMME(B1:B5)' })).toBe(0);
    });

    it('rend #REF! pour une cellule hors de la grille', () => {
      expect(refus('=Z1')).toBe('#REF!');
      expect(refus('=A99')).toBe('#REF!');
      expect(refus('=SOMME(A1:Z1)')).toBe('#REF!');
    });

    it('rend #VALEUR! quand la cellule visee porte du texte', () => {
      expect(erreurDe({ A1: '=B1+1', B1: 'trois' })).toBe('#VALEUR!');
    });

    it('propage l erreur de la cellule visee au lieu de la masquer', () => {
      expect(erreurDe({ A1: '=B1+1', B1: '=1/0' })).toBe('#DIV/0!');
    });

    it('decale les references relatives a la recopie et fige celles ancrees', () => {
      expect(decalerFormule('=B2*$C$1', 1, 0)).toBe('=B3*$C$1');
      expect(decalerFormule('=B$2+$B2', 2, 1)).toBe('=C$2+$B4');
      expect(decalerFormule('=SOMME(B2:B4)', 1, 0)).toBe('=SOMME(B3:B5)');
      expect(decalerFormule('=A1', -1, 0)).toBe('=#REF!');
      expect(decalerFormule('12', 1, 0)).toBe('12');
    });
  });

  describe('references circulaires', () => {
    it('rend #REF! et non une boucle quand une cellule se cite elle-meme', () => {
      const debut = Date.now();
      expect(erreurDe({ A1: '=A1' })).toBe('#REF!');
      expect(erreurDe({ A1: '=A1+1' })).toBe('#REF!');
      expect(Date.now() - debut)
        .withContext('un cycle direct doit etre coupe, pas parcouru')
        .toBeLessThan(DELAI_MAX_MS);
    });

    it('rend #REF! et non une boucle pour un cycle indirect de deux cellules', () => {
      const debut = Date.now();
      expect(erreurDe({ A1: '=B1', B1: '=A1' })).toBe('#REF!');
      expect(Date.now() - debut).toBeLessThan(DELAI_MAX_MS);
    });

    it('rend #REF! et non une boucle pour un cycle indirect de trois cellules', () => {
      const debut = Date.now();
      const cellules = { A1: '=B1+1', B1: '=C1*2', C1: '=A1-3' };
      expect(erreurDe(cellules)).toBe('#REF!');
      expect(erreurDe(cellules, 'B1')).toBe('#REF!');
      expect(Date.now() - debut)
        .withContext('trois cellules qui se citent en rond doivent etre coupees, pas parcourues')
        .toBeLessThan(DELAI_MAX_MS);
    });

    it('ne prend pas un losange sans cycle pour une reference circulaire', () => {
      const cellules = { A1: '=B1+C1', B1: '=D1*2', C1: '=D1*3', D1: '4' };
      expect(valeurDe(cellules)).toBe(20);
      expect(erreurDe(cellules)).toBeNull();
    });
  });

  describe('erreurs nommees', () => {
    it('rend #DIV/0! pour une division par zero, directe ou indirecte', () => {
      expect(refus('=1/0')).toBe('#DIV/0!');
      expect(refus('=0/0')).toBe('#DIV/0!');
      expect(erreurDe({ A1: '=10/B1', B1: '' })).toBe('#DIV/0!');
      expect(refus('=MOYENNE(B1:B2)')).toBeNull();
    });

    it('rend #NOM? pour une fonction inconnue et pour un mot isole', () => {
      expect(refus('=TOTAL(1;2)')).toBe('#NOM?');
      expect(refus('=SUM(1;2)')).toBe('#NOM?');
      expect(refus('=bonjour')).toBe('#NOM?');
    });

    it('rend #VALEUR! pour une expression malformee sans jamais lever', () => {
      expect(refus('=(1+2')).toBe('#VALEUR!');
      expect(refus('=1+2)')).toBe('#VALEUR!');
      expect(refus('=1+')).toBe('#VALEUR!');
      expect(refus('=*3')).toBe('#VALEUR!');
      expect(refus('=1 2')).toBe('#VALEUR!');
      expect(refus('=SOMME(1;)')).toBe('#VALEUR!');
      expect(refus('=B1:B3')).toBe('#VALEUR!');
      expect(refus('=')).toBe('#VALEUR!');
    });

    it('rend #VALEUR! plutot qu un infini quand le calcul deborde', () => {
      expect(refus('=PUISSANCE(10;400)')).toBe('#VALEUR!');
    });
  });

  describe('fonctions francaises', () => {
    const cellules = { B1: '10', B2: '20', B3: '30', C1: '0' };

    it('somme une plage, des arguments et un melange des deux', () => {
      expect(valeurDe({ ...cellules, A1: '=SOMME(B1:B3)' })).toBe(60);
      expect(valeurDe({ ...cellules, A1: '=SOMME(B1;B3;5)' })).toBe(45);
      expect(valeurDe({ ...cellules, A1: '=SOMME(B1:B2;100)' })).toBe(130);
    });

    it('moyenne une plage et rend #DIV/0! sans aucune valeur', () => {
      expect(valeurDe({ ...cellules, A1: '=MOYENNE(B1:B3)' })).toBe(20);
      expect(erreurDe({ ...cellules, A1: '=MOYENNE()' })).toBe('#DIV/0!');
    });

    it('choisit la branche de SI sans evaluer celle qui est ecartee', () => {
      expect(valeurDe({ ...cellules, A1: '=SI(B1>5;1;0)' })).toBe(1);
      expect(valeurDe({ ...cellules, A1: '=SI(B1<5;1;0)' })).toBe(0);
      expect(valeurDe({ ...cellules, A1: '=SI(C1=0;0;B1/C1)' }))
        .withContext('la branche ecartee divise par zero : elle ne doit pas etre calculee')
        .toBe(0);
    });

    it('arrondit au nombre de decimales demande et eleve a la puissance', () => {
      expect(approche('=ARRONDI(3,14159;2)')).toBeCloseTo(3.14, 6);
      expect(calcul('=ARRONDI(1234,5;-2)')).toBe(1200);
      expect(approche('=PUISSANCE(1,05;2)')).toBeCloseTo(1.1025, 6);
      expect(approche('=ARRONDI(PUISSANCE(1,05;10)*1000;2)')).toBeCloseTo(1628.89, 6);
    });

    it('accepte le nom de fonction en minuscules comme un tableur', () => {
      expect(valeurDe({ ...cellules, A1: '=somme(B1:B3)' })).toBe(60);
    });
  });

  describe('entrees hostiles', () => {
    const HOSTILES: readonly [string, string][] = [
      ['=constructor', '#NOM?'],
      ['=process', '#NOM?'],
      ['=alert(1)', '#NOM?'],
      ['=fetch(1)', '#NOM?'],
      ['=require(1)', '#NOM?'],
      ['=__proto__', '#VALEUR!'],
      ['=eval("2+2")', '#VALEUR!'],
      ['=this.constructor', '#VALEUR!'],
      ['=window[0]', '#VALEUR!'],
      ['=1;globalThis', '#VALEUR!'],
      ['=`2+2`', '#VALEUR!'],
      ['=A1.toString()', '#VALEUR!'],
      ['=(function(){})()', '#VALEUR!'],
      ['=1||1', '#VALEUR!'],
      ['=document&&1', '#VALEUR!'],
    ];

    for (const [formule, attendu] of HOSTILES) {
      it(`refuse « ${formule} » et rend ${attendu}`, () => {
        expect(refus(formule)).toBe(attendu);
        expect(valeurDe({ A1: formule })).toBeNull();
      });
    }

    it('n execute pas une formule qui ecrirait un temoin global', () => {
      const portee = globalThis as unknown as Record<string, unknown>;
      delete portee['fpTemoinFormule'];
      expect(refus('=(globalThis.fpTemoinFormule=1)')).toBe('#VALEUR!');
      expect(refus('=fpTemoinFormule')).toBe('#NOM?');
      expect(portee['fpTemoinFormule'])
        .withContext('la formule aurait pose ce temoin si elle avait ete executee comme du code')
        .toBeUndefined();
    });
  });

  describe('robustesse', () => {
    it('evalue 200 parentheses imbriquees sans faire deborder la pile', () => {
      const formule = `=${'('.repeat(IMBRICATIONS)}7${')'.repeat(IMBRICATIONS)}`;
      expect(calcul(formule)).toBe(7);
    });

    it('refuse une imbrication demesuree par une erreur nommee', () => {
      const profonde = `=${'('.repeat(5000)}7${')'.repeat(5000)}`;
      expect(refus(profonde)).toBe('#VALEUR!');
    });

    it('evalue une chaine de 200 cellules qui se citent en cascade', () => {
      const chaine: Record<string, string> = { A1: '1' };
      for (let ligne = 1; ligne < IMBRICATIONS; ligne += 1) {
        chaine[`A${ligne + 1}`] = `=A${ligne}+1`;
      }
      const longue: Feuille = { lignes: IMBRICATIONS, colonnes: 1, cellules: chaine };
      expect(evaluerCellule(longue, `A${IMBRICATIONS}`).valeur).toBe(IMBRICATIONS);
    });
  });

  describe('precision numerique', () => {
    it('garde evaluerCellule en pleine precision flottante, sans arrondi a 6 decimales', () => {
      expect(valeurDe({ A1: '=1/3' })).toBeCloseTo(1 / 3, 15);
    });
  });

  describe('presentation', () => {
    it('nomme les colonnes au-dela de la vingt-sixieme', () => {
      expect(lettreColonne(0)).toBe('A');
      expect(lettreColonne(25)).toBe('Z');
      expect(lettreColonne(26)).toBe('AA');
      expect(nomCellule(1, 2)).toBe('C2');
    });

    it('affiche la virgule decimale francaise et le code d erreur en clair', () => {
      expect(formaterResultat({ valeur: 1234.5, erreur: null })).toBe('1234,5');
      expect(formaterResultat({ valeur: 12, erreur: null })).toBe('12');
      expect(formaterResultat({ valeur: null, erreur: '#DIV/0!' })).toBe('#DIV/0!');
    });
  });

  describe('evaluerExpression', () => {
    it('calcule avec des variables nommees', () => {
      expect(evaluerExpression('prix*(1+taux/100)', { prix: 200, taux: 15 })).toEqual({
        valeur: 230,
        erreur: null,
      });
    });

    it('accepte le signe egal initial et les fonctions du tableur', () => {
      expect(
        evaluerExpression('=ARRONDI(capital*PUISSANCE(1+taux/100;x);2)', {
          capital: 1000,
          taux: 4,
          x: 3,
        }),
      ).toEqual({ valeur: 1124.86, erreur: null });
    });

    it('rend #NOM? pour une variable non fournie et #REF! pour une cellule', () => {
      expect(evaluerExpression('prix*2', {}).erreur).toBe('#NOM?');
      expect(evaluerExpression('A1*2', { A: 1 }).erreur).toBe('#REF!');
    });

    it('ne resout pas une variable heritee du prototype', () => {
      expect(evaluerExpression('constructor+1', {}).erreur).toBe('#NOM?');
    });

    it('laisse le tableur refuser un nom nu', () => {
      expect(
        evaluerCellule({ lignes: 1, colonnes: 1, cellules: { A1: '=prix' } }, 'A1').erreur,
      ).toBe('#NOM?');
    });
  });

  describe('remplirGabarit', () => {
    it('remplace chaque cle connue et garde les autres', () => {
      expect(
        remplirGabarit(
          '{prix} € puis {resultat} € ({absent})',
          { prix: 200, resultat: 230 },
          (valeur) => String(valeur),
        ),
      ).toBe('200 € puis 230 € ({absent})');
    });
  });
});
