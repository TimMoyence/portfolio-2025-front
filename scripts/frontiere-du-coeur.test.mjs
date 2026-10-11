import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ESLint } from 'eslint';

import { RACINE } from './lib/depot.mjs';

const FICHIER_DU_COEUR = 'src/app/core/adapters/article-http.adapter.ts';
const REGLES_DE_FRONTIERE = new Set(['no-restricted-imports', 'no-restricted-syntax']);
const eslint = new ESLint({ cwd: RACINE });

async function violationsDeFrontiere(code) {
  const [resultat] = await eslint.lintText(code, { filePath: FICHIER_DU_COEUR });
  return resultat.messages.filter((message) => REGLES_DE_FRONTIERE.has(message.ruleId));
}

const REFUSES = {
  'un import statique de features': "import { X } from '../../features/x';\nexport const y = X;",
  'un import() littéral de shared':
    "export const charger = () => import('../../shared/slides/deck/slide-deck.service');",
  'un import() par gabarit': 'export const charger = () => import(`../../shared/slides/x`);',
  'un import() par concaténation':
    "export const charger = () => import('../../shared' + '/slides/x');",
  'un import() par variable':
    "const chemin = '../ports/x';\nexport const charger = () => import(chemin);",
  'un type importé de shared':
    "export type Deck = import('../../shared/slides/deck/slide-deck.service').SlideDeckService;",
};

for (const [cas, code] of Object.entries(REFUSES)) {
  test(`le core refuse ${cas}`, async () => {
    assert.notDeepEqual(await violationsDeFrontiere(code), []);
  });
}

test('le core garde ses import() littéraux vers lui-même', async () => {
  assert.deepEqual(
    await violationsDeFrontiere("export const charger = () => import('../ports/article.port');"),
    [],
  );
});
