import { readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';

import libCoverage from 'istanbul-lib-coverage';

const SEUILS_DE_COUVERTURE = { statements: 72, branches: 58, functions: 64, lines: 73 };

const TRANCHES_AU_PLUS = 8;

const NG_TEST = ['exec', '--', 'ng', 'test', '--watch=false', '--browsers=ChromeHeadlessNoSandbox'];

export function nombreDeTranches(demande, coeurs = availableParallelism()) {
  if (demande === undefined || demande === '') {
    return Math.max(1, Math.min(TRANCHES_AU_PLUS, coeurs));
  }
  const total = Number(demande);
  if (!Number.isInteger(total) || total < 1) {
    throw new Error(`KARMA_TRANCHES « ${demande} » : un entier supérieur ou égal à 1 est attendu`);
  }
  return total;
}

export function lancementsDesTranches(total, options, dossierDeCouverture) {
  return Array.from({ length: total }, (_, rang) => ({
    env: {
      KARMA_TRANCHE: `${rang}/${total}`,
      KARMA_COUVERTURE: join(dossierDeCouverture, 'tranches', String(rang)),
    },
    args: [...NG_TEST, ...options],
  }));
}

export function fichierDeCouverture({ env }) {
  return join(env.KARMA_COUVERTURE, 'coverage-final.json');
}

export function fusionnerLesCouvertures(fichiers) {
  const carte = libCoverage.createCoverageMap({});
  for (const fichier of fichiers) {
    carte.merge(JSON.parse(readFileSync(fichier, 'utf8')));
  }
  return carte;
}

const MARQUE_DU_BILAN = 'Executed ';

export function bilanDeKarma(sortie) {
  const ligne = sortie.split(/[\r\n]/).findLast((lue) => lue.includes(MARQUE_DU_BILAN));
  return ligne === undefined ? 'aucun test exécuté' : ligne.slice(ligne.indexOf(MARQUE_DU_BILAN));
}

const COMPTES_DU_BILAN = /^Executed (\d+) of (\d+)/;

export function repartitionIncomplete(bilans) {
  const comptes = bilans.map((bilan) => COMPTES_DU_BILAN.exec(bilan));
  const totaux = new Set(comptes.map((compte) => compte?.[2] ?? 'aucun'));
  if (totaux.size > 1 || totaux.has('aucun')) {
    return `les tranches ne voient pas la même suite : ${[...totaux].join(', ')}`;
  }
  const jouees = comptes.reduce((somme, compte) => somme + Number(compte?.[1]), 0);
  const total = Number([...totaux][0]);
  return jouees === total ? null : `les tranches jouent ${jouees} specs pour une suite de ${total}`;
}

export function seuilsNonTenus(resume, seuils = SEUILS_DE_COUVERTURE) {
  return Object.entries(seuils)
    .filter(([mesure, seuil]) => resume[mesure].pct < seuil)
    .map(([mesure, seuil]) => `${mesure} ${resume[mesure].pct} % < ${seuil} %`);
}
