import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyser, PORTE } from '../moteur.mjs';
import { creerRegleConcepts, REGLES_INTEGRITE } from './integrite.mjs';

const BANQUE = ['capitalisation', 'valeur-acquise', 'interet-simple'];

/**
 * @param {Partial<import('../moteur.mjs').Cours>} [ajouts]
 * @returns {import('../moteur.mjs').Cours}
 */
const coursNu = (ajouts = {}) => ({
  id: 'B1-09',
  titre: 'Les intérêts composés',
  niveau: 'B1',
  duree: 30,
  concepts: ['capitalisation'],
  ecrans: [],
  ...ajouts,
});

/**
 * @param {string} id
 * @param {Record<string, unknown>} donnees
 * @returns {import('../moteur.mjs').Ecran}
 */
const ecran = (id, donnees) => ({ id, type: 'fp-vote', duree: 5, interactif: true, donnees });

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @param {string} identifiant
 * @returns {import('../moteur.mjs').Violation[]}
 */
const violationsDe = (cours, identifiant) =>
  analyser(cours, REGLES_INTEGRITE).filter((violation) => violation.regle === identifiant);

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @param {readonly string[]} banque
 * @returns {import('../moteur.mjs').Violation[]}
 */
const violationsConcepts = (cours, banque) => analyser(cours, [creerRegleConcepts(banque)]);

void test('integrite : REGLES_INTEGRITE expose des regles utilisables par le moteur', () => {
  assert.ok(Array.isArray(REGLES_INTEGRITE));
  assert.ok(REGLES_INTEGRITE.length >= 2);
  for (const regle of REGLES_INTEGRITE) {
    assert.match(regle.id, /^[a-z][a-z0-9-]*$/);
    assert.equal(typeof regle.controler, 'function');
  }
});

void test('concept : un concept absent de la banque est signale en nommant le concept fautif', () => {
  const violations = violationsConcepts(coursNu({ concepts: ['amortissement'] }), BANQUE);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].regle, 'concept-inconnu');
  assert.equal(violations[0].ecran, null);
  assert.match(violations[0].raison, /amortissement/);
});

void test('concept : un concept present dans la banque ne rend aucune violation', () => {
  assert.deepEqual(violationsConcepts(coursNu({ concepts: ['capitalisation'] }), BANQUE), []);
});

void test('concept : un concept declare par un ecran est verifie et nomme son ecran', () => {
  const cours = coursNu({
    concepts: ['capitalisation'],
    ecrans: [ecran('e1', { concepts: ['actualisation'] })],
  });
  const violations = violationsConcepts(cours, BANQUE);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e1');
  assert.match(violations[0].raison, /actualisation/);
});

void test('concept : un concept declare par un ecran et present dans la banque passe', () => {
  const cours = coursNu({ ecrans: [ecran('e1', { concepts: ['valeur-acquise'] })] });
  assert.deepEqual(violationsConcepts(cours, BANQUE), []);
});

void test('PLANCHER ANTI-VACUITE : une banque de concepts vide est elle-meme une violation', () => {
  const violations = violationsConcepts(coursNu({ concepts: ['capitalisation'] }), []);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /banque/);
  assert.match(violations[0].raison, new RegExp(PORTE));
});

void test('concept : un accent fait deux identifiants distincts et le rapport le dit', () => {
  const violations = violationsConcepts(coursNu({ concepts: ['intérêt-simple'] }), BANQUE);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /intérêt-simple/);
  assert.match(violations[0].raison, /interet-simple/);
  assert.match(violations[0].raison, /distinct/);
});

void test('concept : une majuscule fait deux identifiants distincts et le rapport le dit', () => {
  const violations = violationsConcepts(coursNu({ concepts: ['Capitalisation'] }), BANQUE);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /Capitalisation/);
  assert.match(violations[0].raison, /distinct/);
});

void test('concept : un identifiant sans voisin dans la banque est signale sans parler de casse', () => {
  const violations = violationsConcepts(coursNu({ concepts: ['amortissement'] }), BANQUE);
  assert.doesNotMatch(violations[0].raison, /distinct/);
});

