import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { analyser, PORTE, REGLES } from '../moteur.mjs';
import {
  COUPLES_FEUILLE,
  contraste,
  creerRegleContraste,
  creerRegleRendus,
  REGLES_BRIQUES,
} from './briques.mjs';

const FEUILLE = 'src/cours/runtime/design/styles.ts';

const TEAL = '#4fb3a2';
const CREME = '#fffaf2';
const OR_PROFOND = '#8a5f14';
const OR_FOND = '#fdf4e3';
const ENCRE_DOUCE = '#3c3529';

/**
 * @returns {import('../moteur.mjs').Cours}
 */
const coursQuelconque = () => ({
  id: 'B1-09',
  titre: 'Le compte de résultat',
  niveau: 'B1',
  duree: 10,
  concepts: [],
  ecrans: [{ id: 'e1', type: 'fp-recall', duree: 10, interactif: true }],
});

/**
 * @param {string} nom
 * @param {Record<string, string>} rendus
 * @returns {{ nom: string, rendre: (mode: string) => string }}
 */
const brique = (nom, rendus) => ({ nom, rendre: (mode) => rendus[mode] });

/**
 * @param {import('../moteur.mjs').Regle} regle
 * @returns {import('../moteur.mjs').Manquement[]}
 */
const manquements = (regle) => regle.controler(coursQuelconque());

/**
 * @param {import('../moteur.mjs').Manquement[]} rendus
 * @returns {string}
 */
const raisons = (rendus) => rendus.map((manquement) => manquement.raison).join('\n');

void test('rendus : une brique dont les trois modes different ne rend aucun manquement', () => {
  const regle = creerRegleRendus([
    brique('fp-quote', { stage: '<h1>grand</h1>', hand: '<p>carte</p>', board: '<p>tableau</p>' }),
  ]);
  assert.deepEqual(manquements(regle), []);
});

void test('rendus : une brique dont stage et board coincident est signalee en nommant les deux modes', () => {
  const regle = creerRegleRendus([
    brique('fp-quote', {
      stage: '<p>identique</p>',
      hand: '<p>carte</p>',
      board: '<p>identique</p>',
    }),
  ]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, 'fp-quote');
  assert.match(trouves[0].raison, /stage/);
  assert.match(trouves[0].raison, /board/);
  assert.doesNotMatch(trouves[0].raison, /« hand »/);
});

void test('rendus : une brique dont hand et board coincident nomme ces deux modes et pas stage', () => {
  const regle = creerRegleRendus([
    brique('fp-pulse', { stage: '<h1>grand</h1>', hand: '<p>pareil</p>', board: '<p>pareil</p>' }),
  ]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, /hand/);
  assert.match(trouves[0].raison, /board/);
  assert.doesNotMatch(trouves[0].raison, /« stage »/);
});

void test('rendus : une brique dont les trois modes coincident signale les trois couples', () => {
  const regle = creerRegleRendus([
    brique('fp-plot', { stage: '<p>un seul</p>', hand: '<p>un seul</p>', board: '<p>un seul</p>' }),
  ]);
  assert.equal(manquements(regle).length, 3);
});

void test('rendus : une brique dont les trois modes rendent le vide est signalee', () => {
  const regle = creerRegleRendus([brique('fp-muette', { stage: '', hand: '', board: '' })]);
  assert.equal(manquements(regle).length, 3);
});

void test('rendus : seule la brique fautive est nommee parmi plusieurs briques du catalogue', () => {
  const regle = creerRegleRendus([
    brique('fp-quote', { stage: 'a', hand: 'b', board: 'c' }),
    brique('fp-plot', { stage: 'd', hand: 'e', board: 'd' }),
    brique('fp-exit', { stage: 'f', hand: 'g', board: 'h' }),
  ]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, 'fp-plot');
});

void test('PLANCHER ANTI-VACUITE : un catalogue de briques vide rend un manquement citant la porte', () => {
  const trouves = manquements(creerRegleRendus([]));
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, new RegExp(PORTE));
});

void test('PLANCHER ANTI-VACUITE : une brique sans rendu rend un manquement citant la porte', () => {
  const trouves = manquements(creerRegleRendus([{ nom: 'fp-vide' }]));
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, new RegExp(`${PORTE}.*fp-vide`));
});

