import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
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

const DOSSIER_BRIQUES = join(RACINE, 'src/cours/runtime/blocks');
const ENTRE_DEUX_BALISES = />([^<>`{}]+)</g;
const MOT = /\p{L}{2}/u;

const POURQUOI_EN_DUR =
  "Un texte écrit dans le gabarit d'une brique échappe à $localize : il s'affiche en français sur /en et aucune extraction XLF ne le voit (AC-38).";

const POURQUOI_UN_LIBELLE_PAR_CLE =
  'Chaque clé du dictionnaire porte exactement un $localize : sans quoi la clé et son identifiant ne se correspondent plus.';

const POURQUOI_CLE_INCONNUE =
  "texte(cle) rend la clé brute quand elle manque au dictionnaire : l'étudiant lit un identifiant technique au lieu d'un libellé.";

function sourcesDesBriques() {
  return readdirSync(DOSSIER_BRIQUES)
    .filter((fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.spec.ts'))
    .map((fichier) => ({ fichier, contenu: readFileSync(join(DOSSIER_BRIQUES, fichier), 'utf8') }));
}

function pascal(cle) {
  return cle
    .split('-')
    .map((morceau) => morceau.charAt(0).toUpperCase() + morceau.slice(1))
    .join('');
}

function entreesDuDictionnaire() {
  const contenu = readFileSync(DICTIONNAIRE, 'utf8');
  const cles = [...contenu.matchAll(/^ {2}(?:'([a-z0-9-]+)'|([a-z0-9]+)): \(\) =>/gm)].map(
    (trouve) => trouve[1] ?? trouve[2],
  );
  const identifiants = [...contenu.matchAll(/\$localize`:@@(\w+):/g)].map((trouve) => trouve[1]);
  assert.equal(cles.length, identifiants.length, POURQUOI_UN_LIBELLE_PAR_CLE);
  return cles.map((cle, rang) => ({ cle, identifiant: identifiants[rang] }));
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

test('aucune brique n écrit de texte en dur entre deux balises', () => {
  const sources = sourcesDesBriques();
  const gabarits = sources.flatMap(({ fichier, contenu }) =>
    [...contenu.matchAll(/safeHtml`([^`]*)`/g)].map((trouve) => ({ fichier, gabarit: trouve[1] })),
  );
  const fautes = gabarits.flatMap(({ fichier, gabarit }) =>
    [...gabarit.matchAll(ENTRE_DEUX_BALISES)]
      .map((trouve) => trouve[1])
      .filter((texte) => MOT.test(texte))
      .map((texte) => `${fichier} : ${texte.trim()}`),
  );
  assert.ok(
    gabarits.length > sources.length,
    'aucun gabarit safeHtml lu : la garde ne garde rien.',
  );
  assert.deepEqual(fautes, [], POURQUOI_EN_DUR);
});

test('chaque clé demandée par une brique existe dans le dictionnaire', () => {
  const cles = new Set(entreesDuDictionnaire().map(({ cle }) => cle));
  const inconnues = sourcesDesBriques().flatMap(({ fichier, contenu }) =>
    [...contenu.matchAll(/texte\(\s*'([a-z0-9-]+)'\s*\)/g)]
      .map((trouve) => trouve[1])
      .filter((cle) => !cles.has(cle))
      .map((cle) => `${fichier} : ${cle}`),
  );
  assert.deepEqual(inconnues, [], POURQUOI_CLE_INCONNUE);
});

test('chaque libellé runtime a une cible anglaise non vide', () => {
  const cibles = ciblesAnglaises();
  const sansCible = entreesDuDictionnaire()
    .map(({ identifiant }) => identifiant)
    .filter((identifiant) => (cibles.get(identifiant) ?? '') === '');
  assert.deepEqual(sansCible, [], POURQUOI_CIBLE);
});
