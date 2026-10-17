import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { test } from 'node:test';

import { ESLint } from 'eslint';
import * as prettier from 'prettier';

import { echapperPourRegex } from '../src/cours/runtime/core/valeurs.ts';
import { trackedFiles } from './guard-no-comments.mjs';
import { cheminDuDepot, RACINE } from './lib/depot.mjs';
import { avecDossierPlante } from './lib/dossier-temporaire.mjs';

const CHEMIN_PACKAGE = cheminDuDepot('package.json');

const CHEMIN_WORKFLOW = cheminDuDepot('.github/workflows/ci.yml');

const CHEMIN_LIGHTHOUSE = cheminDuDepot('.lighthouserc.js');

const JOB_WORKFLOW = 'quality-gate';

const JOB_E2E = 'e2e';

const JOB_BANC = 'banc';

const PORTE_E2E_COMPLETE = 'test:e2e:portail';

const PORTE_E2E_RAPIDE = 'test:e2e:cours';

function analyserScripts(paquet) {
  const scripts = paquet?.scripts;
  if (!scripts || typeof scripts !== 'object' || Object.keys(scripts).length === 0) {
    throw new Error(
      "ci-portes : package.json ne declare aucun script - impossible de verifier le branchement d'une porte sur un portail vide.",
    );
  }
  return scripts;
}

