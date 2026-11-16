import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { cheminDuDepot } from './lib/depot.mjs';
import {
  coursServis,
  instantanesDuDossier,
  instantanesDuFront,
  instantanesObsoletes,
  rangementDuFront,
} from './lib/contrat/instantanes.mjs';
import { sourceEpinglee } from './lib/contrat/source.mjs';

const DOSSIER_DU_BACK = 'test/fixtures/formations';
const DOSSIER_DU_FRONT = 'src/testing/fixtures/instantanes/json';
const COURS_SERVIS = 'contrat/cours-servis.gen.json';

const source = sourceEpinglee();

const servis = instantanesDuDossier(await source.arbre(), DOSSIER_DU_BACK);
const distants = servis.map(({ chemin }) => rangementDuFront(chemin, DOSSIER_DU_BACK));

const instantanes = [];
for (const { nom, chemin } of servis) {
  const corps = await source.fichier(chemin);
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
