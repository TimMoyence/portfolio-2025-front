import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyser, appliquerDerogations, PORTE, REGLES } from './moteur.mjs';

/**
 * @returns {import('./moteur.mjs').Cours}
 */
const coursConforme = () => ({
  id: 'B1-09',
  titre: 'Le compte de résultat',
  niveau: 'B1',
  duree: 30,
  concepts: ['charge', 'produit'],
  ecrans: [
    { id: 'e1', type: 'fp-sheet', duree: 10, interactif: true },
    { id: 'e2', type: 'fp-vote', duree: 10, interactif: true },
    { id: 'e3', type: 'fp-text', duree: 10, interactif: false },
  ],
});

/**
 * @param {string} id
 * @param {{ ecran: string | null, raison: string }[]} rendu
 * @returns {import('./moteur.mjs').Regle}
 */
const regleFigee = (id, rendu) => ({ id, controler: () => rendu });

/**
 * @param {{ regle: string, ecran: string | null, raison: string }[]} violations
 * @returns {string[]}
 */
const reperes = (violations) =>
  violations.map((violation) => `${violation.regle}:${violation.ecran ?? '-'}`);

void test('contrat : le moteur expose analyser, appliquerDerogations et la table REGLES', () => {
  assert.equal(typeof analyser, 'function');
  assert.equal(typeof appliquerDerogations, 'function');
  assert.equal(typeof PORTE, 'string');
  assert.ok(Array.isArray(REGLES));
});

void test('PLANCHER ANTI-VACUITE : analyser sur une table de regles vide leve une erreur citant la porte', () => {
  assert.throws(() => analyser(coursConforme(), []), new RegExp(PORTE));
});

void test('PLANCHER ANTI-VACUITE : la table REGLES livree declare au moins quatre regles', () => {
  assert.ok(
    REGLES.length >= 4,
    `${PORTE} : la table est tombée à ${REGLES.length} règle(s) — une porte sans règle ne garde rien.`,
  );
});

void test('PLANCHER ANTI-VACUITE : chaque regle livree porte un identifiant unique et un controleur', () => {
  const identifiants = REGLES.map((regle) => regle.id);
  assert.equal(new Set(identifiants).size, identifiants.length);
  for (const regle of REGLES) {
    assert.match(regle.id, /^[a-z][a-z0-9-]*$/);
    assert.equal(typeof regle.controler, 'function');
  }
});

void test('PLANCHER ANTI-VACUITE : une regle qui ne rend pas un tableau leve une erreur citant la porte et la regle', () => {
  const muette = { id: 'muette', controler: () => undefined };
  assert.throws(() => analyser(coursConforme(), [muette]), new RegExp(`${PORTE}.*muette`));
});

void test('table : deux regles de meme identifiant levent une erreur citant la porte', () => {
  const table = [regleFigee('doublon', []), regleFigee('doublon', [])];
  assert.throws(() => analyser(coursConforme(), table), new RegExp(`${PORTE}.*doublon`));
});

void test('table : une regle sans controleur leve une erreur citant la porte', () => {
  assert.throws(
    () => analyser(coursConforme(), [{ id: 'sans-controleur' }]),
    new RegExp(`${PORTE}.*sans-controleur`),
  );
});

void test('table : une regle qui rend une raison vide leve une erreur citant la porte et la regle', () => {
  const bavarde = regleFigee('bavarde', [{ ecran: 'e1', raison: '   ' }]);
  assert.throws(() => analyser(coursConforme(), [bavarde]), new RegExp(`${PORTE}.*bavarde`));
});

void test('analyser : un cours conforme ne rend aucune violation', () => {
  assert.deepEqual(analyser(coursConforme(), REGLES), []);
});

void test('analyser : un ecran de duree nulle rend une violation qui nomme la regle, l ecran et la raison', () => {
  const cours = coursConforme();
  cours.ecrans[1] = { ...cours.ecrans[1], duree: 0 };
  const violations = analyser(cours, REGLES).filter(
    (violation) => violation.regle === 'duree-ecran',
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].regle, 'duree-ecran');
  assert.equal(violations[0].ecran, 'e2');
  assert.match(violations[0].raison, /durée/);
  assert.match(violations[0].raison, /e2/);
});

void test('analyser : un cours sans ecran interactif rend une violation globale a ecran nul', () => {
  const cours = coursConforme();
  cours.ecrans = cours.ecrans.map((ecran) => ({ ...ecran, interactif: false }));
  const violations = analyser(cours, REGLES);
  const ratio = violations.find((violation) => violation.regle === 'ratio-interaction');
  assert.ok(ratio, `aucune violation de ratio-interaction dans ${JSON.stringify(violations)}`);
  assert.equal(ratio.ecran, null);
  assert.match(ratio.raison, /interactif/);
});

void test('analyser : un cours sans aucun ecran est signale par le ratio d interaction', () => {
  const violations = analyser({ ...coursConforme(), ecrans: [] }, REGLES);
  const ratio = violations.find((violation) => violation.regle === 'ratio-interaction');
  assert.ok(ratio, `aucune violation de ratio-interaction dans ${JSON.stringify(violations)}`);
  assert.match(ratio.raison, /aucun écran/);
});

