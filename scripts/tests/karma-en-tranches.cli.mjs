import { rmSync } from 'node:fs';

import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

import { cheminDuDepot } from '../lib/depot.mjs';
import { executer } from '../lib/processus.mjs';
import {
  bilanDeKarma,
  fichierDeCouverture,
  fusionnerLesCouvertures,
  lancementsDesTranches,
  nombreDeTranches,
  repartitionIncomplete,
  seuilsNonTenus,
} from './karma-en-tranches.mjs';

const DOSSIER_DE_COUVERTURE = cheminDuDepot('coverage/portfolio-app');

const BRUIT_DE_KARMA = /WARN \[web-server\]: 404:/;

const options = process.argv.slice(2);
const couverture = options.includes('--code-coverage');
const lancements = lancementsDesTranches(
  nombreDeTranches(process.env['KARMA_TRANCHES']),
  options,
  DOSSIER_DE_COUVERTURE,
);

rmSync(DOSSIER_DE_COUVERTURE, { recursive: true, force: true });

const lignesDe = (texte) => texte.split(/[\r\n]+/);

const verdicts = await Promise.allSettled(
  lancements.map(({ env, args }) =>
    executer('npm', args, { env, stdio: ['ignore', 'pipe', 'pipe'] }),
  ),
);

let echecs = 0;
const bilans = [];
for (const [rang, verdict] of verdicts.entries()) {
  const sortie = verdict.status === 'fulfilled' ? verdict.value : String(verdict.reason.message);
  bilans.push(bilanDeKarma(sortie));
  console.log(`tranche ${rang}/${lancements.length} : ${bilans.at(-1)}`);
  if (verdict.status === 'rejected') {
    echecs += 1;
    console.error(
      lignesDe(sortie)
        .filter((ligne) => !BRUIT_DE_KARMA.test(ligne))
        .join('\n'),
    );
  }
}

if (echecs > 0) {
  console.error(`${echecs} tranche(s) sur ${lancements.length} en échec`);
  process.exit(1);
}

const repartition = repartitionIncomplete(bilans);
if (repartition !== null) {
  console.error(repartition);
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