function portesDuChantier(scripts) {
  const entrees = Object.entries(scripts).filter(([, commande]) => typeof commande === 'string');
  const portes = entrees
    .filter(([, commande]) => /scripts\/lints-cours\//.test(commande))
    .map(([nom]) => nom);
  const suite = entrees.find(([, commande]) => /node --test .*scripts.*\.test\.mjs/.test(commande));
  if (suite) {
    portes.push(suite[0]);
  }
  if (portes.length === 0) {
    throw new Error(
      "ci-portes : aucune porte du chantier des lints n'a ete detectee dans package.json - une detection par motif qui rend une liste vide en silence est exactement le defaut a empecher.",
    );
  }
  return portes;
}

function suitesPlaywright(racine = RACINE) {
  const dossier = join(racine, 'e2e');
  const suites = existsSync(dossier)
    ? readdirSync(dossier).filter((nom) => nom.endsWith('.spec.ts'))
    : [];
  if (suites.length === 0) {
    throw new Error(
      "ci-portes : aucune suite Playwright n'a ete trouvee dans e2e/ - une porte qui garde un perimetre vide ne garde rien, et un vert obtenu sur zero suite est un faux vert.",
    );
  }
  return suites.sort();
}

function portesPlaywright(scripts) {
  const portes = Object.entries(scripts)
    .filter(([, commande]) => typeof commande === 'string' && /playwright test\b/.test(commande))
    .map(([nom]) => nom);
  if (portes.length === 0) {
    throw new Error(
      "ci-portes : aucun script de package.json n'appelle « playwright test » - les suites e2e ne seraient jouees par aucune porte.",
    );
  }
  return portes;
}

function suitesNommeesPar(commande) {
  return [...commande.matchAll(/e2e\/([\w.-]+\.spec\.ts)/g)].map((trouve) => trouve[1]);
}

function estNommeeDans(chaine, porte) {
  return (
    typeof chaine === 'string' &&
    new RegExp(`\\bnpm run ${echapperPourRegex(porte)}\\b`).test(chaine)
  );
}

const CLES_D_UNE_ETAPE = {
  name: 'nom',
  run: 'commande',
  if: 'condition',
  'continue-on-error': 'continueSurErreur',
  shell: 'shell',
};

const ECHEC_RATTRAPE = /\|\||;\s*(?:true|:)(?:\s|$)|\bexit\s+0\b|\bset\s+\+e\b/;

const APPELLE_NPM = /\bnpm\b/;

const NOM_DE_SCRIPT = String.raw`[\w:.][\w:.-]*`;

const NPM_SEUL = new RegExp(`^npm (?:ci|test|run ${NOM_DE_SCRIPT})$`);

const NPM_RUN = new RegExp(String.raw`\bnpm run (${NOM_DE_SCRIPT})(?=\s*(?:&&|$))`, 'g');

const ABSORBE_UN_ECHEC = /\||;|\n|`|\$\(|(?<!&)&(?!&)|(?:^|[\s&|;(])!\s/;

const PROLONGEMENT_DE_TEST_CI = {
  prolongee: 'test:ci',
  prolongement: 'test:cov',
  options: '--code-coverage',
};

const CLE_YAML = /^(\s*)(-\s+)?([\w-]+):(.*)$/s;

function estNeutralisee(etape) {
  const commande = etape.commande ?? '';
  return (
    etape.condition !== null ||
    (etape.continueSurErreur ?? 'false') !== 'false' ||
    (etape.shell ?? 'bash') !== 'bash' ||
    ECHEC_RATTRAPE.test(commande) ||
    (APPELLE_NPM.test(commande) && !NPM_SEUL.test(commande))
  );
}

function blocDuJob(texteWorkflow, job) {
  if (typeof texteWorkflow !== 'string' || texteWorkflow.trim() === '') {
    throw new Error('ci-portes : le workflow est vide - aucune porte ne peut y etre verifiee.');
  }
  const lignes = texteWorkflow.split('\n');
  const debutJob = lignes.findIndex((ligne) => new RegExp(`^ {2}${job}:\\s*$`).test(ligne));
  if (debutJob === -1) {
    throw new Error(`ci-portes : le job « ${job} » est introuvable dans le workflow.`);
  }
  const finJob = lignes.findIndex(
    (ligne, index) => index > debutJob && /^ {2}[\w-]+:\s*$/.test(ligne),
  );
  return lignes.slice(debutJob + 1, finJob === -1 ? lignes.length : finJob);
}

function enteteDuJob(texteWorkflow, job) {
  const entete = { condition: null, continueSurErreur: null, shell: null };
  let dansLesDefauts = false;
  for (const ligne of blocDuJob(texteWorkflow, job)) {
    const cle = ligne.match(/^ {4}([\w-]+):(.*)$/);
    if (cle) {
      dansLesDefauts = cle[1] === 'defaults';
    }
    if (cle && (cle[1] === 'if' || cle[1] === 'continue-on-error')) {
      entete[CLES_D_UNE_ETAPE[cle[1]]] = cle[2].trim();
    }
    const shell = dansLesDefauts ? ligne.match(/^ {8}shell:(.*)$/) : null;
    if (shell) {
      entete.shell = shell[1].trim();
    }
  }
  return entete;
}

function replierLesValeurs(lignes) {
  const repliees = [];
  let colonneDeLaCle = null;
  let separateur = ' ';
  for (const ligne of lignes) {
    const indentation = ligne.search(/\S/);
    if (colonneDeLaCle !== null && (indentation === -1 || indentation > colonneDeLaCle)) {
      if (indentation !== -1) {
        repliees.push(`${repliees.pop()}${separateur}${ligne.trim()}`);
      }
      continue;
    }
    const cle = ligne.match(CLE_YAML);
    const replie = cle !== null && Object.hasOwn(CLES_D_UNE_ETAPE, cle[3]);
    colonneDeLaCle = replie ? cle[1].length + (cle[2] ?? '').length : null;
    separateur = replie && cle[4].trim().startsWith('|') ? '\n' : ' ';
    repliees.push(ligne);
  }
  return repliees;
}

function etapesDuJob(texteWorkflow, job) {
  const toutes = [];
  let courante = null;
  for (const ligne of replierLesValeurs(blocDuJob(texteWorkflow, job))) {
    const cle = ligne.match(CLE_YAML);
    if (cle?.[2] !== undefined) {
      courante = {
        nom: null,
        commande: null,
        condition: null,
        continueSurErreur: null,
        shell: null,
      };
      toutes.push(courante);
    }
    if (courante && cle && Object.hasOwn(CLES_D_UNE_ETAPE, cle[3])) {
      courante[CLES_D_UNE_ETAPE[cle[3]]] = cle[4].trim().replace(/^[|>][-+0-9]*(?:\s+|$)/, '');
    }
  }
  const etapes = toutes.filter((etape) => etape.commande !== null);
  if (etapes.length === 0) {
    throw new Error(
      `ci-portes : le job « ${job} » ne declare aucune etape « run: » - impossible d'y verifier une porte.`,
    );
  }
  return etapes;
}

function lireContexte() {
  const paquet = JSON.parse(readFileSync(CHEMIN_PACKAGE, 'utf8'));
  const scripts = analyserScripts(paquet);
  const portes = portesDuChantier(scripts);
  const texteWorkflow = readFileSync(CHEMIN_WORKFLOW, 'utf8');
  const etapes = etapesDuJob(texteWorkflow, JOB_WORKFLOW);
  return { scripts, portes, etapes };
}

function requiertLeBuild(scripts, porte) {
  return /\bdist\b/.test(scripts[porte]);
}

function scriptsLancesPar(chaine) {
  return [...(chaine ?? '').matchAll(NPM_RUN)].map((trouve) => trouve[1]);
}

function portesDeLaChaine(chaine) {
  const portes = scriptsLancesPar(chaine);
  if (portes.length === 0) {
    throw new Error(
      'ci-portes : ci:check ne joue aucune porte « npm run » - une CI comparee a une chaine vide ne serait jugee sur rien.',
    );
  }
  return portes;
}

