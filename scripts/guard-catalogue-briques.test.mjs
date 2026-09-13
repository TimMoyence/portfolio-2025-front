import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const DOSSIER_BRIQUES = 'src/cours/runtime/blocks';
const REGISTRE = 'src/cours/runtime/core/register.ts';
const SOCLE = 'FpBlock';

const POURQUOI =
  'Une brique absente de BLOCS n est jamais enregistree comme element personnalise : le deck la monte, le navigateur rend un element inconnu, et rien ne le signale. Deux briques livrees et testees vertes sont restees inutilisables jusqu a ce qu on les compte.';

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

test('chaque brique du dossier figure dans la table d enregistrement', () => {
  const surDisque = classesDeBrique();
  const contenu = readFileSync(REGISTRE, 'utf8');
  const inscrites = classesEnregistrees(contenu);

  assert.ok(surDisque.length > 0, `${DOSSIER_BRIQUES} ne contient aucune brique : la garde ne garde rien.`);
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

test('chaque brique inscrite porte un nom d element distinct en fp-', () => {
  const contenu = readFileSync(REGISTRE, 'utf8');
  const noms = [...contenu.matchAll(/nom:\s*'([^']+)'/g)].map((trouve) => trouve[1]);

  assert.ok(noms.length > 0, `${REGISTRE} n inscrit aucun nom : la garde ne garde rien.`);
  for (const nom of noms) {
    assert.match(nom, /^fp-[a-z0-9-]+$/, `nom d element invalide : ${nom}`);
  }
  assert.equal(new Set(noms).size, noms.length, `nom d element en double dans ${REGISTRE}`);
});
