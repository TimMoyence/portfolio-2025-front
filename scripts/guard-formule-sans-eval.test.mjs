import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const SOURCE = 'src/cours/runtime/core/formula.ts';
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