function portesJoueesParLesJobsBloquants(texteWorkflow) {
  return [JOB_WORKFLOW, JOB_E2E, JOB_BANC].flatMap((job) =>
    etapesDuJob(texteWorkflow, job)
      .map((etape) => /^npm run ([\w:.-]+)$/.exec(etape.commande)?.[1])
      .filter((porte) => porte !== undefined)
      .map((porte) => ({ job, porte })),
  );
}

function estJoueePar(scripts, porte, jouee) {
  const { prolongee, prolongement, options } = PROLONGEMENT_DE_TEST_CI;
  return (
    jouee === porte ||
    (porte === prolongee &&
      jouee === prolongement &&
      scripts[jouee] === `${scripts[porte]} ${options}`)
  );
}

function absorbeUnEchec(script) {
  return ABSORBE_UN_ECHEC.test(script);
}

function scriptsAppelesPar(scripts, porte, vus = new Set()) {
  if (vus.has(porte)) {
    return [];
  }
  vus.add(porte);
  return [
    porte,
    ...scriptsLancesPar(scripts[porte]).flatMap((appele) =>
      scriptsAppelesPar(scripts, appele, vus),
    ),
  ];
}

function appelleNpmAutrement(script) {
  return (
    (script.match(new RegExp(APPELLE_NPM, 'g')) ?? []).length !== scriptsLancesPar(script).length
  );
}

test('ci-portes : detecte au moins une porte du chantier des lints dans le vrai package.json', () => {
  const paquet = JSON.parse(readFileSync(CHEMIN_PACKAGE, 'utf8'));
  const portes = portesDuChantier(analyserScripts(paquet));
  assert.ok(
    portes.includes('guard:cours-bundle'),
    'ci-portes : guard:cours-bundle doit etre detectee comme porte du chantier des lints.',
  );
});

test('ci-portes : chaque porte du chantier est nommee dans ci:check', () => {
  const { scripts, portes } = lireContexte();
  for (const porte of portes) {
    assert.ok(
      estNommeeDans(scripts['ci:check'], porte),
      `ci-portes : la porte « ${porte} » n'apparait pas dans ci:check.`,
    );
  }
});

test('ci-portes : chaque porte du chantier est nommee dans pre-push:check', () => {
  const { scripts, portes } = lireContexte();
  for (const porte of portes) {
    assert.ok(
      estNommeeDans(scripts['pre-push:check'], porte),
      `ci-portes : la porte « ${porte} » n'apparait pas dans pre-push:check.`,
    );
  }
});

test('ci-portes : chaque porte du chantier est nommee dans le workflow quality-gate', () => {
  const { etapes, portes } = lireContexte();
  for (const porte of portes) {
    assert.ok(
      etapes.some((etape) => estNommeeDans(etape.commande, porte)),
      `ci-portes : la porte « ${porte} » n'apparait dans aucune etape du job « ${JOB_WORKFLOW} » du workflow.`,
    );
  }
});

test('ci-portes : une porte qui inspecte dist tourne apres le build, sur les trois portails', () => {
  const { scripts, etapes, portes } = lireContexte();
  const portesSurDist = portes.filter((porte) => requiertLeBuild(scripts, porte));
  assert.ok(
    portesSurDist.length > 0,
    'ci-portes : aucune porte du chantier ne depend du build - le test d ordonnancement ne verifierait rien.',
  );
  for (const porte of portesSurDist) {
    for (const nomChaine of ['ci:check', 'pre-push:check']) {
      const chaine = scripts[nomChaine];
      const indexBuild = chaine.indexOf('npm run build');
      const indexPorte = chaine.indexOf(`npm run ${porte}`);
      assert.ok(
        indexBuild !== -1 && indexPorte !== -1 && indexBuild < indexPorte,
        `ci-portes : dans ${nomChaine}, « ${porte} » doit tourner apres « npm run build » (artefact a jour).`,
      );
    }
    const indexEtapeBuild = etapes.findIndex((etape) => /\bnpm run build\b/.test(etape.commande));
    const indexEtapePorte = etapes.findIndex((etape) => estNommeeDans(etape.commande, porte));
    assert.ok(
      indexEtapeBuild !== -1 && indexEtapePorte !== -1 && indexEtapeBuild < indexEtapePorte,
      `ci-portes : dans le workflow, l'etape de « ${porte} » doit suivre l'etape de build.`,
    );
  }
});

test('ci-portes : le depot declare des suites Playwright et des scripts qui les jouent', () => {
  const { scripts } = lireContexte();
  const portes = portesPlaywright(scripts);
  for (const porte of [PORTE_E2E_COMPLETE, PORTE_E2E_RAPIDE]) {
    assert.ok(
      portes.includes(porte),
      `ci-portes : le script « ${porte} » doit appeler « playwright test ».`,
    );
  }
});

