#!/usr/bin/env node
// Usage : node scripts/update-seo-lastmod.mjs [--check]
//   --check : n'ecrit pas, log les diff et exit 1 si desynchro (pour CI).

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const metadataPath = resolve(__dirname, '../src/assets/seo/seo-metadata.json');

const pathToSources = {
  '/': ['src/app/features/home', 'src/app/app.component.ts'],
  '/presentation': ['src/app/features/presentation'],
  '/projets': ['src/app/features/projets'],
  '/contact': ['src/app/features/contact'],
  '/offer': ['src/app/features/offer'],
  '/growth-audit': ['src/app/features/growth-audit'],
  '/atelier': ['src/app/features/atelier'],
  '/atelier/meteo': [
    'src/app/features/weather/weather-presentation.component.ts',
    'src/app/features/weather/weather-presentation.component.html',
    'src/app/features/weather/weather-presentation.component.scss',
    'src/app/features/weather/weather-presentation-data.ts',
  ],
  '/atelier/sebastian': [
    'src/app/features/sebastian/sebastian-presentation.component.ts',
    'src/app/features/sebastian/sebastian-presentation.component.html',
    'src/app/features/sebastian/sebastian-presentation.component.scss',
    'src/app/features/sebastian/sebastian-presentation-data.ts',
  ],
  '/formations': ['src/app/features/formations'],
  '/formations/ia-solopreneurs': [
    'src/app/features/formations/ia-solopreneurs',
  ],
  '/formations/ia-solopreneurs/toolkit': [
    'src/app/features/formations/ia-solopreneurs/toolkit',
  ],
  '/formations/automatiser-avec-ia': [
    'src/app/features/formations/automatiser-avec-ia',
  ],
  '/formations/automatiser-avec-ia/toolkit': [
    'src/app/features/formations/automatiser-avec-ia/toolkit',
  ],
  '/formations/audit-seo-diy': ['src/app/features/formations/audit-seo-diy'],
  '/formations/audit-seo-diy/toolkit': [
    'src/app/features/formations/audit-seo-diy/toolkit',
  ],
  '/cookie-settings': ['src/app/features/cookie-settings'],
  '/terms': ['src/app/features/terms'],
  '/privacy': ['src/app/features/privacy'],
  '/login': ['src/app/features/auth'],
  '/register': ['src/app/features/auth'],
  '/forgot-password': ['src/app/features/auth'],
  '/reset-password': ['src/app/features/auth'],
  '/verify-email': ['src/app/features/auth'],
  '/profil': ['src/app/features/profile'],
};

function lastCommitDate(paths) {
  try {
    const gitArgs = ['log', '-1', '--format=%ad', '--date=short', '--', ...paths];
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- outil de depot lance depuis le poste dev / la CI : figer un chemin absolu casserait les installations Homebrew (/opt/homebrew/bin), nvm ou corepack
    const result = execFileSync('git', gitArgs, {
      encoding: 'utf-8',
      cwd: resolve(__dirname, '..'),
    }).trim();
    return result || null;
  } catch {
    return null;
  }
}

function findMissingSources() {
  const missing = [];
  for (const [path, sources] of Object.entries(pathToSources)) {
    for (const source of sources) {
      if (!existsSync(resolve(__dirname, '..', source))) {
        missing.push({ path, source });
      }
    }
  }
  return missing;
}

const UP_TO_DATE_MESSAGE = '[seo-lastmod] Aucun changement (seo-metadata a jour)';

function reportMissingSources(missingSources) {
  if (missingSources.length === 0) return;
  console.error('[seo-lastmod] Sources declarees introuvables :');
  for (const m of missingSources) {
    console.error(`  ${m.path} -> ${m.source}`);
  }
}

function collectLastmodDiffs(metadata) {
  const diffs = [];
  for (const page of metadata.pages) {
    if (page.index === false) continue;
    const sources = pathToSources[page.path];
    if (!sources) continue;

    const date = lastCommitDate(sources);
    if (!date) continue;
    if (page.lastmod === date) continue;

    diffs.push({ path: page.path, old: page.lastmod, new: date });
    page.lastmod = date;
  }
  return diffs;
}

function checkExitCode(diffs, missingSources) {
  if (diffs.length > 0) {
    console.error('[seo-lastmod] Desynchronisation detectee :');
    for (const d of diffs) {
      console.error(`  ${d.path} : ${d.old} -> ${d.new}`);
    }
    console.error('Executez "npm run seo:lastmod" pour regenerer.');
  }
  if (diffs.length === 0 && missingSources.length === 0) {
    console.log(UP_TO_DATE_MESSAGE);
    return 0;
  }
  return 1;
}

// Le fichier reste edite a la main (titres, descriptions) et donc soumis a
// `format:check` : on le reformate avec Prettier lui-meme plutot que de se
// fier a JSON.stringify, dont l'eclatement systematique des tableaux courts
// laissait le depot non conforme apres chaque `npm run build`.
async function writeFormattedMetadata(metadata) {
  const prettierOptions = await resolveConfig(metadataPath);
  const formatted = await format(JSON.stringify(metadata, null, 2), {
    ...prettierOptions,
    filepath: metadataPath,
  });
  writeFileSync(metadataPath, formatted);
}

async function main() {
  const check = process.argv.includes('--check');
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  const missingSources = findMissingSources();
  reportMissingSources(missingSources);

  const diffs = collectLastmodDiffs(metadata);

  if (check) {
    const code = checkExitCode(diffs, missingSources);
    if (code !== 0) process.exit(code);
    return;
  }

  if (diffs.length === 0) {
    console.log(UP_TO_DATE_MESSAGE);
    return;
  }

  await writeFormattedMetadata(metadata);
  console.log(`[seo-lastmod] ${diffs.length} page(s) mise(s) a jour :`);
  for (const d of diffs) {
    console.log(`  ${d.path} : ${d.old} -> ${d.new}`);
  }
}

await main();