void test('PLANCHER ANTI-VACUITE : un rendu non textuel rend un manquement citant la porte et le mode', () => {
  const regle = creerRegleRendus([{ nom: 'fp-objet', rendre: () => ({}) }]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, new RegExp(`${PORTE}.*fp-objet`));
  assert.match(trouves[0].raison, /stage/);
});

void test('contraste : deux couleurs reelles de la feuille sous 4,5:1 sont signalees en theme normal', () => {
  const regle = creerRegleContraste([
    { usage: 'sarcelle sur creme', texte: TEAL, fond: CREME, theme: 'normal' },
  ]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, null);
  assert.match(trouves[0].raison, /2,43/);
  assert.match(trouves[0].raison, /4,50/);
});

void test('contraste : un couple reel de la feuille au-dessus de 4,5:1 passe en theme normal', () => {
  const regle = creerRegleContraste([
    { usage: 'etat a-revoir', texte: OR_PROFOND, fond: OR_FOND, theme: 'normal' },
  ]);
  assert.deepEqual(manquements(regle), []);
});

void test('contraste : le meme couple reel passe en theme normal et est signale en theme stage', () => {
  const couple = { usage: 'etat a-revoir', texte: OR_PROFOND, fond: OR_FOND };
  assert.deepEqual(manquements(creerRegleContraste([{ ...couple, theme: 'normal' }])), []);
  const trouves = manquements(creerRegleContraste([{ ...couple, theme: 'stage' }]));
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, /stage/);
  assert.match(trouves[0].raison, /5,16/);
  assert.match(trouves[0].raison, /7,00/);
});

void test('contraste : un couple reel sous 7:1 mais au-dessus de 4,5:1 passe hors du theme stage', () => {
  const regle = creerRegleContraste([
    { usage: 'etat en-attente', texte: '#756c5d', fond: CREME, theme: 'normal' },
  ]);
  assert.deepEqual(manquements(regle), []);
});

void test('contraste : les couples reels de la feuille tiennent tous leur seuil', () => {
  const trouves = manquements(creerRegleContraste(COUPLES_FEUILLE));
  assert.deepEqual(trouves, [], raisons(trouves));
});

void test('contraste : chaque couleur mesuree figure litteralement dans la feuille de style', () => {
  const feuille = readFileSync(FEUILLE, 'utf8');
  assert.ok(COUPLES_FEUILLE.length > 0, `${PORTE} : aucun couple à mesurer.`);
  for (const couple of COUPLES_FEUILLE) {
    assert.ok(feuille.includes(couple.texte), `${couple.texte} absent de ${FEUILLE}`);
    assert.ok(feuille.includes(couple.fond), `${couple.fond} absent de ${FEUILLE}`);
  }
});

void test('contraste : le ratio mesure est celui de la formule WCAG', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contraste('#ffffff', '#000000').toFixed(2), '21.00');
  assert.equal(contraste(ENCRE_DOUCE, CREME).toFixed(2), '11.66');
});

void test('PLANCHER ANTI-VACUITE : une palette de couleurs vide rend un manquement citant la porte', () => {
  const trouves = manquements(creerRegleContraste([]));
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, new RegExp(PORTE));
});

void test('PLANCHER ANTI-VACUITE : une couleur illisible rend un manquement citant la porte', () => {
  const regle = creerRegleContraste([
    { usage: 'couple casse', texte: 'sarcelle', fond: CREME, theme: 'normal' },
  ]);
  const trouves = manquements(regle);
  assert.equal(trouves.length, 1);
  assert.match(trouves[0].raison, new RegExp(`${PORTE}.*sarcelle`));
});

void test('table : la regle de contraste est livree dans la table du moteur', () => {
  assert.deepEqual(
    REGLES_BRIQUES.map((regle) => regle.id),
    ['contraste-insuffisant'],
  );
  assert.ok(REGLES.some((regle) => regle.id === 'contraste-insuffisant'));
});

void test('table : la regle de contraste livree ne signale rien sur un cours quelconque', () => {
  const violations = analyser(coursQuelconque(), REGLES).filter(
    (violation) => violation.regle === 'contraste-insuffisant',
  );
  assert.deepEqual(violations, []);
});

void test('moteur : une regle de rendus indistincts rend une violation qui nomme la regle et la brique', () => {
  const regle = creerRegleRendus([brique('fp-plot', { stage: 'x', hand: 'y', board: 'x' })]);
  const violations = analyser(coursQuelconque(), [regle]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].regle, 'rendus-indistincts');
  assert.equal(violations[0].ecran, 'fp-plot');
});
