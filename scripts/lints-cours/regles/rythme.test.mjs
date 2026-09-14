import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyser } from '../moteur.mjs';
import {
  REGLE_DUREE_COURS,
  REGLE_DUREE_ECRAN,
  REGLE_EXPOSITION,
  REGLE_OUVERTURE_CLOTURE,
  REGLE_RATIO,
  REGLES_RYTHME,
} from './rythme.mjs';

/**
 * @param {Partial<import('../moteur.mjs').Ecran>} [ajouts]
 * @returns {import('../moteur.mjs').Ecran}
 */
const expose = (ajouts = {}) => ({
  id: 'x',
  type: 'fp-text',
  duree: 3,
  interactif: false,
  ...ajouts,
});

/**
 * @param {Partial<import('../moteur.mjs').Ecran>} [ajouts]
 * @returns {import('../moteur.mjs').Ecran}
 */
const agit = (ajouts = {}) => ({ id: 'x', type: 'fp-vote', duree: 3, interactif: true, ...ajouts });

/**
 * @param {readonly import('../moteur.mjs').Ecran[]} ecrans
 * @param {number} [duree]
 * @returns {import('../moteur.mjs').Cours}
 */
const cours = (ecrans, duree) => ({
  id: 'B1-09',
  titre: 'Les intérêts composés',
  niveau: 'B1',
  duree: duree ?? ecrans.reduce((total, ecran) => total + (ecran.duree ?? 0), 0),
  concepts: ['capitalisation'],
  ecrans,
});

/**
 * @param {import('../moteur.mjs').Cours} sujet
 * @param {import('../moteur.mjs').Regle} regle
 * @returns {import('../moteur.mjs').Violation[]}
 */
const verdict = (sujet, regle) => analyser(sujet, [regle]);

void test('rythme : REGLES_RYTHME expose les cinq regles de rythme au moteur', () => {
  assert.deepEqual(
    REGLES_RYTHME.map((regle) => regle.id),
    ['exposition-continue', 'ratio-interaction', 'ouverture-cloture', 'duree-ecran', 'duree-cours'],
  );
});

void test('exposition : sept minutes d exposition consecutive sont signalees avec les deux nombres', () => {
  const sujet = cours([expose({ id: 'e1', duree: 4 }), expose({ id: 'e2', duree: 3 })]);
  const violations = verdict(sujet, REGLE_EXPOSITION);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e1');
  assert.match(violations[0].raison, /7 min/);
  assert.match(violations[0].raison, /6 min/);
  assert.match(violations[0].raison, /e1/);
  assert.match(violations[0].raison, /e2/);
});

void test('exposition : six minutes exactement d exposition consecutive passent', () => {
  const sujet = cours([expose({ id: 'e1', duree: 3 }), expose({ id: 'e2', duree: 3 })]);
  assert.deepEqual(verdict(sujet, REGLE_EXPOSITION), []);
});

void test('exposition : un ecran interactif coupe le bloc et remet le compteur a zero', () => {
  const sujet = cours([
    expose({ id: 'e1', duree: 6 }),
    agit({ id: 'e2', duree: 2 }),
    expose({ id: 'e3', duree: 6 }),
  ]);
  assert.deepEqual(verdict(sujet, REGLE_EXPOSITION), []);
});

void test('exposition : deux blocs trop longs sont signales separement', () => {
  const sujet = cours([
    expose({ id: 'e1', duree: 7 }),
    agit({ id: 'e2', duree: 2 }),
    expose({ id: 'e3', duree: 9 }),
  ]);
  const violations = verdict(sujet, REGLE_EXPOSITION);
  assert.deepEqual(
    violations.map((violation) => violation.ecran),
    ['e1', 'e3'],
  );
  assert.match(violations[1].raison, /9 min/);
});

void test('ratio : un ratio de 0,30 exactement passe', () => {
  const sujet = cours([agit({ id: 'e1', duree: 30 }), expose({ id: 'e2', duree: 100 })]);
  assert.deepEqual(verdict(sujet, REGLE_RATIO), []);
});

void test('ratio : un ratio de 0,29 est signale et le message donne les deux durees', () => {
  const sujet = cours([agit({ id: 'e1', duree: 29 }), expose({ id: 'e2', duree: 100 })]);
  const violations = verdict(sujet, REGLE_RATIO);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, null);
  assert.match(violations[0].raison, /29 min/);
  assert.match(violations[0].raison, /100 min/);
  assert.match(violations[0].raison, /0,29/);
  assert.match(violations[0].raison, /0,30/);
});

void test('ratio : un cours entierement interactif passe sans division par zero', () => {
  const sujet = cours([agit({ id: 'e1', duree: 10 }), agit({ id: 'e2', duree: 10 })]);
  assert.deepEqual(verdict(sujet, REGLE_RATIO), []);
});

