import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const DOSSIER_BRIQUES = 'src/cours/runtime/blocks';
const REGISTRE = 'src/cours/runtime/core/register.ts';
const DOSSIER_FEUILLES = 'src/cours/runtime/design/blocks';
const INDEX_FEUILLES = `${DOSSIER_FEUILLES}/index.ts`;
const SOCLE = 'FpBlock';
const PLANCHER_FEUILLE = 20;

const PERIMETRE_V1 = [
  'fp-vote',
  'fp-numeric',
  'fp-concept4',
  'fp-worked',
  'fp-plot',
  'fp-table-build',
  'fp-sheet',
  'fp-cardsort',
  'fp-escape',
  'fp-challenge',
  'fp-pulse',
  'fp-recall',
  'fp-spaced',
  'fp-exit',
  'fp-quote',
  'fp-story',
  'fp-pro',
];

const POURQUOI =
  'Une brique absente de BLOCS n est jamais enregistree comme element personnalise : le deck la monte, le navigateur rend un element inconnu, et rien ne le signale. Deux briques livrees et testees vertes sont restees inutilisables jusqu a ce qu on les compte.';

const POURQUOI_SPEC =
  'Comparer la table au disque ne voit jamais une brique prevue par la specification mais jamais ecrite : les deux cotes sont d accord sur rien. Seule la liste du perimetre V1 tenue a la main attrape l oubli.';

function classesDeBrique() {
  return readdirSync(DOSSIER_BRIQUES)
    .filter((entree) => /^Fp[A-Za-z0-9]+\.ts$/.test(entree))
    .map((entree) => entree.replace(/\.ts$/, ''))
    .filter((classe) => classe !== SOCLE)
    .sort();
}

function classesEnregistrees(contenu) {
  return [...contenu.matchAll(/\)\)\.(Fp[A-Za-z0-9]+)\b/g)].map((trouve) => trouve[1]).sort();
}

function nomsEnregistres() {
  const contenu = readFileSync(REGISTRE, 'utf8');
  return [...contenu.matchAll(/nom:\s*'([^']+)'/g)].map((trouve) => trouve[1]);
}

function inscriptions() {
  const contenu = readFileSync(REGISTRE, 'utf8');
  return [...contenu.matchAll(/nom:\s*'([^']+)'[\s\S]*?\)\)\.(Fp[A-Za-z0-9]+)\b/g)].map(
    (trouve) => ({
      nom: trouve[1],
      classe: trouve[2],
    }),
  );
}

function identifiantsDeFeuille() {
  const contenu = readFileSync(INDEX_FEUILLES, 'utf8');
  const debut = contenu.indexOf('const FEUILLES');
  const fin = contenu.indexOf('};', debut);
  const entrees = new Map();
  for (const ligne of contenu.slice(debut, fin).split('\n')) {
    const avecCle = /^\s*'([^']+)':\s*(\w+),/.exec(ligne);
    if (avecCle) {
      entrees.set(avecCle[1], avecCle[2]);
      continue;
    }
    const raccourci = /^\s*(\w+),\s*$/.exec(ligne);
    if (raccourci) {
      entrees.set(raccourci[1], raccourci[1]);
    }
  }
  return entrees;
}

function corpsDesFeuilles() {
  return readdirSync(DOSSIER_FEUILLES)
    .filter((entree) => entree.endsWith('.ts') && entree !== 'index.ts')
    .map((entree) => readFileSync(join(DOSSIER_FEUILLES, entree), 'utf8'))
    .join('\n');
}

function feuilleDe(identifiant, corpus) {
  const motif = new RegExp(`export const ${identifiant}\\s*=\\s*\`([\\s\\S]*?)\``);
  return motif.exec(corpus)?.[1] ?? null;
}

