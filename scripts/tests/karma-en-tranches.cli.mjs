import { rmSync } from 'node:fs';

import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

import { cheminDuDepot } from '../lib/depot.mjs';
import { executer, sortirEn130ALInterruption } from '../lib/processus.mjs';
import {
  bilanDeKarma,
  fichierDeCouverture,
  fusionnerLesCouvertures,
  graineDeLaPasse,
  lancementsDesTranches,
  nombreDeTranches,
  repartitionIncomplete,
  ressourcesAbsentes,
  seuilsNonTenus,
  specsDuFront,
} from './karma-en-tranches.mjs';

const DOSSIER_DE_COUVERTURE = cheminDuDepot('coverage/portfolio-app');

const options = process.argv.slice(2);
const couverture = options.includes('--code-coverage');
const graine = graineDeLaPasse(process.env['KARMA_GRAINE']);
const lancements = lancementsDesTranches(
  nombreDeTranches(process.env['KARMA_TRANCHES']),
  options,
  DOSSIER_DE_COUVERTURE,
  graine,
  specsDuFront(),
);
console.log(`graine de l ordre des specs : ${graine} (KARMA_GRAINE=${graine} rejoue cette passe)`);

if (couverture) rmSync(DOSSIER_DE_COUVERTURE, { recursive: true, force: true });

const finDeLInterruption = sortirEn130ALInterruption();

const verdicts = await Promise.allSettled(
  lancements.map(({ env, args, silenceMaxMs }) =>
    executer('npm', args, { env, silenceMaxMs, stdio: ['ignore', 'pipe', 'pipe'] }),
  ),
);
await finDeLInterruption();

let echecs = 0;
const sorties = [];
for (const [rang, verdict] of verdicts.entries()) {
  const sortie = verdict.status === 'fulfilled' ? verdict.value : String(verdict.reason.message);
  sorties.push(sortie);
  console.log(`tranche ${rang}/${lancements.length} : ${bilanDeKarma(sortie)}`);
  if (verdict.status === 'rejected') {
    echecs += 1;
    console.error(sortie);
  }
}

if (echecs > 0) {
  console.error(`${echecs} tranche(s) sur ${lancements.length} en échec`);
  process.exit(1);
}

const repartition = repartitionIncomplete(sorties);
if (repartition !== null) {
  console.error(repartition);
  process.exit(1);
}

const absentes = ressourcesAbsentes(sorties);
if (absentes.length > 0) {
  console.error(
    `les specs demandent des fichiers que les tests ne servent pas : ${absentes.join(', ')}`,
  );
  process.exit(1);
}

if (couverture) {
  const coverageMap = fusionnerLesCouvertures(lancements.map(fichierDeCouverture));
  const contexte = libReport.createContext({ dir: DOSSIER_DE_COUVERTURE, coverageMap });
  for (const rapport of ['html', 'lcovonly', 'text-summary']) {
    reports.create(rapport).execute(contexte);
  }
  const manques = seuilsNonTenus(coverageMap.getCoverageSummary().toJSON());
  if (manques.length > 0) {
    console.error(`couverture sous le seuil : ${manques.join(' ; ')}`);
    process.exit(1);
  }
}
