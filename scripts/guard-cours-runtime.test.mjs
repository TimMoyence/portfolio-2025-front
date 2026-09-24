import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import {
  analyserCorrige,
  analyserFrontiere,
  analyserImportsDuPupitre,
  analyserRevelationEnDur,
  estPupitreFormateur,
  estSurfaceCours,
  formatViolations,
  GATE,
  runGuard,
  specifications,
} from './guard-cours-runtime.mjs';

const SOCLE = { 'src/cours/runtime/core/html.ts': 'export const a = 1;\n' };

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
  resultat.violations.map(
    (violation) => `${violation.fichier}:${violation.ligne}:${violation.regle}`,
  );

void test('contrat : le gate expose ses fonctions pures', () => {
  for (const fn of [
    analyserCorrige,
    analyserFrontiere,
    analyserImportsDuPupitre,
    analyserRevelationEnDur,
    estPupitreFormateur,
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
    texte:
      "export async function charger() {\n  const { inject } = await import('@angular/core');\n}\n",
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

const VUE_ETUDIANT = 'src/app/features/cours/etudiant/cours-etudiant.component.ts';
const ACTIVITE_PARTAGEE = 'src/app/shared/slides/session/slide-activity.component.ts';
const RENDU_VISUEL = 'src/app/shared/slides/visual/slide-visual.component.ts';
const GABARIT_QUIZ = 'src/app/shared/slides/interactions/slide-quiz/slide-quiz.component.html';

const FUITES_AD4 = [
  { fichier: VUE_ETUDIANT, terme: 'misconception' },
  { fichier: VUE_ETUDIANT, terme: 'correcte' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'solution' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'bareme' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'corrige' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'corrigé' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'barème' },
  { fichier: 'src/cours/content/b1-09.ts', terme: 'correction' },
  { fichier: ACTIVITE_PARTAGEE, terme: 'bonneReponse' },
  { fichier: RENDU_VISUEL, terme: 'bonneRéponse' },
  { fichier: GABARIT_QUIZ, terme: 'reponseAttendue' },
];

for (const cas of FUITES_AD4) {
  void test(`AD-4 : « ${cas.terme} » dans ${cas.fichier} sort en code 1`, () => {
    const resultat = garder({ [cas.fichier]: `export const q = {\n  ${cas.terme}: 'x',\n};\n` });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reperes(resultat), [`${cas.fichier}:2:AD-4`]);
  });
}

void test('AD-4 : la forme publique {id, libelle} d une question passe', () => {
  const resultat = garder({
    [RENDU_VISUEL]:
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

void test('AD-4 : un alias de type efface a la compilation passe', () => {
  const resultat = garder({
    'src/cours/content/types.ts': "export type Bareme = 'suffisant' | 'insuffisant';\n",
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : une affectation sans litteral sort en code 1', () => {
  const resultat = garder({
    'src/cours/content/b1-09.ts': 'const q = { misconception: donnees.piege };\n',
  });
  assert.equal(resultat.code, 1);
});

void test('AD-4 : une comparaison qui designe la bonne reponse sort en code 1', () => {
  const resultat = garder({
    'src/app/shared/slides/interactions/slide-quiz/slide-quiz.component.ts':
      'const etat = { correcte: index === 2 };\n',
  });
  assert.equal(resultat.code, 1);
});

const UNION_SUR_PLUSIEURS_LIGNES = [
  'export type RetourBrique =',
  '  | {',
  "      readonly kind: 'verdict-reponse';",
  '      readonly correcte: boolean;',
  '    }',
  "  | { readonly kind: 'deja-repondu'; readonly questionId: string }",
  '  | {',
  "      readonly kind: 'enigmes';",
  '      readonly solution: string;',
  '    };',
].join('\n');

void test('AD-4 : un alias de type ecrit sur plusieurs lignes passe', () => {
  const resultat = garder({
    'src/app/shared/slides/session/contrat-hote.ts': `${UNION_SUR_PLUSIEURS_LIGNES}\n`,
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : la ligne qui suit la fin d un alias sur plusieurs lignes reste inspectee', () => {
  const resultat = garder({
    'src/app/shared/slides/session/contrat-hote.ts': `${UNION_SUR_PLUSIEURS_LIGNES}\n\nconst fuite = { correcte: true };\n`,
  });
  assert.deepEqual(reperes(resultat), ['src/app/shared/slides/session/contrat-hote.ts:12:AD-4']);
});

void test('AD-4 : un alias laisse sans point-virgule ne masque pas la suite du fichier', () => {
  const resultat = garder({
    'src/cours/content/types.ts':
      "export type Bareme =\n  | 'suffisant'\n  | 'insuffisant'\n\nconst fuite = { misconception: piege };\n",
  });
  assert.deepEqual(reperes(resultat), ['src/cours/content/types.ts:5:AD-4']);
});

void test('AD-4 : la ligne qui suit la fermeture de l interface reste inspectee', () => {
  const resultat = garder({
    'src/cours/content/types.ts':
      'export interface Metadonnees {\n  readonly misconceptionsCiblees: readonly string[];\n}\n\nconst fuite = { misconception: piege };\n',
  });
  assert.equal(resultat.code, 1);
  assert.equal(resultat.violations[0].ligne, 5);
});

void test('AD-4 : un fichier de test garde le droit de porter le corrige', () => {
  const resultat = garder({
    'src/app/shared/slides/interactions/slide-quiz/slide-quiz.component.spec.ts':
      'const q = { misconception: null };\n',
  });
  assert.equal(resultat.code, 0);
});

const LIGNE_DU_PUPITRE = 'export const bonne = corrige.bonneReponse;\n';

void test('AD-4 : le pupitre formateur lit le corrige servi au runtime par le deroule authentifie', () => {
  const fichier = 'src/app/features/cours/presentateur/cours-presentateur.component.ts';
  const resultat = garder({ [fichier]: LIGNE_DU_PUPITRE });
  assert.equal(resultat.code, 0);
  assert.equal(resultat.inspectes, 2);
});

const HORS_PUPITRE = [
  VUE_ETUDIANT,
  ACTIVITE_PARTAGEE,
  RENDU_VISUEL,
  'src/cours/content/b1-09.ts',
  'src/app/features/cours/presentateur-bis/fuite.ts',
  'src/app/features/cours/etudiant/presentateur/fuite.ts',
];

for (const fichier of HORS_PUPITRE) {
  void test(`AD-4 : la lecture du corrige reste refusee dans ${fichier}`, () => {
    const resultat = garder({ [fichier]: LIGNE_DU_PUPITRE });
    assert.equal(resultat.code, 1);
    assert.deepEqual([...new Set(reperes(resultat))], [`${fichier}:1:AD-4`]);
  });
}

void test('AD-4 : le reste de src/app n est pas dans le perimetre de la surface cours', () => {
  assert.equal(estSurfaceCours('src/app/features/projets/projets.component.ts'), false);
  assert.equal(estSurfaceCours(VUE_ETUDIANT), true);
  assert.equal(estSurfaceCours('src/cours/content/b1-09.ts'), true);
  assert.equal(estSurfaceCours('src/cours/runtime/blocks/FpVote.ts'), false);
  assert.equal(
    estSurfaceCours('src/app/features/formations/ia-solopreneurs/ia-solopreneurs.component.ts'),
    false,
  );
  assert.equal(estSurfaceCours('src/app/shared/components/navbar/navbar.component.ts'), false);
});

void test('AD-4 : le rendu etudiant partage est dans la surface cours', () => {
  for (const fichier of [ACTIVITE_PARTAGEE, RENDU_VISUEL, GABARIT_QUIZ]) {
    assert.equal(estSurfaceCours(fichier), true, `${fichier} echappe a la garde AD-4`);
  }
});

void test('AD-4 : seul le dossier du pupitre formateur est reconnu comme pupitre', () => {
  assert.equal(
    estPupitreFormateur('src/app/features/cours/presentateur/cours-scene.component.ts'),
    true,
  );
  assert.equal(estPupitreFormateur('src/app/features/cours/presentateur-bis/fuite.ts'), false);
  assert.equal(
    estPupitreFormateur('src/app/features/cours/etudiant/cours-etudiant.component.ts'),
    false,
  );
  assert.equal(estPupitreFormateur('src/cours/content/presentateur/fuite.ts'), false);
});

void test('le verdict nomme le fichier, la ligne et la raison de l interdiction', () => {
  const resultat = garder({
    [RENDU_VISUEL]: "const q = {\n  misconception: 'interet simple',\n};\n",
  });
  const verdict = formatViolations(resultat);
  assert.match(
    verdict,
    /slide-visual\.component\.ts:2 — \[AD-4\] donnee de correction « misconception »/,
  );
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

const IMPORTS_DU_PUPITRE = [
  {
    nom: 'import statique depuis la vue etudiant',
    fichier: 'src/app/features/cours/etudiant/cours-etudiant.component.ts',
    texte:
      "import { CoursPanneauQuestionComponent } from '../presentateur/cours-panneau-question.component';\n",
  },
  {
    nom: 'import dynamique depuis le composant d ecran partage',
    fichier: ACTIVITE_PARTAGEE,
    texte:
      "const pupitre = await import('../../../features/cours/presentateur/cours-presentateur.component');\n",
  },
  {
    nom: 'reexport du dossier du pupitre',
    fichier: 'src/app/features/cours/cours-flux.token.ts',
    texte: "export * from './presentateur';\n",
  },
  {
    nom: 'import a effet de bord depuis un sous-dossier',
    fichier: 'src/app/features/cours/etudiant/vue/fuite.ts',
    texte: "import '../../presentateur/cours-scene.component';\n",
  },
];

for (const cas of IMPORTS_DU_PUPITRE) {
  void test(`AD-4 : ${cas.nom} vers le pupitre formateur sort en code 1`, () => {
    const resultat = garder({ [cas.fichier]: cas.texte });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reperes(resultat), [`${cas.fichier}:1:AD-4`]);
    assert.match(resultat.violations[0].raison, /import du pupitre formateur/);
  });
}

void test('AD-4 : un contenu de cours qui remonte vers le pupitre est refuse par les deux regles', () => {
  const fichier = 'src/cours/content/b1-09.ts';
  const resultat = garder({
    [fichier]:
      "import { corrige } from '../../app/features/cours/presentateur/cours-presentateur.component';\n",
  });
  assert.deepEqual([...new Set(reperes(resultat))].sort(), [
    `${fichier}:1:AD-2`,
    `${fichier}:1:AD-4`,
  ]);
  assert.ok(
    resultat.violations.some((violation) => /import du pupitre formateur/.test(violation.raison)),
  );
});

const IMPORTS_ADMIS = [
  {
    nom: 'le pupitre qui importe son propre dossier',
    fichier: 'src/app/features/cours/presentateur/cours-presentateur.component.ts',
    texte: "import { CoursPanneauQuestionComponent } from './cours-panneau-question.component';\n",
  },
  {
    nom: 'un spec hors du pupitre',
    fichier: 'src/app/features/cours/etudiant/cours-etudiant.component.spec.ts',
    texte: "import { CoursSceneComponent } from '../presentateur/cours-scene.component';\n",
  },
  {
    nom: 'un dossier voisin au nom proche',
    fichier: VUE_ETUDIANT,
    texte: "import { x } from '../presentateur-bis/x';\n",
  },
  {
    nom: 'le pupitre vers le composant d ecran partage',
    fichier: 'src/app/features/cours/presentateur/cours-scene.component.ts',
    texte:
      "import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';\n",
  },
];

for (const cas of IMPORTS_ADMIS) {
  void test(`AD-4 : ${cas.nom} passe`, () => {
    assert.equal(garder({ [cas.fichier]: cas.texte }).code, 0);
  });
}

void test('AD-4 : les routes, hors surface cours, gardent le chargement paresseux du pupitre', () => {
  const resultat = garder({
    [VUE_ETUDIANT]: 'export const a = 1;\n',
    'src/app/app.routes.ts':
      "export const r = () => import('./features/cours/presentateur/cours-presentateur.component');\n",
  });
  assert.equal(resultat.code, 0);
});

const REVELATIONS_EN_DUR = [
  {
    nom: 'une cible de revelation ecrite en dur dans le rendu partage',
    fichier: 'src/app/shared/slides/session/revelation.ts',
    texte: "export const r = { questionId: 'q', cible: '45,5 %', optionId: null };\n",
    ligne: 1,
  },
  {
    nom: 'une annexe de revelation ecrite en dur dans le contenu',
    fichier: 'src/cours/content/b2-01.ts',
    texte: "export const r = {\n  annexe: { type: 'methode', titre: 'Méthode', lignes: [] },\n};\n",
    ligne: 2,
  },
  {
    nom: 'une revelation ecrite en dur dans une page de cours',
    fichier: 'src/app/features/formations/b2-01/page.ts',
    texte: 'export const e = { revelation: [] };\n',
    ligne: 1,
  },
  {
    nom: 'une cible sous une cle citee',
    fichier: 'src/cours/content/b2-01.ts',
    texte: 'export const r = { "cible": "42" };\n',
    ligne: 1,
  },
  {
    nom: 'une cible sous une cle calculee',
    fichier: 'src/cours/content/b2-01.ts',
    texte: "export const r = { ['cible']: '42' };\n",
    ligne: 1,
  },
  {
    nom: 'une cible dont la valeur passe a la ligne',
    fichier: 'src/cours/content/b2-01.ts',
    texte: "export const r = {\n  cible:\n    '42',\n};\n",
    ligne: 2,
  },
  {
    nom: 'une cible ecrite en dur dans une brique du runtime',
    fichier: 'src/cours/runtime/blocks/FpNumeric.ts',
    texte: "export const r = { cible: '42' };\n",
    ligne: 1,
  },
  {
    nom: 'une cible ecrite en dur dans un json de la surface cours',
    fichier: 'src/cours/content/revelations.json',
    texte: '{\n  "cible": "42"\n}\n',
    ligne: 2,
  },
  {
    nom: 'une cible numerique ecrite en dur dans l adaptateur qui construit la revelation',
    fichier: 'src/app/core/adapters/formations-fil.ts',
    texte: 'export const q = { cible: 12, optionId: null };\n',
    ligne: 1,
  },
];

for (const cas of REVELATIONS_EN_DUR) {
  void test(`AD-4 : ${cas.nom} sort en code 1`, () => {
    const resultat = garder({ [cas.fichier]: cas.texte });
    assert.equal(resultat.code, 1);
    assert.deepEqual(reperes(resultat), [`${cas.fichier}:${cas.ligne}:AD-4`]);
    assert.match(resultat.violations[0].raison, /revelation ecrite en dur/);
  });
}

void test('AD-4 : relayer au runtime la revelation servie par le serveur passe', () => {
  const resultat = garder({
    'src/app/shared/slides/session/relais.ts': [
      'export interface Ligne {',
      '  readonly cible: string | null;',
      '}',
      "export const a = (bonne: Record<string, string>) => ({ type: 'cible', cible: bonne['cible'] });",
      'export const b = (ecran: { revelation?: unknown }) => ({ revelation: ecran.revelation ?? null });',
      'export const c = (cibles: Record<string, string>, id: string) => ({ cible: cibles[id] ?? null });',
      "export const e = (cible: string, ok: boolean) => (ok ? cible : '—');",
    ].join('\n'),
    'src/app/core/adapters/formations-fil.ts':
      'export const d = (q: { attendu: string }) => ({ cible: q.attendu, annexe: null });\n',
  });
  assert.deepEqual(reperes(resultat), []);
});

void test('AD-4 : le pupitre formateur peut nommer une cible en dur', () => {
  const resultat = garder({
    'src/app/features/cours/presentateur/cours-exemple.ts': "export const r = { cible: '12' };\n",
  });
  assert.equal(resultat.code, 0);
});

void test('AD-4 : le verdict d une revelation en dur explique le canal runtime', () => {
  const resultat = garder({
    'src/app/shared/slides/session/revelation.ts': "export const r = { cible: '45,5 %' };\n",
  });
  assert.match(formatViolations(resultat), /servi au runtime apres la revelation par le serveur/);
});

void test('PLANCHER ANTI-VACUITE : un perimetre vide leve une erreur citant le gate', () => {
  const root = mkdtempSync(join(tmpdir(), 'guard-cours-runtime-vide-'));
  try {
    assert.throws(() => runGuard({ root }), /guard-cours-runtime/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
