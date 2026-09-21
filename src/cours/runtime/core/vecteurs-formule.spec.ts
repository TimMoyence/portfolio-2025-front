import type { CodeErreur, Feuille, ResultatFormule } from './formula';
import { evaluerExpression, evaluerFeuille, formeR1C1 } from './formula';
import fichierBrut from './formule.vecteurs.json';
import {
  empreinteDesVecteurs,
  serialiserCanonique,
  type FichierVecteursFormule,
  type VecteurFormule,
} from './vecteurs-formule';

const EMPREINTE_PARTAGEE_AVEC_LE_BACK =
  'd95119feb3e14213f2c0675a4977b1e18cc15a4333540214ba7f79fa4f8fed66';

const FICHIER = fichierBrut as FichierVecteursFormule;

const TYPES_DE_VECTEUR: readonly VecteurFormule['type'][] = ['feuille', 'expression', 'r1c1'];

function codesErreurDe(valeur: unknown): readonly string[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap(codesErreurDe);
  }
  if (typeof valeur !== 'object' || valeur === null) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, contenu]) =>
    cle === 'erreur' && typeof contenu === 'string' ? [contenu] : codesErreurDe(contenu),
  );
}

describe('serialiserCanonique', () => {
  it('trie les cles de chaque objet, a toute profondeur', () => {
    expect(serialiserCanonique({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      '{"a":{"c":null,"d":[2,1]},"b":1}',
    );
  });

  it('ordonne les cles par unites de code, independamment de la locale', () => {
    expect(serialiserCanonique({ a: 1, B: 2, É: 3 })).toBe('{"B":2,"a":1,"É":3}');
  });

  it('garde l ordre des tableaux et n ajoute aucun blanc', () => {
    expect(serialiserCanonique([{ z: 'é', y: -3 }, 'x', true])).toBe('[{"y":-3,"z":"é"},"x",true]');
  });

  it('refuse une valeur que JSON ne represente pas', () => {
    expect(() => serialiserCanonique({ a: undefined })).toThrowError(
      'Valeur non sérialisable dans un vecteur de formule',
    );
    expect(() => serialiserCanonique(Number.NaN)).toThrowError(
      'Valeur non sérialisable dans un vecteur de formule',
    );
  });
});

describe('empreinteDesVecteurs', () => {
  it('est le SHA-256 hexadecimal de la serialisation canonique', async () => {
    expect(await empreinteDesVecteurs([])).toBe(
      '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    );
  });
});

describe('formule.vecteurs.json, copie du back', () => {
  it('porte l empreinte de ses propres vecteurs', async () => {
    expect(await empreinteDesVecteurs(FICHIER.vecteurs)).toBe(FICHIER.sha256);
  });

  it('porte l empreinte du fichier canonique du back', () => {
    expect(FICHIER.sha256).toBe(EMPREINTE_PARTAGEE_AVEC_LE_BACK);
  });

  it('n a que des vecteurs types et d identifiants uniques', () => {
    const identifiants = FICHIER.vecteurs.map((vecteur) => vecteur.id);

    expect(FICHIER.version).toBe(1);
    expect(new Set(identifiants).size).toBe(identifiants.length);
    expect(FICHIER.vecteurs.every((vecteur) => TYPES_DE_VECTEUR.includes(vecteur.type))).toBeTrue();
  });

  it('couvre les trois familles de vecteurs avec les exemples du document', () => {
    const feuille: Feuille = { lignes: 1, colonnes: 2, cellules: { A1: '=B1', B1: '=A1' } };
    const cycle = { valeur: null, erreur: '#REF!' } satisfies ResultatFormule;
    const erreurs: CodeErreur[] = ['#REF!', '#DIV/0!', '#NOM?', '#VALEUR!'];
    const attendus: VecteurFormule[] = [
      {
        id: 'feuille-cycle-deux-maillons',
        type: 'feuille',
        entree: feuille,
        attendu: { A1: cycle, B1: cycle },
      },
      {
        id: 'expression-puissance-associative-a-gauche',
        type: 'expression',
        entree: { expression: '2^3^2', variables: {} },
        attendu: { valeur: 64, erreur: null },
      },
      {
        id: 'r1c1-part-figee-e2',
        type: 'r1c1',
        entree: { formule: '=C2/$C$5', cellule: 'E2' },
        attendu: '=RC[-2]/R5C3',
      },
    ];

    for (const attendu of attendus) {
      expect(FICHIER.vecteurs).toContain(attendu);
    }

    const codesServis = [...new Set(codesErreurDe(FICHIER.vecteurs))];

    expect(codesServis).not.toHaveSize(0);
    expect(codesServis.filter((code) => !erreurs.includes(code as CodeErreur))).toEqual([]);
    expect(codesServis).toContain(cycle.erreur);
  });
});

function executer(vecteur: VecteurFormule): unknown {
  switch (vecteur.type) {
    case 'feuille':
      return Object.fromEntries(evaluerFeuille(vecteur.entree));
    case 'expression':
      return evaluerExpression(vecteur.entree.expression, vecteur.entree.variables);
    case 'r1c1':
      return formeR1C1(vecteur.entree.formule, vecteur.entree.cellule);
  }
}

describe('parité du moteur de formules avec les vecteurs signés du back', () => {
  for (const vecteur of FICHIER.vecteurs) {
    it(`${vecteur.type} ${vecteur.id} donne le résultat du moteur canonique`, () => {
      expect(executer(vecteur)).toEqual(vecteur.attendu);
    });
  }
});
