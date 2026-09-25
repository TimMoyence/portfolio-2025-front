import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { cheminDuDepot, lireTexte } from './depot.mjs';
import { planterDossier, supprimerDossier } from './dossier-temporaire.mjs';

export const CHEMIN_MOTEUR = 'src/cours/runtime/core/formula.ts';

const CHEMIN_COMPILATEUR = 'node_modules/typescript/lib/typescript.js';

const PREFIXE_DOSSIER = 'moteur-formules-';

const FICHIER_MOTEUR = 'moteur.mjs';

/**
 * @returns {Promise<{ moteur: any, liberer: () => void }>}
 */
export async function chargerMoteur() {
  const { default: ts } = await import(pathToFileURL(cheminDuDepot(CHEMIN_COMPILATEUR)).href);
  const transpile = ts.transpileModule(lireTexte(cheminDuDepot(CHEMIN_MOTEUR)), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const dossier = planterDossier(PREFIXE_DOSSIER, { [FICHIER_MOTEUR]: transpile.outputText });
  const moteur = await import(pathToFileURL(join(dossier, FICHIER_MOTEUR)).href);
  return { moteur, liberer: () => supprimerDossier(dossier) };
}
