#!/usr/bin/env node
// Met a jour automatiquement la valeur `lastmod` de chaque page dans
// src/assets/seo/seo-metadata.json a partir de la date du dernier commit
// qui a modifie les fichiers sources associes a la page.
//
// Le mapping page -> sources est declare explicitement dans `pathToSources`
// ci-dessous : repertoire de feature quand la page occupe tout un dossier,
// fichiers precis quand plusieurs pages cohabitent dans le meme dossier
// (ex: les landings /atelier/* vivent a cote du code de l'app correspondante).
//
// Les routes non-indexables (index: false) sont ignorees pour eviter le
// bruit sur les ateliers.
//
// Usage : node scripts/update-seo-lastmod.mjs [--check]
//   --check : n'ecrit pas, log les diff et exit 1 si desynchro (pour CI).

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const metadataPath = resolve(__dirname, '../src/assets/seo/seo-metadata.json');

/**
 * Table de correspondance explicite path URL -> sources (repertoires ou
 * fichiers). Plusieurs sources possibles pour une page (ex: auth partage
 * les 6 routes d'authentification).
 */
const pathToSources = {
  '/': ['src/app/features/home', 'src/app/app.component.ts'],
  '/presentation': ['src/app/features/presentation'],
  '/projets': ['src/app/features/projets'],
  '/contact': ['src/app/features/contact'],
  '/offer': ['src/app/features/offer'],
  '/growth-audit': ['src/app/features/growth-audit'],
  '/atelier': ['src/app/features/atelier'],
  // Les landings marketing des ateliers cohabitent avec le code des apps :
  // on cible les fichiers de la page, pas tout le dossier de l'app, sinon
  // le moindre commit sur l'app decalerait le lastmod de la landing.
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

/**
 * Verifie que chaque source declaree dans `pathToSources` existe reellement.
 * Un chemin obsolete rend le mapping silencieusement inoperant (git log ne
 * retourne rien, le lastmod reste fige) : on le signale explicitement.
 *
 * @returns La liste des entrees `page -> source` introuvables.
 */
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

async function main() {
  const check = process.argv.includes('--check');
  const raw = readFileSync(metadataPath, 'utf-8');
  const metadata = JSON.parse(raw);

  const missingSources = findMissingSources();
  if (missingSources.length > 0) {
    console.error('[seo-lastmod] Sources declarees introuvables :');
    for (const m of missingSources) {
      console.error(`  ${m.path} -> ${m.source}`);
    }
  }

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

  if (check) {
    if (diffs.length > 0) {
      console.error('[seo-lastmod] Desynchronisation detectee :');
      for (const d of diffs) {
        console.error(`  ${d.path} : ${d.old} -> ${d.new}`);
      }
      console.error('Executez "npm run seo:lastmod" pour regenerer.');
    }
    if (diffs.length === 0 && missingSources.length === 0) {
      console.log('[seo-lastmod] Aucun changement (seo-metadata a jour)');
      return;
    }
    process.exit(1);
  }

  if (diffs.length === 0) {
    console.log('[seo-lastmod] Aucun changement (seo-metadata a jour)');
    return;
  }

  // Le fichier reste edite a la main (titres, descriptions) et donc soumis a
  // `format:check` : on le reformate avec Prettier lui-meme plutot que de se
  // fier a JSON.stringify, dont l'eclatement systematique des tableaux courts
  // laissait le depot non conforme apres chaque `npm run build`.
  const prettierOptions = await resolveConfig(metadataPath);
  const formatted = await format(JSON.stringify(metadata, null, 2), {
    ...prettierOptions,
    filepath: metadataPath,
  });
  writeFileSync(metadataPath, formatted);
  console.log(`[seo-lastmod] ${updatedCount} page(s) mise(s) a jour :`);
  for (const d of diffs) {
    console.log(`  ${d.path} : ${d.old} -> ${d.new}`);
  }
}

await main();
