import { writeFileSync } from 'node:fs';

import { cheminDuDepot, lireTexte } from './lib/depot.mjs';

const DOSSIER_DU_BACK = 'test/fixtures/formations';
const SUFFIXE = '.instantane.json';

const { depot, commit } = JSON.parse(lireTexte(cheminDuDepot('contrat.json')));

async function lire(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(`${url} : ${reponse.status}`);
  }
  return reponse;
}

const fichiers = await (
  await lire(`https://api.github.com/repos/${depot}/contents/${DOSSIER_DU_BACK}?ref=${commit}`)
).json();

for (const { name } of fichiers.filter(({ name }) => name.endsWith(SUFFIXE))) {
  const corps = await (
    await lire(`https://raw.githubusercontent.com/${depot}/${commit}/${DOSSIER_DU_BACK}/${name}`)
  ).text();
  writeFileSync(cheminDuDepot(`src/testing/fixtures/${name}`), corps);
}
