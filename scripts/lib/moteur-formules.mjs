import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '../..');

export const CHEMIN_MOTEUR = 'src/cours/runtime/core/formula.ts';

const CHEMIN_COMPILATEUR = 'node_modules/typescript/lib/typescript.js';

const PREFIXE_DOSSIER = 'moteur-formules-';

/**
 * @returns {Promise<{ moteur: any, liberer: () => void }>}
 */
export async function chargerMoteur() {
  const { default: ts } = await import(pathToFileURL(join(RACINE, CHEMIN_COMPILATEUR)).href);
  const transpile = ts.transpileModule(readFileSync(join(RACINE, CHEMIN_MOTEUR), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const dossier = mkdtempSync(join(tmpdir(), PREFIXE_DOSSIER));
  const fichier = join(dossier, 'moteur.mjs');
  writeFileSync(fichier, transpile.outputText, 'utf8');
  const moteur = await import(pathToFileURL(fichier).href);
  return { moteur, liberer: () => rmSync(dossier, { recursive: true, force: true }) };
}
