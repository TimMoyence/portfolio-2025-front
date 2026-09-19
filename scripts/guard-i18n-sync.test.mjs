import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE_FR = join(RACINE, 'src/locale/messages.xlf');
const TRADUCTION_EN = join(RACINE, 'src/locale/messages.en.xlf');

const POURQUOI_PERIMEE =
  "Angular relie une traduction a son texte par l'id seulement : quand la source francaise change et que messages.en.xlf garde l'ancienne, le build anglais sert l'ancienne phrase sans le moindre avertissement. Trente-neuf traductions perimees sont ainsi restees en ligne sans que rien ne le signale.";

const POURQUOI_MANQUANTE =
  "Un id extrait sans unite anglaise ne casse pas le build : il affiche le francais sur /en et ne laisse qu'une ligne « No translation found » dans une sortie de build que personne ne relit.";

const POURQUOI_ORPHELINE =
  "Une unite anglaise dont l'id n'est plus extrait n'est plus lue par personne : elle masque la taille reelle du fichier et survit aux renommages d'id.";

function decoderEntites(texte) {
  return texte
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function normaliser(texte) {
  return decoderEntites(texte).replace(/\s+/g, ' ').trim();
}

function texteXliff12(source) {
  return normaliser(
    source
      .replace(/<x id="(START_[^"]*)"[^>]*\/>/g, '[$1]')
      .replace(/<x id="CLOSE_[^"]*"[^>]*\/>/g, '[/]')
      .replace(/<x id="([^"]*)"[^>]*\/>/g, '{$1}'),
  );
}

function texteXliff20(source) {
  return normaliser(
    source
      .replace(/<pc [^>]*equivStart="([^"]*)"[^>]*>/g, '[$1]')
      .replace(/<\/pc>/g, '[/]')
      .replace(/<ph [^>]*equiv="([^"]*)"[^>]*\/>/g, '{$1}'),
  );
}

function unitesSource() {
  const contenu = readFileSync(SOURCE_FR, 'utf8');
  const unites = new Map();
  for (const [, id, corps] of contenu.matchAll(
    /<trans-unit id="([^"]+)"[^>]*>([\s\S]*?)<\/trans-unit>/g,
  )) {
    unites.set(id, texteXliff12(/<source>([\s\S]*?)<\/source>/.exec(corps)?.[1] ?? ''));
  }
  return unites;
}

function unitesTraduction() {
  const contenu = readFileSync(TRADUCTION_EN, 'utf8');
  const unites = new Map();
  for (const [, id, corps] of contenu.matchAll(/<unit id="([^"]+)">([\s\S]*?)<\/unit>/g)) {
    unites.set(id, {
      source: texteXliff20(/<source>([\s\S]*?)<\/source>/.exec(corps)?.[1] ?? ''),
      cible: /<target>([\s\S]*?)<\/target>/.exec(corps)?.[1],
    });
  }
  return unites;
}

test('le fichier source et la traduction sont lus et non vides', () => {
  assert.ok(unitesSource().size > 0, `aucune trans-unit lue dans ${SOURCE_FR}`);
  assert.ok(unitesTraduction().size > 0, `aucune unit lue dans ${TRADUCTION_EN}`);
});

test('chaque texte extrait a une traduction anglaise avec une cible', () => {
  const traduction = unitesTraduction();
  const manquantes = [...unitesSource().keys()].filter(
    (id) => traduction.get(id)?.cible === undefined,
  );
  assert.deepEqual(manquantes, [], `${POURQUOI_MANQUANTE}\nIds : ${manquantes.join(', ')}`);
});

test('chaque traduction anglaise porte la source francaise actuelle', () => {
  const traduction = unitesTraduction();
  const perimees = [...unitesSource()]
    .filter(([id, texte]) => traduction.has(id) && traduction.get(id).source !== texte)
    .map(
      ([id, texte]) =>
        `${id}\n    source actuelle : ${texte}\n    traduite depuis : ${traduction.get(id).source}`,
    );
  assert.deepEqual(perimees, [], `${POURQUOI_PERIMEE}\n${perimees.join('\n')}`);
});

test('aucune traduction anglaise ne survit a son id', () => {
  const source = unitesSource();
  const orphelines = [...unitesTraduction().keys()].filter((id) => !source.has(id));
  assert.deepEqual(orphelines, [], `${POURQUOI_ORPHELINE}\nIds : ${orphelines.join(', ')}`);
});
