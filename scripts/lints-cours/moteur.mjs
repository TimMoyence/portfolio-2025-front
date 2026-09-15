import { PORTE } from './porte.mjs';
import { REGLES_BRIQUES } from './regles/briques.mjs';
import { REGLES_INTEGRITE } from './regles/integrite.mjs';
import { REGLES_RYTHME } from './regles/rythme.mjs';

export { PORTE };

const DEROGATION_SANS_JUSTIFICATION = 'derogation-sans-justification';
const DEROGATION_REGLE_INCONNUE = 'derogation-regle-inconnue';

const TYPE_CLASSEMENT = 'classement';

/**
 * @typedef {object} Ecran
 * @property {string} id
 * @property {string} type
 * @property {number} duree
 * @property {boolean} interactif
 * @property {Record<string, unknown>} [donnees]
 */

/**
 * @typedef {object} Cours
 * @property {string} id
 * @property {string} titre
 * @property {string} niveau
 * @property {number} duree
 * @property {readonly string[]} concepts
 * @property {readonly Ecran[]} ecrans
 */

/**
 * @typedef {object} Manquement
 * @property {string | null} ecran
 * @property {string} raison
 */

/**
 * @typedef {object} Regle
 * @property {string} id
 * @property {(cours: Cours) => readonly Manquement[]} controler
 */

/**
 * @typedef {object} Violation
 * @property {string} regle
 * @property {string | null} ecran
 * @property {string} raison
 */

/**
 * @typedef {object} Derogation
 * @property {string} regle
 * @property {string | null} [ecran]
 * @property {string} [raison]
 */

/**
 * @param {Cours} cours
 * @returns {readonly Ecran[]}
 */
function ecransDe(cours) {
  return Array.isArray(cours?.ecrans) ? cours.ecrans : [];
}

/**
 * @param {Cours} cours
 * @returns {Manquement[]}
 */
function controlerClassementPublic(cours) {
  return ecransDe(cours).flatMap((ecran, index) => {
    const identifiant = typeof ecran?.id === 'string' && ecran.id !== '' ? ecran.id : `#${index}`;
    if (ecran?.type !== TYPE_CLASSEMENT) {
      return [];
    }
    return [
      {
        ecran: identifiant,
        raison: `l'écran « ${identifiant} » est de type « ${TYPE_CLASSEMENT} » : aucun palmarès nominatif n'est publié devant la classe.`,
      },
    ];
  });
}

/** @type {readonly Regle[]} */
export const REGLES = [
  ...REGLES_RYTHME,
  { id: 'classement-public', controler: controlerClassementPublic },
  ...REGLES_INTEGRITE,
  ...REGLES_BRIQUES,
];

/**
 * @param {readonly Regle[]} regles
 * @returns {Set<string>}
 */
function identifiantsDeRegles(regles) {
  if (!Array.isArray(regles) || regles.length === 0) {
    throw new Error(
      `${PORTE} : table de règles vide — une porte qui n'exécute aucune règle rend « aucune violation » sur n'importe quel cours.`,
    );
  }
  const identifiants = new Set();
  for (const regle of regles) {
    if (typeof regle?.id !== 'string' || regle.id.trim() === '') {
      throw new Error(`${PORTE} : règle sans identifiant dans la table.`);
    }
    if (typeof regle.controler !== 'function') {
      throw new Error(`${PORTE} : la règle « ${regle.id} » n'expose aucun contrôleur.`);
    }
    if (identifiants.has(regle.id)) {
      throw new Error(
        `${PORTE} : la règle « ${regle.id} » est déclarée deux fois — la seconde masquerait la première.`,
      );
    }
    identifiants.add(regle.id);
  }
  return identifiants;
}

/**
 * @param {Regle} regle
 * @param {Cours} cours
 * @returns {Violation[]}
 */
function executer(regle, cours) {
  const manquements = regle.controler(cours);
  if (!Array.isArray(manquements)) {
    throw new Error(
      `${PORTE} : la règle « ${regle.id} » ne rend pas un tableau de manquements — une règle muette vaut une règle absente.`,
    );
  }
  return manquements.map((manquement) => {
    if (typeof manquement?.raison !== 'string' || manquement.raison.trim() === '') {
      throw new Error(
        `${PORTE} : la règle « ${regle.id} » rend un manquement sans raison — un verdict qui ne dit pas pourquoi ne sert à rien.`,
      );
    }
    return {
      regle: regle.id,
      ecran: typeof manquement.ecran === 'string' ? manquement.ecran : null,
      raison: manquement.raison,
    };
  });
}

/**
 * @param {Cours} cours
 * @param {readonly Regle[]} [regles]
 * @returns {Violation[]}
 */
export function analyser(cours, regles = REGLES) {
  identifiantsDeRegles(regles);
  return regles.flatMap((regle) => executer(regle, cours));
}

/**
 * @param {Derogation} derogation
 * @returns {boolean}
 */
function estJustifiee(derogation) {
  return typeof derogation?.raison === 'string' && derogation.raison.trim() !== '';
}

/**
 * @param {Violation} violation
 * @param {Derogation} derogation
 * @returns {boolean}
 */
function estVisee(violation, derogation) {
  if (violation.regle !== derogation.regle) {
    return false;
  }
  return typeof derogation.ecran !== 'string' || violation.ecran === derogation.ecran;
}

/**
 * @param {Derogation} derogation
 * @param {Set<string>} connues
 * @returns {Violation[]}
 */
function signaler(derogation, connues) {
  const ecran = typeof derogation?.ecran === 'string' ? derogation.ecran : null;
  const visee =
    typeof derogation?.regle === 'string' ? derogation.regle : String(derogation?.regle);
  const signalees = [];
  if (!connues.has(visee)) {
    signalees.push({
      regle: DEROGATION_REGLE_INCONNUE,
      ecran,
      raison: `la dérogation vise la règle « ${visee} », qui n'existe pas — une faute de frappe désactiverait une règle en silence.`,
    });
  }
  if (!estJustifiee(derogation)) {
    signalees.push({
      regle: DEROGATION_SANS_JUSTIFICATION,
      ecran,
      raison: `la dérogation à la règle « ${visee} » ne porte aucune justification écrite : elle ne lève rien.`,
    });
  }
  return signalees;
}

/**
 * @param {readonly Violation[]} violations
 * @param {readonly Derogation[]} [derogations]
 * @param {readonly Regle[]} [regles]
 * @returns {Violation[]}
 */
export function appliquerDerogations(violations, derogations = [], regles = REGLES) {
  const connues = identifiantsDeRegles(regles);
  const recevables = [];
  const signalees = [];
  for (const derogation of derogations) {
    const alarmes = signaler(derogation, connues);
    signalees.push(...alarmes);
    if (alarmes.length === 0) {
      recevables.push(derogation);
    }
  }
  const restantes = violations.filter(
    (violation) => !recevables.some((derogation) => estVisee(violation, derogation)),
  );
  return [...restantes, ...signalees];
}
