import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import {
  analyserCorrige,
  analyserFrontiere,
  estSurfaceCours,
  formatViolations,
  GATE,
  runGuard,
  specifications,
} from './guard-cours-runtime.mjs';

const SOCLE = { 'src/cours/runtime/core/html.ts': "export const a = 1;\n" };

/**
 * @param {Record<string, string>} fichiers
 * @returns {ReturnType<typeof runGuard>}
 */
const garder = (fichiers) => {
  const root = mkdtempSync(join(tmpdir(), 'guard-cours-runtime-'));
  try {
    for (const [relatif, texte] of Object.entries({ ...SOCLE, ...fichiers })) {
      mkdirSync(join(root, dirname(relatif)), { recursive: true });
      writeFileSync(join(root, relatif), texte);
    }
    return runGuard({ root });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

/**
 * @param {ReturnType<typeof runGuard>} resultat
 * @returns {string[]}
 */
const reperes = (resultat) =>
  resultat.violations.map((violation) => `${violation.fichier}:${violation.ligne}:${violation.regle}`);

void test('contrat : le gate expose ses fonctions pures', () => {
  for (const fn of [
    analyserCorrige,
    analyserFrontiere,
    estSurfaceCours,
    formatViolations,
    runGuard,
    specifications,
  ]) {
    assert.equal(typeof fn, 'function');
  }
});

void test('specifications : les quatre formes d import sont lues avec leur ligne', () => {
  const contenu = [
    "import { a } from '@angular/core';",
    "import '@angular/common';",
    "const b = await import('rxjs');",
    "const c = require('zone.js');",
  ].join('\n');
  assert.deepEqual(specifications(contenu), [
    { specification: '@angular/core', ligne: 1 },
    { specification: '@angular/common', ligne: 2 },
    { specification: 'rxjs', ligne: 3 },
    { specification: 'zone.js', ligne: 4 },
  ]);
});

const CONTOURNEMENTS_AD2 = [
  {
    nom: 'import dynamique',
    fichier: 'src/cours/runtime/blocks/FpTriche.ts',
    texte: "export async function charger() {\n  const { inject } = await import('@angular/core');\n}\n",
    ligne: 2,
  },
  {
    nom: 'import a effet de bord',
    fichier: 'src/cours/runtime/blocks/FpTriche.ts',
    texte: "import '@angular/common';\n",
    ligne: 1,
  },
  {
    nom: 'evasion relative vers src/app',
    fichier: 'src/cours/runtime/core/fuite.ts',
    texte: "import { environment } from '../../../app/environments/environment';\n",
    ligne: 1,
  },
  {
    nom: 'require de rxjs',
    fichier: 'src/cours/runtime/core/fuite.ts',
    texte: "const { of } = require('rxjs');\n",
    ligne: 1,
  },
  {
    nom: 'dossier content non scanne',
    fichier: 'src/cours/content/fuite.ts',
    texte: "import { Injectable } from '@angular/core';\n",
    ligne: 1,
  },
];

for (const cas of CONTOURNEMENTS_AD2) {
  void test(`AD-2 : ${cas.nom} sort en code 1`, () => {
    const resultat = garder({ [cas.fichier]: cas.texte });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reperes(resultat), [`${cas.fichier}:${cas.ligne}:AD-2`]);
  });
}

void test('AD-2 : un import relatif qui reste dans src/cours passe', () => {
  const resultat = garder({
    'src/cours/runtime/blocks/FpBlock.ts': "import type { Role } from '../../content/types';\n",
    'src/cours/content/types.ts': 'export type Role = string;\n',
  });
  assert.equal(resultat.code, 0);
});

void test('AD-2 : un spec peut atteindre src/testing, un fichier de production non', () => {
  const chemin = 'src/cours/runtime/core/deck';
  const texte = "import { buildDeckState } from '../../../testing/factories/cours.factory';\n";
  assert.equal(garder({ [`${chemin}.spec.ts`]: texte }).code, 0);
  assert.equal(garder({ [`${chemin}.ts`]: texte }).code, 1);
});

const FUITES_AD4 = [
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'misconception' },
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'correcte' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'solution' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'bareme' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'corrige' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'corrigé' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'barème' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'correction' },
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'bonneReponse' },
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'bonneRéponse' },
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'reponseAttendue' },
  { fichier: 'src/app/features/cours/cours-host.component.ts', terme: 'réponseAttendue' },
];

for (const cas of FUITES_AD4) {
  void test(`AD-4 : « ${cas.terme} » dans ${cas.fichier} sort en code 1`, () => {
    const resultat = garder({ [cas.fichier]: `export const q = {\n  ${cas.terme}: 'x',\n};\n` });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reperes(resultat), [`${cas.fichier}:2:AD-4`]);
  });
}

void test('AD-4 : la forme publique {id, libelle} de la question de demo passe', () => {
  const resultat = garder({
    'src/app/features/cours/cours-host.component.ts':
      "export const Q = { id: 'Q-CAP-03', options: [{ id: 'a', libelle: '1 400 €' }] };\n",
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : un champ de type nomme comme un terme interdit passe sans litteral', () => {
  const resultat = garder({
    'src/cours/content/types.ts':
      'export interface Metadonnees {\n  readonly misconceptionsCiblees: readonly string[];\n}\n',
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : un type litteral qui reprend un terme interdit sort en code 1', () => {
  const resultat = garder({
    'src/cours/content/types.ts': "export type Bareme = 'suffisant' | 'insuffisant';\n",
  });
  assert.equal(resultat.code, 1);
});

void test('AD-4 : un fichier de test garde le droit de porter le corrige', () => {
  const resultat = garder({
    'src/app/features/cours/cours-host.component.spec.ts': "const q = { misconception: null };\n",
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : le reste de src/app n est pas dans le perimetre de la surface cours', () => {
  assert.equal(estSurfaceCours('src/app/features/projets/projets.component.ts'), false);
  assert.equal(estSurfaceCours('src/app/features/cours/cours-host.component.ts'), true);
  assert.equal(estSurfaceCours('src/cours/content/b1-09.ts'), true);
  assert.equal(estSurfaceCours('src/cours/runtime/blocks/FpVote.ts'), false);
});

void test('le verdict nomme le fichier, la ligne et la raison de l interdiction', () => {
  const fichier = 'src/app/features/cours/cours-host.component.ts';
  const resultat = garder({ [fichier]: "const q = {\n  misconception: 'interet simple',\n};\n" });
  const verdict = formatViolations(resultat);
  assert.match(verdict, /cours-host\.component\.ts:2 — \[AD-4\] donnee de correction « misconception »/);
  assert.match(verdict, /misconception: 'interet simple',/);
  assert.match(verdict, /le navigateur de l etudiant telecharge/);
  assert.match(verdict, /2 fichier\(s\) inspecte\(s\), 1 violation\(s\)/);
});

void test('un arbre conforme atteste un nombre de fichiers non nul et sort en code 0', () => {
  const resultat = garder({});
  assert.deepEqual(resultat.violations, []);
  assert.equal(resultat.inspectes, 1);
  assert.equal(formatViolations(resultat), `${GATE}: 1 fichier(s) inspecte(s), 0 violation(s).`);
});

void test('PLANCHER ANTI-VACUITE : un perimetre vide leve une erreur citant le gate', () => {
  const root = mkdtempSync(join(tmpdir(), 'guard-cours-runtime-vide-'));
  try {
    assert.throws(() => runGuard({ root }), /guard-cours-runtime/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
