#!/usr/bin/env node
// Met a jour automatiquement la valeur `lastmod` de chaque page dans
// src/assets/seo/seo-metadata.json a partir de la date du dernier commit
// qui a modifie les fichiers sources associes a la page.
//
// Mapping page -> sources derive par convention :
//   - "/" -> src/app/features/home/
//   - "/presentation" -> src/app/features/presentation/
//   - "/contact" -> src/app/features/contact/
//   - "/offer" -> src/app/features/offer/
//   - "/growth-audit" -> src/app/features/growth-audit/
//   - "/client-project" -> src/app/features/client-project/
//   - "/formations" -> src/app/features/formations/
//   - "/formations/ia-solopreneurs" -> src/app/features/formations/ia-solopreneurs/
//   - "/cookie-settings" -> src/app/features/cookie-settings/
//   - "/terms" -> src/app/features/terms/
//   - "/privacy" -> src/app/features/privacy/
//   - "/login", "/register", "/forgot-password", "/reset-password", "/verify-email",
//     "/profil" -> src/app/features/auth/ et src/app/features/profil/
//
// Les routes non-indexables (index: false) sont ignorees pour eviter le
// bruit sur les ateliers.
//
// Usage : node scripts/update-seo-lastmod.mjs [--check]
//   --check : n'ecrit pas, log les diff et exit 1 si desynchro (pour CI).

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const metadataPath = resolve(__dirname, '../src/assets/seo/seo-metadata.json');

/**
 * Table de correspondance explicite path URL -> repertoires sources.
 * Plusieurs repertoires possibles pour une page (ex: auth partage les 6 routes).
 */
const pathToSources = {
  '/': ['src/app/features/home', 'src/app/app.component.ts'],
  '/presentation': ['src/app/features/presentation'],
  '/contact': ['src/app/features/contact'],
  '/offer': ['src/app/features/offer'],
  '/growth-audit': ['src/app/features/growth-audit'],
  '/client-project': ['src/app/features/client-project'],
  '/formations': ['src/app/features/formations'],
  '/formations/ia-solopreneurs': [
    'src/app/features/formations/ia-solopreneurs',
  ],
  '/cookie-settings': ['src/app/features/cookie-settings'],
  '/terms': ['src/app/features/terms'],
  '/privacy': ['src/app/features/privacy'],
  '/login': ['src/app/features/auth'],
  '/register': ['src/app/features/auth'],
  '/forgot-password': ['src/app/features/auth'],
  '/reset-password': ['src/app/features/auth'],
  '/verify-email': ['src/app/features/auth'],
  '/profil': ['src/app/features/profil'],
};

/**
 * Retourne la date ISO (YYYY-MM-DD) du dernier commit ayant touche
 * l'un des chemins fournis. Retourne null si aucun commit.
 */
function lastCommitDate(paths) {
  try {
    const result = execSync(
      `git log -1 --format=%ad --date=short -- ${paths.map((p) => `"${p}"`).join(' ')}`,
      { encoding: 'utf-8', cwd: resolve(__dirname, '..') },
    )
      .trim();
    return result || null;
  } catch {
    return null;
  }
}

function main() {
  const check = process.argv.includes('--check');
  const raw = readFileSync(metadataPath, 'utf-8');
  const metadata = JSON.parse(raw);

  const diffs = [];
  let updatedCount = 0;

  for (const page of metadata.pages) {
    if (page.index === false) continue; // skip non-indexables
    const sources = pathToSources[page.path];
    if (!sources) continue; // pas de mapping declare, on preserve le lastmod existant

    const date = lastCommitDate(sources);
    if (!date) continue;

    if (page.lastmod !== date) {
      diffs.push({ path: page.path, old: page.lastmod, new: date });
      page.lastmod = date;
      updatedCount++;
    }
  }

  if (diffs.length === 0) {
    console.log('[seo-lastmod] Aucun changement (seo-metadata a jour)');
    return;
  }

  if (check) {
    console.error('[seo-lastmod] Desynchronisation detectee :');
    for (const d of diffs) {
      console.error(`  ${d.path} : ${d.old} -> ${d.new}`);
    }
    console.error('Executez "npm run seo:lastmod" pour regenerer.');
    process.exit(1);
  }

  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
  console.log(`[seo-lastmod] ${updatedCount} page(s) mise(s) a jour :`);
  for (const d of diffs) {
    console.log(`  ${d.path} : ${d.old} -> ${d.new}`);
  }
}

main();