void test('reference : une reference vers une question inexistante est signalee', () => {
  const cours = coursNu({
    ecrans: [
      ecran('e1', { questions: [{ id: 'Q-CAP-03' }] }),
      ecran('e2', { rappel: 'ref:Q-CAP-99' }),
    ],
  });
  const violations = violationsDe(cours, 'reference-inconnue');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e2');
  assert.match(violations[0].raison, /Q-CAP-99/);
});

void test('reference : une reference vers une question declaree passe', () => {
  const cours = coursNu({
    ecrans: [
      ecran('e1', { questions: [{ id: 'Q-CAP-03' }] }),
      ecran('e2', { rappel: 'ref:Q-CAP-03' }),
    ],
  });
  assert.deepEqual(violationsDe(cours, 'reference-inconnue'), []);
});

void test('reference : une reference vers un ecran declare passe', () => {
  const cours = coursNu({ ecrans: [ecran('e1', {}), ecran('e2', { suite: 'ref:e1' })] });
  assert.deepEqual(violationsDe(cours, 'reference-inconnue'), []);
});

void test('reference : un accent fait deux identifiants distincts et le rapport le dit', () => {
  const cours = coursNu({
    ecrans: [
      ecran('e1', { questions: [{ id: 'interet-simple' }] }),
      ecran('e2', { rappel: 'ref:intérêt-simple' }),
    ],
  });
  const violations = violationsDe(cours, 'reference-inconnue');
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /intérêt-simple/);
  assert.match(violations[0].raison, /interet-simple/);
  assert.match(violations[0].raison, /distinct/);
});

void test('reference : toutes les references non resolues d un meme ecran sont signalees', () => {
  const cours = coursNu({
    ecrans: [ecran('e1', { amont: 'ref:Q-1', aval: { profond: ['ref:Q-2'] } })],
  });
  const violations = violationsDe(cours, 'reference-inconnue');
  assert.deepEqual(
    violations.map((violation) => violation.ecran),
    ['e1', 'e1'],
  );
  assert.match(violations[0].raison, /Q-1/);
  assert.match(violations[1].raison, /Q-2/);
});

void test('reference : un cours sans donnees ne rend aucune violation de reference', () => {
  const cours = coursNu({ ecrans: [{ id: 'e1', type: 'fp-text', duree: 5, interactif: false }] });
  assert.deepEqual(violationsDe(cours, 'reference-inconnue'), []);
});

void test('cycle : A qui reference B qui reference A est signale en nommant les deux', () => {
  const cours = coursNu({
    ecrans: [ecran('e1', { suite: 'ref:e2' }), ecran('e2', { suite: 'ref:e1' })],
  });
  const violations = violationsDe(cours, 'reference-circulaire');
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /e1/);
  assert.match(violations[0].raison, /e2/);
});

void test('cycle : une chaine acyclique A vers B vers C ne rend aucune violation', () => {
  const cours = coursNu({
    ecrans: [
      ecran('e1', { suite: 'ref:e2' }),
      ecran('e2', { suite: 'ref:e3' }),
      ecran('e3', { suite: null }),
    ],
  });
  assert.deepEqual(violationsDe(cours, 'reference-circulaire'), []);
});

void test('cycle : une auto-reference est signalee', () => {
  const cours = coursNu({ ecrans: [ecran('e1', { suite: 'ref:e1' })] });
  const violations = violationsDe(cours, 'reference-circulaire');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e1');
});

void test(
  'cycle : une reference circulaire rend la main sous le delai maximal',
  { timeout: 5000 },
  () => {
    const ecrans = Array.from({ length: 200 }, (_, rang) =>
      ecran(`e${rang}`, { suite: `ref:e${(rang + 1) % 200}` }),
    );
    const depart = Date.now();
    const violations = violationsDe(coursNu({ ecrans }), 'reference-circulaire');
    const ecoule = Date.now() - depart;
    assert.ok(violations.length >= 1, 'le cycle de 200 ecrans doit etre signale');
    assert.ok(ecoule < 2000, `la detection a pris ${ecoule} ms : elle boucle au lieu de conclure`);
  },
);