void test('analyser : une duree annoncee qui ne vaut pas la somme des ecrans est une violation', () => {
  const violations = analyser({ ...coursConforme(), duree: 45 }, REGLES);
  const duree = violations.find((violation) => violation.regle === 'duree-cours');
  assert.ok(duree, `aucune violation de duree-cours dans ${JSON.stringify(violations)}`);
  assert.equal(duree.ecran, null);
  assert.match(duree.raison, /45/);
  assert.match(duree.raison, /30/);
});

void test('analyser : un ecran de classement est une violation qui nomme cet ecran', () => {
  const cours = coursConforme();
  cours.ecrans[2] = { ...cours.ecrans[2], type: 'classement' };
  const violations = analyser(cours, REGLES);
  const classement = violations.find((violation) => violation.regle === 'classement-public');
  assert.ok(classement, `aucune violation de classement-public dans ${JSON.stringify(violations)}`);
  assert.equal(classement.ecran, 'e3');
});

void test('analyser : les violations de plusieurs regles sont toutes rendues', () => {
  const table = [
    regleFigee('alpha', [{ ecran: 'e1', raison: 'première raison' }]),
    regleFigee('beta', [{ ecran: null, raison: 'seconde raison' }]),
  ];
  assert.deepEqual(analyser(coursConforme(), table), [
    { regle: 'alpha', ecran: 'e1', raison: 'première raison' },
    { regle: 'beta', ecran: null, raison: 'seconde raison' },
  ]);
});

const VIOLATIONS = [
  { regle: 'ratio-interaction', ecran: null, raison: 'trop peu d écrans interactifs' },
  { regle: 'duree-ecran', ecran: 'e2', raison: 'durée nulle' },
];

const TABLE_DE_TEST = [regleFigee('ratio-interaction', []), regleFigee('duree-ecran', [])];

void test('derogation : une derogation justifiee retire exactement la violation de sa regle', () => {
  const restantes = appliquerDerogations(
    VIOLATIONS,
    [{ regle: 'duree-ecran', raison: 'l écran e2 est une transition sans durée propre' }],
    TABLE_DE_TEST,
  );
  assert.deepEqual(reperes(restantes), ['ratio-interaction:-']);
});

const JUSTIFICATIONS_VIDES = [
  { nom: 'raison absente', derogation: { regle: 'duree-ecran' } },
  { nom: 'raison vide', derogation: { regle: 'duree-ecran', raison: '' } },
  { nom: 'raison faite d espaces', derogation: { regle: 'duree-ecran', raison: '   \t  ' } },
  { nom: 'raison non textuelle', derogation: { regle: 'duree-ecran', raison: 42 } },
];

for (const cas of JUSTIFICATIONS_VIDES) {
  void test(`derogation : une ${cas.nom} est elle-meme une violation et la violation d origine reste`, () => {
    const restantes = appliquerDerogations(VIOLATIONS, [cas.derogation], TABLE_DE_TEST);
    assert.deepEqual(reperes(restantes), [
      'ratio-interaction:-',
      'duree-ecran:e2',
      'derogation-sans-justification:-',
    ]);
    const signalee = restantes.at(-1);
    assert.match(signalee.raison, /duree-ecran/);
    assert.match(signalee.raison, /justification/);
  });
}

void test('derogation : une regle inexistante est une violation', () => {
  const restantes = appliquerDerogations(
    VIOLATIONS,
    [{ regle: 'duree-ecrans', raison: 'faute de frappe qui desactiverait la regle en silence' }],
    TABLE_DE_TEST,
  );
  assert.deepEqual(reperes(restantes), [
    'ratio-interaction:-',
    'duree-ecran:e2',
    'derogation-regle-inconnue:-',
  ]);
  assert.match(restantes.at(-1).raison, /duree-ecrans/);
});

void test('derogation : une regle inexistante et sans justification rend les deux violations', () => {
  const restantes = appliquerDerogations(VIOLATIONS, [{ regle: 'inconnue' }], TABLE_DE_TEST);
  assert.deepEqual(reperes(restantes), [
    'ratio-interaction:-',
    'duree-ecran:e2',
    'derogation-regle-inconnue:-',
    'derogation-sans-justification:-',
  ]);
});

void test('derogation : une derogation qui nomme un ecran ne retire que la violation de cet ecran', () => {
  const violations = [
    { regle: 'duree-ecran', ecran: 'e1', raison: 'durée nulle' },
    { regle: 'duree-ecran', ecran: 'e2', raison: 'durée nulle' },
  ];
  const restantes = appliquerDerogations(
    violations,
    [{ regle: 'duree-ecran', ecran: 'e2', raison: 'l écran e2 est une transition' }],
    TABLE_DE_TEST,
  );
  assert.deepEqual(reperes(restantes), ['duree-ecran:e1']);
});

void test('derogation : sans derogation la liste des violations est rendue telle quelle', () => {
  assert.deepEqual(appliquerDerogations(VIOLATIONS, [], TABLE_DE_TEST), VIOLATIONS);
});

void test('derogation : la violation signalee porte l ecran vise par la derogation', () => {
  const restantes = appliquerDerogations(
    VIOLATIONS,
    [{ regle: 'duree-ecran', ecran: 'e2' }],
    TABLE_DE_TEST,
  );
  assert.equal(restantes.at(-1).ecran, 'e2');
});

void test('PLANCHER ANTI-VACUITE : appliquerDerogations sur une table vide leve une erreur citant la porte', () => {
  assert.throws(
    () => appliquerDerogations(VIOLATIONS, [{ regle: 'duree-ecran', raison: 'x' }], []),
    new RegExp(PORTE),
  );
});
