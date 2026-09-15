import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

export const GATE = 'guard-cours-runtime';

const AD2 = 'AD-2';
const AD4 = 'AD-4';

const RACINE_COURS = 'src/cours';
const RACINE_APP = 'src/app';
const PREFIXE_COURS = `${RACINE_COURS}/`;
const PREFIXE_CONTENU = `${RACINE_COURS}/content/`;
const PREFIXE_TESTS = 'src/testing/';
const PREFIXE_PUPITRE = `${RACINE_APP}/features/cours/presentateur/`;
const EXTENSIONS = ['.ts', '.html'];

const FRAMEWORKS_INTERDITS = ['@angular', 'rxjs', 'zone.js'];
const OUVERTURE_TYPE = /^\s*(?:export\s+)?(?:declare\s+)?(?:interface\s+\w|type\s+\w[^=]*=)/;
const DECLARATION_TYPE = /^\s*(?:export|import)\s+type\s/;
const TERMES_CORRIGE = [
  'misconception',
  'correcte',
  'solution',
  'bareme',
  'barème',
  'corrige',
  'corrigé',
  'correction',
  'bonnereponse',
  'bonneréponse',
  'reponseattendue',
  'réponseattendue',
];

const MOTIFS_SPECIFICATION = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const POURQUOI = {
  [AD2]:
    "AD-2 : src/cours/ doit pouvoir etre exporte tel quel en fichier HTML autoporte, ouvrable hors ligne sans Angular ni bundler. Un import de framework, meme dynamique ou a effet de bord, et toute remontee relative hors de src/cours/ rendent cet export impossible.",
  [AD4]:
    "AD-4 : la surface cours (src/cours/content/ et les fichiers cours de src/app/) est compilee dans le fichier JavaScript que le navigateur de l etudiant telecharge. Tout ce qu elle contient est public : il suffit d ouvrir les sources et d y chercher le mot. La bonne reponse, les misconceptions et le bareme ne franchissent jamais cette frontiere, sous aucun nom. Seul le pupitre formateur (src/app/features/cours/presentateur/) nomme le corrige, qu il recoit au runtime du deroule authentifie ; aucun autre fichier de la surface cours ne l importe, sans quoi son exemption ferait entrer le corrige dans le code de l etudiant.",
};

/**
 * @param {string} depot
 * @param {string} racine
 * @returns {string[]}
 */
export function collecterFichiers(depot, racine) {
  if (!existsSync(join(depot, racine))) {
    return [];
  }
  return readdirSync(join(depot, racine)).flatMap((entree) => {
    const relatif = `${racine}/${entree}`;
    if (statSync(join(depot, relatif)).isDirectory()) {
      return collecterFichiers(depot, relatif);
    }
    return EXTENSIONS.some((extension) => entree.endsWith(extension)) ? [relatif] : [];
  });
}

/**
 * @param {string} fichier
 * @returns {boolean}
 */
export function estFichierDeTest(fichier) {
  return /\.(spec|test)\.[cm]?[jt]sx?$/.test(fichier);
}

/**
 * @param {string} fichier
 * @returns {boolean}
 */
export function estSurfaceCours(fichier) {
  if (fichier.startsWith(PREFIXE_CONTENU)) {
    return true;
  }
  return fichier.startsWith(`${RACINE_APP}/`) && fichier.includes('cours');
}

/**
 * @param {string} fichier
 * @returns {boolean}
 */
export function estPupitreFormateur(fichier) {
  return fichier.startsWith(PREFIXE_PUPITRE);
}

/**
 * @param {string} contenu
 * @returns {{ specification: string, ligne: number }[]}
 */
export function specifications(contenu) {
  return contenu.split('\n').flatMap((texte, index) =>
    MOTIFS_SPECIFICATION.flatMap((motif) =>
      [...texte.matchAll(motif)].map((trouve) => ({
        specification: trouve[1],
        ligne: index + 1,
      })),
    ),
  );
}

/**
 * @param {string} specification
 * @returns {boolean}
 */
function estFramework(specification) {
  return FRAMEWORKS_INTERDITS.some(
    (nom) => specification === nom || specification.startsWith(`${nom}/`),
  );
}

/**
 * @param {string} fichier
 * @param {string} specification
 * @returns {boolean}
 */
function sortDeCours(fichier, specification) {
  if (!specification.startsWith('.')) {
    return false;
  }
  const cible = posix.normalize(posix.join(posix.dirname(fichier), specification));
  if (cible.startsWith(PREFIXE_COURS)) {
    return false;
  }
  return !(estFichierDeTest(fichier) && cible.startsWith(PREFIXE_TESTS));
}

/**
 * @param {string} fichier
 * @param {string} specification
 * @returns {string | null}
 */
function motifDeRefus(fichier, specification) {
  if (estFramework(specification)) {
    return `import du framework interdit « ${specification} »`;
  }
  if (sortDeCours(fichier, specification)) {
    return `remontee hors de src/cours/ vers « ${specification} »`;
  }
  return null;
}

/**
 * @param {string} fichier
 * @param {string} specification
 * @returns {boolean}
 */
