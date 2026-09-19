import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));

const CHEMIN_PACKAGE = join(RACINE, 'package.json');

const CHEMIN_WORKFLOW = join(RACINE, '.github/workflows/ci.yml');

const JOB_WORKFLOW = 'quality-gate';

const JOB_E2E = 'e2e';

const PORTE_E2E_COMPLETE = 'test:e2e:portail';

const PORTE_E2E_RAPIDE = 'test:e2e:cours';

const SUITE_VISUELLE = 'visual-regression.spec.ts';

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

function nomEchappe(porte) {
  return porte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function estNommeeDans(chaine, porte) {
  return (
    typeof chaine === 'string' && new RegExp(`\\bnpm run ${nomEchappe(porte)}\\b`).test(chaine)
  );
}

function etapesDuJob(texteWorkflow, job) {
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
  const bloc = lignes.slice(debutJob + 1, finJob === -1 ? lignes.length : finJob);
  const etapes = [];
  let nomCourant = null;
  for (const ligne of bloc) {
    const nomTrouve = ligne.match(/^\s*-\s*name:(.*)$/);
    if (nomTrouve) {
      nomCourant = nomTrouve[1].trim();
      continue;
    }
    const commandeTrouvee = ligne.match(/^\s*run:(.*)$/);
    if (commandeTrouvee && nomCourant) {
      etapes.push({ nom: nomCourant, commande: commandeTrouvee[1].trim() });
      nomCourant = null;
    }
  }
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
  assert.ok(
    suitesPlaywright().includes(SUITE_VISUELLE),
    'ci-portes : la suite de regression visuelle doit rester detectee comme suite Playwright.',
  );
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
  const racine = mkdtempSync(join(tmpdir(), 'ci-portes-vide-'));
  try {
    assert.throws(() => suitesPlaywright(racine), /ci-portes/);
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
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

test('ci-portes : leve si le job cible ne declare aucune etape run', () => {
  const texte = `jobs:\n  ${JOB_WORKFLOW}:\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n  autre-job:\n    steps:\n      - name: X\n        run: echo x\n`;
  assert.throws(() => etapesDuJob(texte, JOB_WORKFLOW), /aucune etape/);
});
