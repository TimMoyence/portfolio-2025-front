import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const SOURCE_FR = cheminDuDepot('src/locale/messages.xlf');
const TRADUCTION_EN = cheminDuDepot('src/locale/messages.en.xlf');
const EXCEPTIONS = cheminDuDepot('src/locale/cibles-identiques-justifiees.json');

const PORTE = 'guard-i18n-sync';

const POURQUOI_MARQUEUR =
  "Un marqueur « needs-translation » laisse une cible francaise en ligne sans qu'aucune porte ne rougisse : vingt-six unites ia-solo ont ainsi servi du francais sur /en/formations/ia-solopreneurs pendant des semaines.";

const POURQUOI_IDENTIQUE =
  'Une cible identique a sa source est du francais servi a un lecteur anglophone, sauf quand les deux langues ecrivent vraiment la meme chose. Le tri ne peut pas etre devine : il se declare dans cibles-identiques-justifiees.json, un id par motif.';

const POURQUOI_PERIMEE_EXCEPTION =
  "Une exception qui ne correspond plus a une cible identique couvre une unite qui n'existe plus ou qui a ete traduite depuis : gardee, elle autoriserait en silence une future regression sur le meme id.";

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
  const contenu = lireTexte(SOURCE_FR);
  const unites = new Map();
  for (const [, id, corps] of contenu.matchAll(
    /<trans-unit id="([^"]+)"[^>]*>([\s\S]*?)<\/trans-unit>/g,
  )) {
    unites.set(id, texteXliff12(/<source>([\s\S]*?)<\/source>/.exec(corps)?.[1] ?? ''));
  }
  return unites;
}

function unitesTraduction() {
  const contenu = lireTexte(TRADUCTION_EN);
  const unites = new Map();
  for (const [, id, corps] of contenu.matchAll(/<unit id="([^"]+)">([\s\S]*?)<\/unit>/g)) {
    unites.set(id, {
      source: texteXliff20(/<source>([\s\S]*?)<\/source>/.exec(corps)?.[1] ?? ''),
      cible: /<target>([\s\S]*?)<\/target>/.exec(corps)?.[1],
    });
  }
  return unites;
}

function texteTraduction() {
  const contenu = lireTexte(TRADUCTION_EN);
  if (contenu.trim() === '') {
    throw new Error(
      `${PORTE} : ${TRADUCTION_EN} est vide - une porte qui lit un fichier vide rend un vert qui ne prouve rien.`,
    );
  }
  return contenu;
}

function ciblesBrutes() {
  const unites = new Map();
  for (const [, id, corps] of texteTraduction().matchAll(
    /<unit id="([^"]+)">([\s\S]*?)<\/unit>/g,
  )) {
    unites.set(id, {
      source: /<source>([\s\S]*?)<\/source>/.exec(corps)?.[1],
      cible: /<target>([\s\S]*?)<\/target>/.exec(corps)?.[1],
    });
  }
  if (unites.size === 0) {
    throw new Error(
      `${PORTE} : aucune unite lue dans ${TRADUCTION_EN} - une detection qui ne trouve rien a verifier ne garde rien.`,
    );
  }
  return unites;
}

function idsIdentiques() {
  return [...ciblesBrutes()]
    .filter(([, { source, cible }]) => source !== undefined && source === cible)
    .map(([id]) => id);
}

function exceptionsJustifiees() {
  const declare = JSON.parse(lireTexte(EXCEPTIONS));
  const motifs = Object.keys(declare?.motifs ?? {});
  const unites = Object.entries(declare?.unites ?? {});
  if (declare?.porte !== PORTE) {
    throw new Error(
      `${PORTE} : ${EXCEPTIONS} ne cite pas la porte qui l'applique - une liste d'exceptions orpheline ne se relit jamais.`,
    );
  }
  if (motifs.length === 0 || unites.length === 0) {
    throw new Error(
      `${PORTE} : ${EXCEPTIONS} ne declare aucun motif ou aucune unite - une liste d'exceptions vide laisserait passer n'importe quelle cible identique.`,
    );
  }
  const sansMotif = unites.filter(([, motif]) => !motifs.includes(motif)).map(([id]) => id);
  if (sansMotif.length > 0) {
    throw new Error(
      `${PORTE} : motif inconnu dans ${EXCEPTIONS} pour ${sansMotif.join(', ')} - une exception sans justification lisible est une exception non justifiee.`,
    );
  }
  return new Map(unites);
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

test('aucune unite anglaise ne porte le marqueur needs-translation', () => {
  const marquees = [
    ...texteTraduction().matchAll(/needs-translation[\s\S]{0,200}?<unit id="([^"]+)"/g),
  ].map(([, id]) => id);
  assert.deepEqual(marquees, [], `${POURQUOI_MARQUEUR}\nIds : ${marquees.join(', ')}`);
});

test('chaque cible identique a sa source est declaree et justifiee', () => {
  const justifiees = exceptionsJustifiees();
  const injustifiees = idsIdentiques().filter((id) => !justifiees.has(id));
  assert.deepEqual(injustifiees, [], `${POURQUOI_IDENTIQUE}\nIds : ${injustifiees.join(', ')}`);
});

test('la liste des cibles identiques ne garde aucune exception perimee', () => {
  const identiques = new Set(idsIdentiques());
  const perimees = [...exceptionsJustifiees().keys()].filter((id) => !identiques.has(id));
  assert.deepEqual(perimees, [], `${POURQUOI_PERIMEE_EXCEPTION}\nIds : ${perimees.join(', ')}`);
});