test('ci-portes : la porte complete joue tout le projet, sans liste de fichiers', () => {
  const { scripts } = lireContexte();
  assert.deepEqual(
    suitesNommeesPar(scripts[PORTE_E2E_COMPLETE]),
    [],
    `ci-portes : « ${PORTE_E2E_COMPLETE} » ne doit nommer aucun fichier - une liste en dur laisserait une suite ajoutee plus tard hors de la porte.`,
  );
  assert.match(
    scripts[PORTE_E2E_COMPLETE],
    /SSR_BASE_URL=/,
    `ci-portes : « ${PORTE_E2E_COMPLETE} » doit fournir SSR_BASE_URL, sinon e2e/cours-sitemap.spec.ts se met lui-meme hors porte.`,
  );
  assert.match(
    scripts[PORTE_E2E_COMPLETE],
    /SSR_EN_BASE_URL=/,
    `ci-portes : « ${PORTE_E2E_COMPLETE} » doit fournir SSR_EN_BASE_URL, sinon e2e/cours-i18n-en.spec.ts se met lui-meme hors porte et /en n est plus verifie.`,
  );
  assert.ok(
    /serve:ssr:portfolio-app:en/.test(readFileSync(join(RACINE, 'playwright.config.ts'), 'utf8')),
    'ci-portes : la configuration Playwright doit lever le serveur SSR anglais, sinon SSR_EN_BASE_URL pointe vers le vide.',
  );
});

test('ci-portes : le sous-ensemble rapide ne nomme que des suites qui existent', () => {
  const { scripts } = lireContexte();
  const suites = suitesPlaywright();
  const nommees = suitesNommeesPar(scripts[PORTE_E2E_RAPIDE]);
  assert.ok(
    nommees.length > 0,
    `ci-portes : « ${PORTE_E2E_RAPIDE} » ne nomme aucune suite - le sous-ensemble du pre-push serait vide.`,
  );
  for (const nommee of nommees) {
    assert.ok(
      suites.includes(nommee),
      `ci-portes : « ${PORTE_E2E_RAPIDE} » nomme « e2e/${nommee} », qui n'existe pas sur le disque.`,
    );
  }
});

test('ci-portes : Playwright est joue par une etape du job e2e du workflow', () => {
  const texteWorkflow = readFileSync(CHEMIN_WORKFLOW, 'utf8');
  const etapes = etapesDuJob(texteWorkflow, JOB_E2E);
  const indexInstallation = etapes.findIndex((etape) =>
    /playwright install .*chromium/.test(etape.commande),
  );
  const indexBuild = etapes.findIndex((etape) => /\bnpm run build\b/.test(etape.commande));
  const indexPorte = etapes.findIndex((etape) => estNommeeDans(etape.commande, PORTE_E2E_COMPLETE));
  assert.ok(
    indexInstallation !== -1,
    `ci-portes : le job « ${JOB_E2E} » doit installer chromium avant de jouer les suites.`,
  );
  assert.ok(
    indexPorte !== -1,
    `ci-portes : le job « ${JOB_E2E} » doit jouer « npm run ${PORTE_E2E_COMPLETE} ».`,
  );
  assert.ok(
    indexInstallation < indexPorte && indexBuild !== -1 && indexBuild < indexPorte,
    `ci-portes : dans le job « ${JOB_E2E} », l installation de chromium et le build doivent preceder les suites (le serveur SSR lit dist/).`,
  );
});

test('ci-portes : aucun job bloquant ni aucune de ses commandes n est conditionne ni autorise a echouer', () => {
  const texteWorkflow = readFileSync(CHEMIN_WORKFLOW, 'utf8');
  for (const job of [JOB_WORKFLOW, JOB_E2E, JOB_BANC]) {
    assert.deepEqual(
      enteteDuJob(texteWorkflow, job),
      { condition: null, continueSurErreur: null, shell: 'bash' },
      `ci-portes : le job « ${job} » ne porte ni « if: » ni « continue-on-error: », sinon il ne juge plus chaque PR, et ses commandes tournent sous « shell: bash » (pipefail), sinon « cmd | tee » masque l echec de cmd.`,
    );
    const neutralisees = etapesDuJob(texteWorkflow, job).filter(estNeutralisee);
    assert.deepEqual(
      neutralisees,
      [],
      `ci-portes : dans le job « ${job} », une etape « run: » conditionnee, autorisee a echouer, sous un autre shell que bash, qui rattrape son echec (||, ; true, exit 0, set +e) ou qui appelle npm autrement que par la seule commande « npm ci », « npm test » ou « npm run <script> » ne peut plus faire echouer le job.`,
    );
  }
});