function viseLePupitre(fichier, specification) {
  if (!specification.startsWith('.')) {
    return false;
  }
  const cible = posix.normalize(posix.join(posix.dirname(fichier), specification));
  return `${cible}/`.startsWith(PREFIXE_PUPITRE);
}

/**
 * @param {{ fichier: string, contenu: string }} entree
 * @returns {{ fichier: string, ligne: number, regle: string, raison: string, extrait: string }[]}
 */
export function analyserImportsDuPupitre({ fichier, contenu }) {
  if (!estSurfaceCours(fichier) || estFichierDeTest(fichier) || estPupitreFormateur(fichier)) {
    return [];
  }
  const lignes = contenu.split('\n');
  return specifications(contenu)
    .filter(({ specification }) => viseLePupitre(fichier, specification))
    .map(({ specification, ligne }) => ({
      fichier,
      ligne,
      regle: AD4,
      raison: `import du pupitre formateur « ${specification} »`,
      extrait: lignes[ligne - 1].trim(),
    }));
}

/**
 * @param {{ fichier: string, contenu: string }} entree
 * @returns {{ fichier: string, ligne: number, regle: string, raison: string, extrait: string }[]}
 */
export function analyserFrontiere({ fichier, contenu }) {
  const lignes = contenu.split('\n');
  return specifications(contenu).flatMap(({ specification, ligne }) => {
    const raison = motifDeRefus(fichier, specification);
    return raison === null
      ? []
      : [{ fichier, ligne, regle: AD2, raison, extrait: lignes[ligne - 1].trim() }];
  });
}

/**
 * @param {string} contenu
 * @returns {Set<number>}
 */
function lignesEffacees(contenu) {
  const effacees = new Set();
  let profondeur = 0;
  contenu.split('\n').forEach((texte, index) => {
    const entre = profondeur === 0 && OUVERTURE_TYPE.test(texte);
    if (profondeur > 0 || entre || DECLARATION_TYPE.test(texte)) {
      effacees.add(index);
    }
    if (profondeur > 0 || entre) {
      profondeur += compter(texte, '{') - compter(texte, '}');
    }
  });
  return effacees;
}

/**
 * @param {string} texte
 * @param {string} caractere
 * @returns {number}
 */
function compter(texte, caractere) {
  return texte.split(caractere).length - 1;
}

/**
 * @param {{ fichier: string, contenu: string }} entree
 * @returns {{ fichier: string, ligne: number, regle: string, raison: string, extrait: string }[]}
 */
export function analyserCorrige({ fichier, contenu }) {
  if (!estSurfaceCours(fichier) || estFichierDeTest(fichier) || estPupitreFormateur(fichier)) {
    return [];
  }
  const effacees = lignesEffacees(contenu);
  return contenu.split('\n').flatMap((texte, index) => {
    if (effacees.has(index)) {
      return [];
    }
    const minuscule = texte.toLowerCase();
    return TERMES_CORRIGE.filter((terme) => minuscule.includes(terme)).map((terme) => ({
      fichier,
      ligne: index + 1,
      regle: AD4,
      raison: `donnee de correction « ${terme} »`,
      extrait: texte.trim().slice(0, 120),
    }));
  });
}

/**
 * @param {{ root?: string }} [options]
 * @returns {{ violations: ReturnType<typeof analyserCorrige>, inspectes: number, code: number }}
 */
export function runGuard({ root = '.' } = {}) {
  const fichiers = [
    ...collecterFichiers(root, RACINE_COURS),
    ...collecterFichiers(root, RACINE_APP).filter(estSurfaceCours),
  ];
  if (fichiers.length === 0) {
    throw new Error(`${GATE}: aucun fichier inspecte — une garde au perimetre vide ne garde rien.`);
  }
  const violations = fichiers.flatMap((fichier) => {
    const entree = { fichier, contenu: readFileSync(join(root, fichier), 'utf8') };
    const frontiere = fichier.startsWith(PREFIXE_COURS) ? analyserFrontiere(entree) : [];
    return [...frontiere, ...analyserCorrige(entree), ...analyserImportsDuPupitre(entree)];
  });
  return { violations, inspectes: fichiers.length, code: violations.length > 0 ? 1 : 0 };
}

/**
 * @param {{ violations: ReturnType<typeof analyserCorrige>, inspectes: number }} resultat
 * @returns {string}
 */
export function formatViolations({ violations, inspectes }) {
  const attestation = `${GATE}: ${inspectes} fichier(s) inspecte(s), ${violations.length} violation(s).`;
  if (violations.length === 0) {
    return attestation;
  }
  const lignes = violations.map(
    (violation) =>
      `  ${violation.fichier}:${violation.ligne} — [${violation.regle}] ${violation.raison}\n      ${violation.extrait}`,
  );
  const regles = [...new Set(violations.map((violation) => violation.regle))].sort();
  return [`${GATE}: REFUS`, ...lignes, ...regles.map((regle) => POURQUOI[regle]), attestation].join(
    '\n',
  );
}

/**
 * @returns {number}
 */
export function main() {
  const resultat = runGuard({ root: '.' });
  const sortie = formatViolations(resultat);
  if (resultat.code === 0) {
    console.log(sortie);
  } else {
    console.error(sortie);
  }
  return resultat.code;
}