void test('ratio : un cours sans aucun ecran est signale au lieu de diviser par zero', () => {
  const violations = verdict(cours([], 30), REGLE_RATIO);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /aucun écran/);
});

void test('ratio : un cours de duree totale nulle est signale au lieu de diviser par zero', () => {
  const sujet = cours([expose({ id: 'e1', duree: 0 }), agit({ id: 'e2', duree: 0 })], 30);
  const violations = verdict(sujet, REGLE_RATIO);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /0 minute/);
  assert.doesNotMatch(violations[0].raison, /NaN/);
});

void test('ouverture : un cours qui n ouvre pas par un rappel espace est signale', () => {
  const sujet = cours([agit({ id: 'e1', type: 'fp-vote' }), agit({ id: 'e2', type: 'fp-exit' })]);
  const violations = verdict(sujet, REGLE_OUVERTURE_CLOTURE);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e1');
  assert.match(violations[0].raison, /rappel espacé/);
  assert.match(violations[0].raison, /fp-recall/);
});

void test('cloture : un cours qui ne clot pas par un exit ticket est signale', () => {
  const sujet = cours([agit({ id: 'e1', type: 'fp-recall' }), agit({ id: 'e2', type: 'fp-vote' })]);
  const violations = verdict(sujet, REGLE_OUVERTURE_CLOTURE);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e2');
  assert.match(violations[0].raison, /exit ticket/);
  assert.match(violations[0].raison, /fp-exit/);
});

void test('ouverture et cloture : les deux manques donnent deux messages distincts', () => {
  const sujet = cours([agit({ id: 'e1', type: 'fp-vote' }), agit({ id: 'e2', type: 'fp-vote' })]);
  const violations = verdict(sujet, REGLE_OUVERTURE_CLOTURE);
  assert.equal(violations.length, 2);
  assert.notEqual(violations[0].raison, violations[1].raison);
});

void test('ouverture et cloture : un cours qui ouvre et clot comme il faut passe', () => {
  const sujet = cours([
    agit({ id: 'e1', type: 'fp-recall' }),
    agit({ id: 'e2', type: 'fp-vote' }),
    agit({ id: 'e3', type: 'fp-exit' }),
  ]);
  assert.deepEqual(verdict(sujet, REGLE_OUVERTURE_CLOTURE), []);
});

void test('duree d ecran : un ecran sans duree est signale en le nommant', () => {
  const sujet = cours([
    agit({ id: 'e1', duree: 5 }),
    { id: 'e2', type: 'fp-text', interactif: false },
  ]);
  const violations = verdict(sujet, REGLE_DUREE_ECRAN);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, 'e2');
  assert.match(violations[0].raison, /e2/);
  assert.match(violations[0].raison, /durée/);
});

void test('duree d ecran : un ecran de duree strictement positive passe', () => {
  assert.deepEqual(verdict(cours([agit({ id: 'e1', duree: 1 })]), REGLE_DUREE_ECRAN), []);
});

void test('duree de cours : 214 min declarees pour 200 min annoncees sont signalees avec les deux nombres', () => {
  const sujet = cours([agit({ id: 'e1', duree: 214 })], 200);
  const violations = verdict(sujet, REGLE_DUREE_COURS);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].ecran, null);
  assert.match(violations[0].raison, /214 min déclarées/);
  assert.match(violations[0].raison, /200 min annoncées/);
});

void test('duree de cours : un ecart de 5 % exactement passe', () => {
  assert.deepEqual(verdict(cours([agit({ id: 'e1', duree: 210 })], 200), REGLE_DUREE_COURS), []);
});

void test('duree de cours : un ecart de 5,5 % est signale', () => {
  assert.equal(verdict(cours([agit({ id: 'e1', duree: 211 })], 200), REGLE_DUREE_COURS).length, 1);
});

void test('duree de cours : un ecart de 5 % exactement par defaut passe', () => {
  assert.deepEqual(verdict(cours([agit({ id: 'e1', duree: 190 })], 200), REGLE_DUREE_COURS), []);
});

void test('duree de cours : un ecart de 5,5 % par defaut est signale', () => {
  assert.equal(verdict(cours([agit({ id: 'e1', duree: 189 })], 200), REGLE_DUREE_COURS).length, 1);
});

void test('duree de cours : une duree annoncee nulle est signalee au lieu de servir de diviseur', () => {
  const violations = verdict(cours([agit({ id: 'e1', duree: 10 })], 0), REGLE_DUREE_COURS);
  assert.equal(violations.length, 1);
  assert.match(violations[0].raison, /strictement positi/);
  assert.doesNotMatch(violations[0].raison, /NaN/);
});