test('ci-portes : chaque porte de ci:check et le banc sont joues par un job bloquant', () => {
  const { scripts } = lireContexte();
  const jouees = portesJoueesParLesJobsBloquants(readFileSync(CHEMIN_WORKFLOW, 'utf8'));
  const absentes = portesDeLaChaine(scripts['ci:check']).filter(
    (porte) => !jouees.some((jouee) => estJoueePar(scripts, porte, jouee.porte)),
  );

  assert.deepEqual(
    absentes,
    [],
    'ci-portes : une porte de ci:check n est jouee par aucune etape « npm run » des jobs bloquants, elle-meme ou un script qui la prolonge d options - retirer son etape la sortirait de la CI sans bruit.',
  );
  assert.ok(
    jouees.some(({ job, porte }) => job === JOB_BANC && porte === 'test:banc'),
    `ci-portes : le job « ${JOB_BANC} » doit jouer « npm run test:banc ».`,
  );
});

test('ci-portes : leve si ci:check ne joue aucune porte', () => {
  assert.throws(() => portesDeLaChaine('ng build'), /aucune porte/);
  assert.throws(() => portesDeLaChaine(undefined), /aucune porte/);
});

test('ci-portes : une porte n est jouee que par elle-meme ou par test:cov, test:ci a la seule couverture pres', () => {
  const scripts = {
    'test:ci': 'ng test --watch=false',
    'test:cov': 'ng test --watch=false --code-coverage',
    'test:autre': 'ng test --watch=falsey',
    lint: 'eslint .',
  };

  assert.deepEqual(
    ['test:ci', 'test:cov', 'test:autre', 'lint'].map((jouee) =>
      estJoueePar(scripts, 'test:ci', jouee),
    ),
    [true, true, false, false],
  );
  assert.deepEqual(
    [
      ['test:ci', 'test:cov', 'ng test --watch=false --code-coverage || true'],
      ['test:ci', 'test:cov', 'ng test --watch=false --include=src/app/app.config.spec.ts'],
      ['test:ci', 'test:cov', 'ng test --watch=false --code-coverage | tee karma.log'],
      ['lint', 'lint:ci', 'eslint . || true'],
      ['lint', 'lint:ci', 'eslint . --code-coverage'],
    ].map(([porte, jouee, prolongement]) =>
      estJoueePar({ ...scripts, [jouee]: prolongement }, porte, jouee),
    ),
    [false, false, false, false, false],
  );
});

test('ci-portes : reconnait chaque operateur du shell qui absorbe un echec, jusque dans un script appele', () => {
  assert.deepEqual(
    [
      'eslint . || true',
      'eslint . | tee lint.log',
      'eslint . ; exit 0',
      'eslint .\ntrue',
      'eslint . & wait',
      'echo $(eslint .)',
      'echo `eslint .`',
      '! eslint .',
      'true && ! eslint .',
    ].filter((script) => !absorbeUnEchec(script)),
    [],
  );
  assert.deepEqual(
    [
      'eslint . && prettier --check "src/**/*.{ts,html}"',
      'ng test --watch=false --code-coverage',
      'SSR_BASE_URL=http://localhost:4000 npx playwright test --project=chromium',
      'npm run seo:lastmod && CI=true ng build',
    ].filter(absorbeUnEchec),
    [],
  );
  assert.deepEqual(
    scriptsAppelesPar(
      { lint: 'npm run lint:eslint && npm run lint:css', 'lint:eslint': 'eslint . || true' },
      'lint',
    ),
    ['lint', 'lint:eslint', 'lint:css'],
  );
  assert.deepEqual(
    [
      'npm --prefix . run lint:eslint',
      'npm -s run lint:eslint',
      'npm rum lint:eslint',
      'npm test',
      'npm run lint:eslint && npm exec eslint .',
      'npm run -s lint:eslint',
      'npm run --silent lint:eslint',
      'npm run --if-present lint:eslint',
      'npm run lint:eslint --if-present',
      'npm run lint:eslint -- --fix && CI=true ng build',
      'npm run seo:lastmod && CI=true ng build',
      'pnpm install --frozen-lockfile && npx playwright test',
    ].map(appelleNpmAutrement),
    [true, true, true, true, true, true, true, true, true, true, false, false],
  );
  assert.deepEqual(
    scriptsAppelesPar(
      { lint: 'npm run -s lint:eslint', 'lint:eslint': 'eslint . || true' },
      'lint',
    ),
    ['lint'],
  );
});

