import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const DICTIONNAIRE = join(RACINE, 'src/cours/runtime/core/i18n.ts');
const TRADUCTION_EN = join(RACINE, 'src/locale/messages.en.xlf');
const CLES_DE_L_ANNEXE_D = 151;

const POURQUOI_CIBLE =
  "Les briques runtime tournent aussi sur /en : un libellé sans cible anglaise s'y affiche en français, et rien ne le signale hors d'une ligne de build que personne ne relit.";

const POURQUOI_IDENTIFIANT =
  "L'annexe D du document de conception fixe l'identifiant de chaque libellé : @@coursRuntime suivi de la clé en PascalCase. Un identifiant libre rend la traduction introuvable depuis la clé.";

function pascal(cle) {
  return cle
    .split('-')
    .map((morceau) => morceau.charAt(0).toUpperCase() + morceau.slice(1))
    .join('');
}

function entreesDuDictionnaire() {
  const contenu = readFileSync(DICTIONNAIRE, 'utf8');
  return [
    ...contenu.matchAll(/(?:'([a-z0-9-]+)'|([a-z0-9]+)):\s*\(\)\s*=>\s*\$localize`:@@(\w+):/g),
  ].map((trouve) => ({ cle: trouve[1] ?? trouve[2], identifiant: trouve[3] }));
}

function ciblesAnglaises() {
  const contenu = readFileSync(TRADUCTION_EN, 'utf8');
  const cibles = new Map();
  for (const [, id, corps] of contenu.matchAll(/<unit id="([^"]+)">([\s\S]*?)<\/unit>/g)) {
    cibles.set(id, /<target>([\s\S]*?)<\/target>/.exec(corps)?.[1]?.trim() ?? '');
  }
  return cibles;
}

test('le dictionnaire des briques runtime porte au moins les clés de l annexe D', () => {
  const entrees = entreesDuDictionnaire();
  assert.ok(
    entrees.length >= CLES_DE_L_ANNEXE_D,
    `${entrees.length} clé(s) lue(s) dans ${DICTIONNAIRE}, ${CLES_DE_L_ANNEXE_D} attendues au moins.`,
  );
});

test('chaque clé porte l identifiant @@coursRuntime suivi de sa forme PascalCase', () => {
  const fautives = entreesDuDictionnaire().filter(
    ({ cle, identifiant }) => identifiant !== `coursRuntime${pascal(cle)}`,
  );
  assert.deepEqual(
    fautives.map(({ cle, identifiant }) => `${cle} → ${identifiant}`),
    [],
    POURQUOI_IDENTIFIANT,
  );
});

test('chaque libellé runtime a une cible anglaise non vide', () => {
  const cibles = ciblesAnglaises();
  const sansCible = entreesDuDictionnaire()
    .map(({ identifiant }) => identifiant)
    .filter((identifiant) => (cibles.get(identifiant) ?? '') === '');
  assert.deepEqual(sansCible, [], POURQUOI_CIBLE);
});

