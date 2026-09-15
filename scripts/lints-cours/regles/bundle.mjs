import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PORTE } from '../porte.mjs';

export const ID_BUNDLE = 'corrige-dans-le-bundle';

export const CLE_CORRIGE = 'misconception';

export const EXTENSIONS_INSPECTEES = ['.js', '.mjs', '.cjs', '.json', '.html'];

export const RACINE_PAR_DEFAUT = 'dist';

const INSPECTEES = new Set(EXTENSIONS_INSPECTEES);

const LITTERAUX = String.raw`["'\`]|null(?![\w$])|undefined(?![\w$])|true(?![\w$])|false(?![\w$])|\d`;

const FUITE = new RegExp(
  String.raw`(?<=^|[{,\s])(["'\`]?)${CLE_CORRIGE}\1\s*:\s*(?:${LITTERAUX})`,
  'g',
);

const LONGUEUR_EXTRAIT = 64;

const BLANCS = /\s+/g;

/**
 * @typedef {object} FuiteDeCorrige
 * @property {string} fichier
 * @property {number} position
 * @property {string} extrait
 */

/**
 * @typedef {object} RapportDeSortie
 * @property {string} racine
 * @property {boolean} existe
 * @property {number} fichiers
 * @property {number} octets
 * @property {readonly FuiteDeCorrige[]} fuites
 */

/**
 * @param {string} contenu
 * @returns {{ position: number, extrait: string }[]}
 */
function fuitesDans(contenu) {
  FUITE.lastIndex = 0;
  const trouvees = [];
  let trouve = FUITE.exec(contenu);
  while (trouve !== null) {
    trouvees.push({
      position: trouve.index,
      extrait: contenu
        .slice(trouve.index, trouve.index + LONGUEUR_EXTRAIT)
        .replace(BLANCS, ' ')
        .trim(),
    });
    trouve = FUITE.exec(contenu);
  }
  return trouvees;
}

/**
 * @param {string} racine
 * @returns {string[]}
 */
function fichiersInspectables(racine) {
  const restants = [racine];
  const trouves = [];
  while (restants.length > 0) {
    const dossier = restants.pop();
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name);
      if (entree.isDirectory()) {
        restants.push(chemin);
      } else if (entree.isFile() && INSPECTEES.has(extname(entree.name).toLowerCase())) {
        trouves.push(chemin);
      }
    }
  }
  return trouves.sort();
}

/**
 * @param {string} racine
 * @returns {boolean}
 */
function estDossier(racine) {
  try {
    return statSync(racine).isDirectory();
  } catch {
    return false;
  }
}

/**
 * @param {string} racine
 * @returns {RapportDeSortie}
 */
export function inspecterSortie(racine) {
  if (typeof racine !== 'string' || racine.trim() === '') {
    throw new Error(
      `${PORTE} : la règle « ${ID_BUNDLE} » a reçu un chemin de sortie vide — elle inspecterait n'importe quoi en croyant lire un bundle.`,
    );
  }
  if (!estDossier(racine)) {
    return { racine, existe: false, fichiers: 0, octets: 0, fuites: [] };
  }
  const chemins = fichiersInspectables(racine);
  /** @type {FuiteDeCorrige[]} */
  const fuites = [];
  let octets = 0;
  for (const chemin of chemins) {
    const brut = readFileSync(chemin);
    octets += brut.length;
    const fichier = relative(racine, chemin).split(sep).join('/');
    for (const fuite of fuitesDans(brut.toString('utf8'))) {
      fuites.push({ fichier, position: fuite.position, extrait: fuite.extrait });
    }
  }
  return { racine, existe: true, fichiers: chemins.length, octets, fuites };
}

/**
 * @param {RapportDeSortie} rapport
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function manquementsDe(rapport) {
  if (!rapport.existe) {
    return [
      {
        ecran: null,
        raison: `${PORTE} : le répertoire de sortie « ${rapport.racine} » n'est pas un répertoire lisible — la règle « ${ID_BUNDLE} » rendrait « aucune fuite » sur un bundle qu'elle n'a jamais ouvert.`,
      },
    ];
  }
  if (rapport.octets === 0) {
    return [
      {
        ecran: null,
        raison: `${PORTE} : 0 octet inspecté sous « ${rapport.racine} », pour ${rapport.fichiers} fichier(s) portant l'une des extensions ${EXTENSIONS_INSPECTEES.join(', ')} — un succès sans lecture n'atteste rien.`,
      },
    ];
  }
  return rapport.fuites.map((fuite) => ({
    ecran: fuite.fichier,
    raison: `le fichier « ${fuite.fichier} » porte « ${CLE_CORRIGE} » suivi d'une valeur littérale à l'octet ${fuite.position} : ${fuite.extrait} — une valeur nulle y désigne la bonne réponse par élimination tout autant qu'une valeur en clair, puisque seule la bonne option n'a pas de piège.`,
  }));
}

/**
 * @param {string} racine
 * @returns {{ rapport: RapportDeSortie, manquements: import('../moteur.mjs').Manquement[] }}
 */
export function verifierSortie(racine) {
  const rapport = inspecterSortie(racine);
  return { rapport, manquements: manquementsDe(rapport) };
}

/**
 * @param {string} racine
 * @returns {import('../moteur.mjs').Regle}
 */
export function creerRegleBundle(racine) {
  return { id: ID_BUNDLE, controler: () => verifierSortie(racine).manquements };
}

/**
 * @param {readonly string[]} parametres
 * @param {(ligne: string) => void} [ecrire]
 * @returns {number}
 */
export function executerCli(parametres, ecrire = (ligne) => process.stdout.write(`${ligne}\n`)) {
  const racine = parametres[0] ?? RACINE_PAR_DEFAUT;
  const { rapport, manquements } = verifierSortie(racine);
  ecrire(
    `${PORTE} : ${rapport.octets} octet(s) inspecté(s) dans ${rapport.fichiers} fichier(s) sous « ${racine} ».`,
  );
  for (const manquement of manquements) {
    ecrire(`  ${ID_BUNDLE} : ${manquement.raison}`);
  }
  return manquements.length === 0 ? 0 : 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = executerCli(process.argv.slice(2));
}