test('ci-portes : aucun script joue par un job bloquant n absorbe l echec d une commande', () => {
  const { scripts } = lireContexte();
  const jouees = portesJoueesParLesJobsBloquants(readFileSync(CHEMIN_WORKFLOW, 'utf8'));
  const appeles = [...new Set(jouees.flatMap(({ porte }) => scriptsAppelesPar(scripts, porte)))];

  assert.ok(
    appeles.includes('test:cov') && appeles.includes('seo:lastmod'),
    'ci-portes : les scripts joues par les jobs bloquants doivent comprendre test:cov et seo:lastmod, appele par build.',
  );
  assert.deepEqual(
    appeles.filter((nom) => absorbeUnEchec(scripts[nom] ?? '')),
    [],
    'ci-portes : npm joue un script par « sh -c », sans pipefail : « || », « | », « ; », un saut de ligne, « & », « $( », « ` » ou « ! » y rendent un echec vert en CI.',
  );
  assert.deepEqual(
    appeles.filter((nom) => appelleNpmAutrement(scripts[nom] ?? '')),
    [],
    'ci-portes : un script joue par un job bloquant n appelle npm que par « npm run <script> », sans option ni argument, seule forme dont la garde suit le script appele.',
  );
  assert.deepEqual(
    appeles.filter((nom) => scripts[nom] === undefined),
    [],
    'ci-portes : un script lance par un job bloquant doit exister dans package.json.',
  );
});

test('ci-portes : le job e2e bloque la suite du workflow', () => {
  const texteWorkflow = readFileSync(CHEMIN_WORKFLOW, 'utf8');
  const bloc = /\n {2}docker:\n([\s\S]*?)(?=\n {2}[\w-]+:\n)/.exec(texteWorkflow);
  assert.ok(bloc !== null, 'ci-portes : le job « docker » est introuvable dans le workflow.');
  assert.match(
    bloc[1],
    new RegExp(`needs:[\\s\\S]*?- ${JOB_E2E}\\b`),
    `ci-portes : le job « docker » doit dependre de « ${JOB_E2E} », sinon une suite e2e rouge n empeche rien.`,
  );
});

test('ci-portes : Lighthouse est joue apres le build du job e2e, bloque sous 0,9 d accessibilite et garde ses rapports sur le runner', () => {
  const { scripts } = lireContexte();
  const etapes = etapesDuJob(readFileSync(CHEMIN_WORKFLOW, 'utf8'), JOB_E2E);
  const indexBuild = etapes.findIndex((etape) => /\bnpm run build\b/.test(etape.commande));
  const indexLighthouse = etapes.findIndex((etape) => etape.commande === 'npm run lighthouse');
  const configuration = createRequire(import.meta.url)(CHEMIN_LIGHTHOUSE).ci;

  assert.match(
    scripts.lighthouse,
    /^lhci autorun$/,
    'ci-portes : « npm run lighthouse » doit jouer « lhci autorun », qui collecte, juge et range les rapports.',
  );
  assert.ok(
    indexBuild !== -1 && indexLighthouse !== -1 && indexBuild < indexLighthouse,
    `ci-portes : le job « ${JOB_E2E} » doit jouer « npm run lighthouse » apres le build (le serveur SSR lit dist/).`,
  );
  assert.deepEqual(
    configuration.assert.assertions['categories:accessibility'],
    ['error', { minScore: 0.9 }],
    'ci-portes : une accessibilite sous 0,9 doit faire echouer Lighthouse, donc le deploiement.',
  );
  assert.deepEqual(
    {
      performance: configuration.assert.assertions['categories:performance'],
      bonnesPratiques: configuration.assert.assertions['categories:best-practices'],
      seo: configuration.assert.assertions['categories:seo'],
    },
    {
      performance: ['warn', { minScore: 0.8 }],
      bonnesPratiques: ['warn', { minScore: 0.8 }],
      seo: ['warn', { minScore: 0.9 }],
    },
    'ci-portes : performance, bonnes pratiques et SEO avertissent sous leur seuil, sans bloquer.',
  );
  assert.deepEqual(
    configuration.upload,
    { target: 'filesystem', outputDir: '.lighthouseci/rapports' },
    'ci-portes : les rapports Lighthouse restent sur le runner (artefact .lighthouseci/), jamais sur un stockage public.',
  );
});

function extensionsDuMotif(motif) {
  const correspondance = /^\*\.(?:\{([^{}]+)\}|(\w+))$/.exec(motif);
  if (correspondance === null) {
    throw new Error(`ci-portes : motif lint-staged non reconnu : « ${motif} ».`);
  }
  return (correspondance[1] ?? correspondance[2]).split(',');
}

function extensionsPasseesAuCommitPar(outil) {
  const paquet = JSON.parse(readFileSync(CHEMIN_PACKAGE, 'utf8'));
  return Object.entries(paquet['lint-staged'])
    .filter(([, commandes]) =>
      [commandes].flat().some((commande) => commande.startsWith(`${outil} `)),
    )
    .flatMap(([motif]) => extensionsDuMotif(motif));
}

