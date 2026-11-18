import { globSync } from 'node:fs';
import { availableParallelism, totalmem } from 'node:os';
import { join } from 'node:path';

import libCoverage from 'istanbul-lib-coverage';

import { cheminDuDepot, lireTexte } from '../lib/depot.mjs';

const SEUILS_DE_COUVERTURE = { statements: 72, branches: 58, functions: 64, lines: 73 };

const TRANCHES_AU_PLUS = 8;

const MEMOIRE_D_UNE_TRANCHE = 5 * 1024 ** 3;

const SILENCE_TOLERE_D_UNE_TRANCHE_MS = 5 * 60_000;

const NG_TEST = ['exec', '--', 'ng', 'test', '--watch=false', '--browsers=ChromeHeadlessNoSandbox'];

export function nombreDeTranches(demande, coeurs = availableParallelism(), memoire = totalmem()) {
  if (demande === undefined || demande === '') {
    const portees = Math.floor(memoire / MEMOIRE_D_UNE_TRANCHE);
    return Math.max(1, Math.min(TRANCHES_AU_PLUS, coeurs, portees));
  }
  const total = Number(demande);
  if (!Number.isInteger(total) || total < 1) {
    throw new Error(`KARMA_TRANCHES « ${demande} » : un entier supérieur ou égal à 1 est attendu`);
  }
  return total;
}

export function specsDuFront() {
  return globSync('**/*.spec.ts', { cwd: cheminDuDepot('src') })
    .map((spec) => `src/${spec}`)
    .sort();
}

export function lancementsDesTranches(total, options, dossierDeCouverture, graine, specs) {
  if (options.some((option) => option.startsWith('--include'))) {
    throw new Error(
      'test:ci joue toute la suite et refuse --include : une spec ciblée se joue par npm exec -- ng test --include=<spec>',
    );
  }
  return Array.from({ length: total }, (_, rang) => ({
    env: {
      CI: 'true',
      KARMA_TRANCHE: `${rang}/${total}`,
      KARMA_COUVERTURE: join(dossierDeCouverture, 'tranches', String(rang)),
      KARMA_GRAINE: graine,
    },
    args: [...NG_TEST, ...specs.map((spec) => `--include=${spec}`), ...options],
    silenceMaxMs: SILENCE_TOLERE_D_UNE_TRANCHE_MS,
  }));
}

export function fichierDeCouverture({ env }) {
  return join(env.KARMA_COUVERTURE, 'coverage-final.json');
}

export function fusionnerLesCouvertures(fichiers) {
  const carte = libCoverage.createCoverageMap({});
  for (const fichier of fichiers) {
    carte.merge(JSON.parse(lireTexte(fichier)));
  }
  return carte;
}

const MARQUE_DU_BILAN = 'Executed ';

export function bilanDeKarma(sortie) {
  const ligne = sortie.split(/[\r\n]/).findLast((lue) => lue.includes(MARQUE_DU_BILAN));
  return ligne === undefined ? 'aucun test exécuté' : ligne.slice(ligne.indexOf(MARQUE_DU_BILAN));
}

const COMPTES_DU_BILAN = /^Executed (\d+) of (\d+)/;

const { marqueDeLEmpreinte } = JSON.parse(
  lireTexte(cheminDuDepot('src/testing/environnement/tranche-de-la-suite.json')),
);

const EMPREINTE_DE_LA_SUITE = new RegExp(`${marqueDeLEmpreinte} (\\d+-[0-9a-f]+)`);

export function repartitionIncomplete(sorties) {
  const empreintes = new Set(
    sorties.map((sortie) => EMPREINTE_DE_LA_SUITE.exec(sortie)?.[1] ?? 'aucune'),
  );
  if (empreintes.size > 1 || empreintes.has('aucune')) {
    return `les tranches ne voient pas les mêmes specs : ${[...empreintes].join(', ')}`;
  }
  const comptes = sorties.map((sortie) => COMPTES_DU_BILAN.exec(bilanDeKarma(sortie)));
  const totaux = new Set(comptes.map((compte) => compte?.[2]));
  const jouees = comptes.reduce((somme, compte) => somme + Number(compte?.[1]), 0);
  return totaux.size === 1 && totaux.has(String(jouees))
    ? null
    : `les tranches jouent ${jouees} specs pour une suite de ${[...totaux].join(', ')}`;
}

const RESSOURCE_ABSENTE = /WARN \[web-server\]: 404: (\S+)/g;

export function ressourcesAbsentes(sorties) {
  const chemins = sorties.flatMap((sortie) =>
    [...sortie.matchAll(RESSOURCE_ABSENTE)].map(([, chemin]) => chemin),
  );
  return [...new Set(chemins)].sort();
}

const GRAINES_POSSIBLES = 100_000;

export function graineDeLaPasse(demande, tirer = Math.random) {
  if (demande === undefined || demande === '') {
    return String(Math.floor(tirer() * GRAINES_POSSIBLES));
  }
  if (!/^\d+$/.test(demande)) {
    throw new Error(`KARMA_GRAINE « ${demande} » : un entier positif est attendu`);
  }
  return demande;
}

export function seuilsNonTenus(resume, seuils = SEUILS_DE_COUVERTURE) {
  return Object.entries(seuils)
    .filter(([mesure, seuil]) => resume[mesure].pct < seuil)
    .map(([mesure, seuil]) => `${mesure} ${resume[mesure].pct} % < ${seuil} %`);
}