test('chaque brique du dossier figure dans la table d enregistrement', () => {
  const surDisque = classesDeBrique();
  const contenu = readFileSync(REGISTRE, 'utf8');
  const inscrites = classesEnregistrees(contenu);

  assert.ok(
    surDisque.length > 0,
    `${DOSSIER_BRIQUES} ne contient aucune brique : la garde ne garde rien.`,
  );
  assert.ok(inscrites.length > 0, `${REGISTRE} n inscrit aucune brique : la garde ne garde rien.`);

  const manquantes = surDisque.filter((classe) => !inscrites.includes(classe));
  assert.deepEqual(manquantes, [], `absentes de BLOCS : ${manquantes.join(', ')}. ${POURQUOI}`);
});

test('la table n inscrit aucune brique qui n existe pas sur le disque', () => {
  const surDisque = classesDeBrique();
  const inscrites = classesEnregistrees(readFileSync(REGISTRE, 'utf8'));

  const fantomes = inscrites.filter((classe) => !surDisque.includes(classe));
  assert.deepEqual(fantomes, [], `inscrites sans fichier : ${fantomes.join(', ')}`);
});

test('chaque brique du perimetre V1 de la specification est inscrite', () => {
  const noms = nomsEnregistres();

  assert.ok(PERIMETRE_V1.length > 0, 'la liste du perimetre V1 est vide : la garde ne garde rien.');
  assert.ok(noms.length > 0, `${REGISTRE} n inscrit aucun nom : la garde ne garde rien.`);

  const jamaisEcrites = PERIMETRE_V1.filter((nom) => !noms.includes(nom));
  assert.deepEqual(
    jamaisEcrites,
    [],
    `prevues par la specification et jamais inscrites : ${jamaisEcrites.join(', ')}. ${POURQUOI_SPEC}`,
  );
});

test('chaque brique inscrite dispose d une feuille de styles non vide', () => {
  const noms = nomsEnregistres();
  const identifiants = identifiantsDeFeuille();
  const corpus = corpsDesFeuilles();

  assert.ok(noms.length > 0, `${REGISTRE} n inscrit aucun nom : la garde ne garde rien.`);
  assert.ok(
    identifiants.size > 0,
    `${INDEX_FEUILLES} ne declare aucune feuille : la garde ne garde rien.`,
  );

  for (const nom of noms) {
    const cle = nom.replace(/^fp-/, '');
    const identifiant = identifiants.get(cle);
    assert.ok(
      identifiant !== undefined,
      `${nom} n a aucune entree « ${cle} » dans ${INDEX_FEUILLES} : feuilleDe('${cle}') rend la chaine vide et la brique s affiche sans style.`,
    );
    const feuille = feuilleDe(identifiant, corpus);
    assert.ok(
      feuille !== null,
      `${nom} declare la feuille « ${identifiant} » introuvable sous ${DOSSIER_FEUILLES}.`,
    );
    assert.ok(
      feuille.includes('{') && feuille.trim().length >= PLANCHER_FEUILLE,
      `${nom} pointe une feuille « ${identifiant} » sans regle : la brique s affiche sans style.`,
    );
  }
});

test('chaque brique inscrite declare ses metadonnees pedagogiques', () => {
  const inscrites = inscriptions();

  assert.ok(inscrites.length > 0, `${REGISTRE} n inscrit aucune brique : la garde ne garde rien.`);

  const muettes = inscrites
    .filter(({ classe }) => {
      const source = readFileSync(join(DOSSIER_BRIQUES, `${classe}.ts`), 'utf8');
      return !/metadonnees:\s*MetadonneesBrique/.test(source);
    })
    .map(({ nom }) => nom);

  assert.deepEqual(
    muettes,
    [],
    `sans metadonnees pedagogiques : ${muettes.join(', ')}. Une brique qui n annonce ni concept, ni duree, ni modalite, ni regime de verrou ne peut etre choisie pour un cours autrement qu au jugé.`,
  );
});

test('chaque brique inscrite porte un nom d element distinct en fp-', () => {
  const noms = nomsEnregistres();

  assert.ok(noms.length > 0, `${REGISTRE} n inscrit aucun nom : la garde ne garde rien.`);
  for (const nom of noms) {
    assert.match(nom, /^fp-[a-z0-9-]+$/, `nom d element invalide : ${nom}`);
  }
  assert.equal(new Set(noms).size, noms.length, `nom d element en double dans ${REGISTRE}`);
});
