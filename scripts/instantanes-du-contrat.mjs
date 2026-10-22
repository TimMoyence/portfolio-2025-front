import { readdirSync, rmSync, writeFileSync } from 'node:fs';

import { cheminDuDepot, lireTexte } from './lib/depot.mjs';
import { instantanesObsoletes, SUFFIXE_D_INSTANTANE } from './lib/instantanes.mjs';

const DOSSIER_DU_BACK = 'test/fixtures/formations';
const DOSSIER_DU_FRONT = 'src/testing/fixtures';

const { depot, commit } = JSON.parse(lireTexte(cheminDuDepot('contrat.json')));

const jeton = process.env['GITHUB_TOKEN'];

async function lire(url) {
  const reponse = await fetch(url, {
    headers:
      jeton && url.startsWith('https://api.github.com/')
        ? { authorization: `Bearer ${jeton}` }
        : {},
  });
  if (!reponse.ok) {
    throw new Error(`${url} : ${reponse.status}`);
  }
  return reponse;
}

const fichiers = await (
  await lire(`https://api.github.com/repos/${depot}/contents/${DOSSIER_DU_BACK}?ref=${commit}`)
).json();

const distants = fichiers
  .map(({ name }) => name)
  .filter((nom) => nom.endsWith(SUFFIXE_D_INSTANTANE));

for (const nom of distants) {
  const corps = await (
    await lire(`https://raw.githubusercontent.com/${depot}/${commit}/${DOSSIER_DU_BACK}/${nom}`)
  ).text();
  writeFileSync(cheminDuDepot(`${DOSSIER_DU_FRONT}/${nom}`), corps);
}

for (const nom of instantanesObsoletes(readdirSync(cheminDuDepot(DOSSIER_DU_FRONT)), distants)) {
  rmSync(cheminDuDepot(`${DOSSIER_DU_FRONT}/${nom}`));
}