function unFichierSuiviParExtension() {
  const parExtension = new Map();
  for (const fichier of trackedFiles(RACINE)) {
    const extension = extname(fichier).slice(1);
    if (extension !== '' && !parExtension.has(extension)) parExtension.set(extension, fichier);
  }
  return parExtension;
}

test('ci-portes : au commit, prettier et eslint passent sur chaque fichier suivi qu ils savent traiter', async () => {
  const echantillons = unFichierSuiviParExtension();
  const eslint = new ESLint({ cwd: RACINE });
  const oublies = { prettier: [], eslint: [] };

  for (const [extension, fichier] of echantillons) {
    const chemin = join(RACINE, fichier);
    const { inferredParser } = await prettier.getFileInfo(chemin);
    if (inferredParser !== null && !extensionsPasseesAuCommitPar('prettier').includes(extension)) {
      oublies.prettier.push(fichier);
    }
    const linte =
      !(await eslint.isPathIgnored(chemin)) &&
      (await eslint.calculateConfigForFile(chemin)) !== undefined;
    if (linte && !extensionsPasseesAuCommitPar('eslint').includes(extension)) {
      oublies.eslint.push(fichier);
    }
  }

  assert.ok(
    ['ts', 'mts', 'html', 'scss'].every((extension) => echantillons.has(extension)),
    'ci-portes : git ls-files ne rend pas les fichiers du depot, la garde ne verrait rien.',
  );
  assert.deepEqual(
    oublies,
    { prettier: [], eslint: [] },
    'ci-portes : une extension que prettier ou eslint sait traiter echappe a lint-staged, et format:check ne lit ni scripts/ ni e2e/.',
  );
});

test('ci-portes : ci:check et pre-push:check jouent Playwright apres le build', () => {
  const { scripts } = lireContexte();
  for (const [chaine, porte] of [
    ['ci:check', PORTE_E2E_COMPLETE],
    ['pre-push:check', PORTE_E2E_RAPIDE],
  ]) {
    const indexBuild = scripts[chaine].indexOf('npm run build');
    const indexPorte = scripts[chaine].indexOf(`npm run ${porte}`);
    assert.ok(
      indexPorte !== -1,
      `ci-portes : « ${porte} » n'apparait pas dans ${chaine} - le niveau e2e resterait ecrit et jamais joue.`,
    );
    assert.ok(
      indexBuild !== -1 && indexBuild < indexPorte,
      `ci-portes : dans ${chaine}, « ${porte} » doit suivre « npm run build ».`,
    );
  }
});

test('PLANCHER ANTI-VACUITE : un perimetre e2e vide leve une erreur citant le gate', () => {
  avecDossierPlante('ci-portes-vide-', {}, (racine) => {
    assert.throws(() => suitesPlaywright(racine), /ci-portes/);
  });
  assert.throws(() => portesPlaywright({ build: 'ng build', test: 'ng test' }), /ci-portes/);
});

test('ci-portes : leve si package.json ne declare aucun script', () => {
  assert.throws(() => analyserScripts({}), /aucun script/);
  assert.throws(() => analyserScripts({ scripts: {} }), /aucun script/);
});

test('ci-portes : leve si aucune porte du chantier n est detectee dans les scripts', () => {
  assert.throws(
    () => portesDuChantier({ build: 'ng build', lint: 'eslint .' }),
    /aucune porte du chantier des lints/,
  );
});

test('ci-portes : leve si le contenu du workflow est vide', () => {
  assert.throws(() => etapesDuJob('', JOB_WORKFLOW), /vide/);
  assert.throws(() => etapesDuJob('   \n', JOB_WORKFLOW), /vide/);
});

test('ci-portes : leve si le job cible est introuvable dans le workflow', () => {
  const texte =
    'jobs:\n  autre-job:\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n';
  assert.throws(() => etapesDuJob(texte, JOB_WORKFLOW), /introuvable/);
});

