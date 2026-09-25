import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { planterDossier, supprimerDossier } from '../../lib/dossier-temporaire.mjs';
import { PORTE } from '../porte.mjs';
import {
  CLE_CORRIGE,
  EXTENSIONS_INSPECTEES,
  executerCli,
  inspecterSortie,
  verifierSortie,
} from './bundle.mjs';

/** @type {string[]} */
const temporaires = [];

after(() => {
  temporaires.forEach(supprimerDossier);
});

/**
 * @param {Record<string, string>} fichiers
 * @returns {string}
 */
function sortie(fichiers) {
  const racine = planterDossier('lints-cours-bundle-', fichiers);
  temporaires.push(racine);
  return racine;
}

/**
 * @param {string} racine
 * @returns {import('./bundle.mjs').Manquement[]}
 */
function manquements(racine) {
  return verifierSortie(racine).manquements;
}

const RUNTIME_QUI_EFFACE = [
  'const p={id:o.id,enonce:o.enonce,misconception:o.misconception};',
  'const q={...o,misconception:o.misconception??null};',
  "if('misconception' in e){delete e.misconception;}",
  'const bonne=t.options.find((o)=>o.misconception===null)?.id;',
  'export const nettoyer=(o,n)=>({...o,misconception:n});',
  'const s=t?misconception:n;',
].join('\n');

void test('bundle : une valeur en clair dans la sortie est signalee', () => {
  const racine = sortie({ 'main.js': '[{id:"q1",misconception:"interet-simple"}]' });
  const trouves = manquements(racine);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, 'main.js');
  assert.match(trouves[0].raison, /interet-simple/);
});

void test('bundle : une valeur nulle est signalee au meme titre qu une valeur en clair', () => {
  const racine = sortie({ 'main.js': '[{id:"q1",misconception:null}]' });
  const trouves = manquements(racine);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, 'main.js');
  assert.match(trouves[0].raison, new RegExp(`${CLE_CORRIGE}:null`));
});

void test('bundle : la valeur nulle est signalee comme designant la bonne reponse par elimination', () => {
  const racine = sortie({ 'main.js': '[{id:"q1",misconception:null}]' });
  assert.match(manquements(racine)[0].raison, /élimination/);
});

void test('bundle : une valeur indefinie est signalee comme une valeur nulle', () => {
  const racine = sortie({ 'main.js': '[{id:"q1",misconception:undefined}]' });
  assert.equal(manquements(racine).length, 1);
});

void test('bundle : un ternaire qui rend la propriete nest pas confondu avec une valeur litterale', () => {
  const racine = sortie({ 'main.js': 'const s=t?misconception:null;const u=t?o.misconception:0;' });
  assert.deepEqual(manquements(racine), []);
});

void test('bundle : une cle entre guillemets dans un json est signalee', () => {
  const racine = sortie({ 'cours.json': '{"id":"q1", "misconception": null}' });
  assert.equal(manquements(racine).length, 1);
});

void test('bundle : chaque occurrence est signalee separement', () => {
  const racine = sortie({ 'main.js': '[{misconception:null},{misconception:"taux-annuel"}]' });
  assert.equal(manquements(racine).length, 2);
});

void test('bundle : la fuite est cherchee dans les sous repertoires et nommee en chemin relatif', () => {
  const racine = sortie({ 'fr/chunk-a1b2.js': 'x={misconception:null}' });
  const trouves = manquements(racine);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, 'fr/chunk-a1b2.js');
});

void test('bundle : une sortie propre ne rend aucun manquement', () => {
  const racine = sortie({ 'main.js': RUNTIME_QUI_EFFACE });
  assert.deepEqual(manquements(racine), []);
});

void test('bundle : le rapport dune sortie propre atteste des octets inspectes non nuls', () => {
  const racine = sortie({ 'main.js': RUNTIME_QUI_EFFACE });
  const rapport = inspecterSortie(racine);
  assert.equal(rapport.existe, true);
  assert.equal(rapport.fichiers, 1);
  assert.equal(rapport.octets, Buffer.byteLength(RUNTIME_QUI_EFFACE));
  assert.ok(rapport.octets > 0);
});

void test('bundle : les octets attestes couvrent tous les fichiers inspectes', () => {
  const racine = sortie({ 'a.js': 'const a=1;', 'fr/b.json': '{"b":2}' });
  const rapport = inspecterSortie(racine);
  assert.equal(rapport.fichiers, 2);
  assert.equal(rapport.octets, Buffer.byteLength('const a=1;') + Buffer.byteLength('{"b":2}'));
});

void test('bundle : un repertoire de sortie inexistant fait echouer la regle au lieu de rendre un succes vide', () => {
  const racine = join(tmpdir(), 'lints-cours-bundle-absent-0000');
  const trouves = manquements(racine);
  assert.equal(trouves.length, 1);
  assert.equal(trouves[0].ecran, null);
  assert.match(trouves[0].raison, new RegExp(PORTE));
  assert.match(trouves[0].raison, /n'a jamais ouvert/);
});

for (const [repertoire, fichiers] of [
  ['sans fichier inspectable', { 'styles.css': 'body{color:red}' }],
  ['dont les fichiers inspectables sont vides', { 'main.js': '' }],
]) {
  void test(`bundle : un repertoire ${repertoire} fait echouer la regle`, () => {
    const trouves = manquements(sortie(fichiers));
    assert.equal(trouves.length, 1);
    assert.match(trouves[0].raison, /0 octet inspecté/);
  });
}

void test('bundle : un chemin de sortie vide leve en citant la porte', () => {
  assert.throws(() => inspecterSortie(''), new RegExp(PORTE));
  assert.throws(() => inspecterSortie(null), new RegExp(PORTE));
});

void test('bundle : seules les extensions declarees sont lues', () => {
  const racine = sortie({ 'main.js': 'const a=1;', 'notes.md': '{misconception:null}' });
  assert.deepEqual(manquements(racine), []);
  assert.ok(EXTENSIONS_INSPECTEES.includes('.js'));
  assert.equal(EXTENSIONS_INSPECTEES.includes('.md'), false);
});

void test('bundle : le cli rend 1 sur une fuite et 0 sur une sortie propre', () => {
  /** @type {string[]} */
  const lignes = [];
  const fuyante = sortie({ 'main.js': 'x={misconception:null}' });
  const propre = sortie({ 'main.js': RUNTIME_QUI_EFFACE });
  assert.equal(
    executerCli([fuyante], (ligne) => lignes.push(ligne)),
    1,
  );
  assert.equal(
    executerCli([propre], (ligne) => lignes.push(ligne)),
    0,
  );
  assert.match(lignes.join('\n'), /octet\(s\) inspecté\(s\)/);
});
