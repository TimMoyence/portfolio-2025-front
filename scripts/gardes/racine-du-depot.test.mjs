import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { RACINE } from '../lib/depot.mjs';
import { git } from '../lib/git.cjs';

const CE_QU_UN_OUTIL_CHERCHE_A_LA_RACINE = {
  '.claude/': 'Claude Code lit ses règles et réglages ici',
  '.dockerignore': 'docker build le lit à côté du contexte',
  '.editorconfig': 'les éditeurs le cherchent en remontant',
  '.github/': 'GitHub Actions n’en lit pas d’autre',
  '.git-blame-ignore-revs': 'GitHub blame et seo:lastmod la lisent à la racine',
  '.gitignore': 'git',
  '.gitleaks.toml': 'gitleaks le découvre sans option',
  '.gitleaksignore': 'gitleaks le découvre sans option',
  '.husky/': 'core.hooksPath posé par husky',
  '.jscpd.json': 'jscpd résout path, ignore et output depuis le dossier de sa config',
  '.lighthouserc.js': 'ci-portes exige que npm run lighthouse joue lhci autorun sans option',
  'knip.json': 'ci-portes exige que quality:knip joue knip sans option',
  'commitlint.config.cjs':
    'knip ne la trouve qu’à la racine sans un réglage que ci-portes interdit',
  '.jscpd.tests.json': 'même raison que .jscpd.json',
  '.jscpd4.tests.json': 'même raison que .jscpd.json',
  '.npmrc': 'npm ne le lit qu’à la racine du projet',
  '.prettierignore': 'prettier et les éditeurs le cherchent à la racine',
  'AGENTS.md': 'agents de code',
  'CLAUDE.md': 'Claude Code',
  'CONTRIBUTING.md': 'GitHub l’affiche depuis la racine',
  'README.md': 'GitHub l’affiche depuis la racine',
  Dockerfile: 'docker build et le déploiement',
  'angular.json': 'Angular CLI',
  'config/': 'les configs qu’un outil lit par --config ou par package.json',
  'contrat/': 'types générés du contrat du back (ADR 0005)',
  'contrat.json': 'épingle du commit du back, lue par la CI et npm run contrat',
  'docs/': 'documentation',
  'e2e/': 'Playwright, que testDir désigne',
  'eslint.config.js': 'ESLint et les éditeurs ne lisent la config plate qu’à la racine',
  'karma.conf.cjs': 'karma résout basePath depuis le dossier de sa config',
  'package-lock.json': 'npm',
  'package.json': 'npm',
  'playwright.config.ts': 'Playwright le cherche à la racine, testDir est relatif à lui',
  'postcss.config.js': 'le builder Angular le cherche à la racine du workspace',
  'scripts/': 'outillage du dépôt',
  'src/': 'code',
  'tailwind.config.js': 'tailwind le cherche à la racine',
  'tsconfig.json': 'tsc et les éditeurs',
  'tsconfig.spec.json': 'angular.json, extends et include relatifs à son dossier',
};

test('la racine ne garde que ce qu’un outil y cherche ; une config lue par --config vit dans config/', () => {
  const entrees = new Set(
    git(RACINE, ['ls-files', '--cached', '--others', '--exclude-standard'])
      .split('\n')
      .filter((chemin) => chemin && existsSync(join(RACINE, chemin)))
      .map((chemin) => (chemin.includes('/') ? `${chemin.split('/')[0]}/` : chemin)),
  );

  assert.deepEqual(
    [...entrees]
      .filter((entree) => !Object.hasOwn(CE_QU_UN_OUTIL_CHERCHE_A_LA_RACINE, entree))
      .sort((a, b) => a.localeCompare(b)),
    [],
  );
});
