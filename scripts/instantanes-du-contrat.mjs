import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { cheminDuDepot, lireTexte } from './lib/depot.mjs';
import {
  coursServis,
  instantanesDuDossier,
  instantanesDuFront,
  instantanesObsoletes,
  rangementDuFront,
} from './lib/contrat/instantanes.mjs';

const DOSSIER_DU_BACK = 'test/fixtures/formations';
const DOSSIER_DU_FRONT = 'src/testing/fixtures/instantanes/json';
const COURS_SERVIS = 'contrat/cours-servis.gen.json';

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

const arbre = await (
  await lire(`https://api.github.com/repos/${depot}/git/trees/${commit}?recursive=1`)
).json();

const servis = instantanesDuDossier(arbre, DOSSIER_DU_BACK);
const distants = servis.map(({ chemin }) => rangementDuFront(chemin, DOSSIER_DU_BACK));

const instantanes = [];
for (const { nom, chemin } of servis) {
  const corps = await (
    await lire(`https://raw.githubusercontent.com/${depot}/${commit}/${chemin}`)
  ).text();
  const destination = cheminDuDepot(
    `${DOSSIER_DU_FRONT}/${rangementDuFront(chemin, DOSSIER_DU_BACK)}`,
  );
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, corps);
  instantanes.push([nom, corps]);
}

writeFileSync(
  cheminDuDepot(COURS_SERVIS),
  `${JSON.stringify(coursServis(instantanes), null, 2)}\n`,
);

for (const relatif of instantanesObsoletes(
  instantanesDuFront(cheminDuDepot(DOSSIER_DU_FRONT)),
  distants,
)) {
  rmSync(cheminDuDepot(`${DOSSIER_DU_FRONT}/${relatif}`));
}