test('ci-portes : lit la condition et la tolerance d echec de chaque etape, sans les preter a sa voisine', () => {
  const texte = [
    'jobs:',
    `  ${JOB_WORKFLOW}:`,
    "    if: github.event_name == 'push'",
    '    defaults:',
    '      run:',
    '        shell: bash',
    '    steps:',
    '      - name: Porte',
    '        if: false',
    '        run: npm run lint',
    '      - uses: actions/upload-artifact@v4',
    '        if: always()',
    '      - name: Tolerante',
    '        continue-on-error: true',
    '        run: npm run typecheck',
    '      - name: Bloquante',
    '        continue-on-error: false',
    '        run: npm run build',
    '      - run: npm test',
    '      - name: Rattrapee',
    '        run: npm run quality:knip || true',
    '      - name: Script',
    '        run: |',
    '          set +e',
    '',
    '          npm run test:guards',
    '      - run: |',
    '          npm run quality:dup',
    '        name: Bloc en tete',
    '        if: false',
    '      - name: Repliee',
    '        run: npm run quality:dup:tests',
    '          || true',
    '      - name: Sans pipefail',
    '        shell: sh',
    '        run: npm run build | tee build.log',
    '      - name: Pipefail defait',
    '        run: |',
    '          set +o pipefail',
    '          npm run lint | tee lint.log',
    '      - name: Errexit defait',
    '        run: |',
    '          set +eo pipefail',
    '          npm run lint',
    '      - name: Errexit en long',
    '        run: |',
    '          set +o errexit',
    '          npm run lint',
    '      - name: Condition du shell',
    '        run: if npm run lint; then :; fi',
    '      - name: Et puis',
    '        run: |',
    '          npm run lint && echo fin',
    '          echo suite',
    '      - name: Installation',
    '        run: npm ci',
    '      - name: Option avant run',
    '        run: if npm --prefix . run lint; then :; fi',
    '      - name: Silencieuse',
    '        run: |',
    '          npm -s run lint && echo lint-ok',
    '          echo fin',
    '      - name: Alias de run',
    '        run: |',
    '          set +o pipefail',
    '          npm rum lint | tee lint.log',
    '      - name: Dossier du banc',
    '        run: |',
    '          set +o errexit',
    '          npm -C . run test:banc',
    '          echo fin',
    '      - name: Navigateur',
    '        run: npx playwright install --with-deps chromium',
    '      - name: Back',
    '        run: pnpm install --frozen-lockfile',
    '      - name: Liste des scripts',
    '        run: npm run --silent',
    '      - name: Suivante',
    '        run: npm run guard:comments',
    '',
  ].join('\n');
  const etape = (nom, commande, autres = {}) => ({
    nom,
    commande,
    condition: null,
    continueSurErreur: null,
    shell: null,
    ...autres,
  });

  assert.deepEqual(enteteDuJob(texte, JOB_WORKFLOW), {
    condition: "github.event_name == 'push'",
    continueSurErreur: null,
    shell: 'bash',
  });
  assert.deepEqual(etapesDuJob(texte, JOB_WORKFLOW), [
    etape('Porte', 'npm run lint', { condition: 'false' }),
    etape('Tolerante', 'npm run typecheck', { continueSurErreur: 'true' }),
    etape('Bloquante', 'npm run build', { continueSurErreur: 'false' }),
    etape(null, 'npm test'),
    etape('Rattrapee', 'npm run quality:knip || true'),
    etape('Script', 'set +e\nnpm run test:guards'),
    etape('Bloc en tete', 'npm run quality:dup', { condition: 'false' }),
    etape('Repliee', 'npm run quality:dup:tests || true'),
    etape('Sans pipefail', 'npm run build | tee build.log', { shell: 'sh' }),
    etape('Pipefail defait', 'set +o pipefail\nnpm run lint | tee lint.log'),
    etape('Errexit defait', 'set +eo pipefail\nnpm run lint'),
    etape('Errexit en long', 'set +o errexit\nnpm run lint'),
    etape('Condition du shell', 'if npm run lint; then :; fi'),
    etape('Et puis', 'npm run lint && echo fin\necho suite'),
    etape('Installation', 'npm ci'),
    etape('Option avant run', 'if npm --prefix . run lint; then :; fi'),
    etape('Silencieuse', 'npm -s run lint && echo lint-ok\necho fin'),
    etape('Alias de run', 'set +o pipefail\nnpm rum lint | tee lint.log'),
    etape('Dossier du banc', 'set +o errexit\nnpm -C . run test:banc\necho fin'),
    etape('Navigateur', 'npx playwright install --with-deps chromium'),
    etape('Back', 'pnpm install --frozen-lockfile'),
    etape('Liste des scripts', 'npm run --silent'),
    etape('Suivante', 'npm run guard:comments'),
  ]);
  assert.deepEqual(etapesDuJob(texte, JOB_WORKFLOW).map(estNeutralisee), [
    true,
    true,
    false,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    false,
    false,
    true,
    false,
  ]);
});

test('ci-portes : leve si le job cible ne declare aucune etape run', () => {
  const texte = `jobs:\n  ${JOB_WORKFLOW}:\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n  autre-job:\n    steps:\n      - name: X\n        run: echo x\n`;
  assert.throws(() => etapesDuJob(texte, JOB_WORKFLOW), /aucune etape/);
});
