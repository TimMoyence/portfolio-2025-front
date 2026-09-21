import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';
import { CHEMIN_MOTEUR, RACINE } from './lib/moteur-formules.mjs';

const SOURCE = 'src/cours/runtime/core/formula.ts';
const REGLES = ['no-eval', 'no-implied-eval', 'no-new-func'];
const INTERDITS = [
  /\beval\s*\(/,
  /\bnew\s+Function\b/,
  /\bFunction\s*\(/,
  /\bimport\s*\(/,
  /\brequire\s*\(/,
  /\bsetTimeout\s*\(\s*['"`]/,
  /\bglobalThis\b/,
  /\[\s*['"`][^'"`]*['"`]\s*\]\s*\(/,
];

const POURQUOI =
  'core/formula.ts evalue une expression tapee par un etudiant : c est une entree non fiable. Un tableur qui execute du JavaScript arbitraire est une faille, pas une fonctionnalite. L analyseur et l evaluateur restent explicites.';

test('formula.ts n appelle aucune construction qui executerait la saisie comme du code', () => {
  const contenu = readFileSync(SOURCE, 'utf8');
  assert.ok(contenu.length > 0, `${SOURCE} est vide : la garde ne garde rien.`);
  for (const motif of INTERDITS) {
    assert.equal(motif.test(contenu), false, `${SOURCE} : « ${motif.source} » trouve. ${POURQUOI}`);
  }
});

test('la garde rougirait si la source contenait une de ces constructions', () => {
  const temoin = 'const calcul = new Function("a", "return a");';
  assert.ok(
    INTERDITS.some((motif) => motif.test(temoin)),
    'aucun motif ne reconnait « new Function » : la garde ne garde rien.',
  );
});

/**
 * @param {unknown} niveau
 * @returns {string}
 */
function severite(niveau) {
  const valeur = Array.isArray(niveau) ? niveau[0] : niveau;
  return valeur === 2 || valeur === 'error' ? 'error' : String(valeur);
}

test('eslint interdit eval et new Function sur le moteur de formules', async () => {
  const eslint = new ESLint({ cwd: RACINE });

  const config = await eslint.calculateConfigForFile(join(RACINE, CHEMIN_MOTEUR));

  for (const regle of REGLES) {
    assert.equal(
      severite(config.rules?.[regle]),
      'error',
      `la regle ${regle} n est pas en error sur ${SOURCE}. ${POURQUOI}`,
    );
  }
});

test('les trois regles signalent bien une construction de code', async () => {
  const eslint = new ESLint({
    cwd: RACINE,
    overrideConfigFile: true,
    overrideConfig: {
      languageOptions: { globals: { setTimeout: 'readonly' } },
      rules: Object.fromEntries(REGLES.map((regle) => [regle, 2])),
    },
  });

  const [resultat] = await eslint.lintText(
    'eval("1+1");\nnew Function("return 1");\nsetTimeout("x()", 1);\n',
    { filePath: join(RACINE, 'moteur-virtuel.js') },
  );

  assert.deepEqual([...REGLES].sort(), resultat.messages.map((message) => message.ruleId).sort());
});
