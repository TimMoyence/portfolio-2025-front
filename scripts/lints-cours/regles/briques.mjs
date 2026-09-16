import { PORTE } from '../porte.mjs';

const MODES = ['stage', 'hand', 'board'];
const SEUIL_AA = 4.5;
const SEUIL_AAA = 7;
const THEME_STAGE = 'stage';
const HEXADECIMAL = /^#[0-9a-fA-F]{6}$/;

/** @type {readonly { usage: string, texte: string, fond: string, theme: string }[]} */
export const COUPLES_FEUILLE = [
  { usage: 'texte courant sur le fond', texte: '#3c3529', fond: '#fffaf2', theme: 'normal' },
  { usage: 'titre sur la surface', texte: '#0c0902', fond: '#ffffff', theme: 'normal' },
  { usage: 'etat confirme', texte: '#1c5a50', fond: '#eaf6f3', theme: 'normal' },
  { usage: 'etat a-revoir', texte: '#8a5f14', fond: '#fdf4e3', theme: 'normal' },
  { usage: 'etat en-cours', texte: '#3c3529', fond: '#f1e7d6', theme: 'normal' },
  { usage: 'etat en-attente', texte: '#756c5d', fond: '#fffaf2', theme: 'normal' },
  { usage: 'badge', texte: '#0c0902', fond: '#f1e7d6', theme: 'normal' },
  { usage: 'texte courant sur le fond', texte: '#3c3529', fond: '#fffaf2', theme: THEME_STAGE },
  { usage: 'titre sur la surface', texte: '#0c0902', fond: '#fbf3e6', theme: THEME_STAGE },
  { usage: 'etat confirme', texte: '#0c0902', fond: '#eaf6f3', theme: THEME_STAGE },
  { usage: 'etat a-revoir', texte: '#0c0902', fond: '#fdf4e3', theme: THEME_STAGE },
  { usage: 'etat en-cours', texte: '#0c0902', fond: '#f1e7d6', theme: THEME_STAGE },
  { usage: 'etat en-attente', texte: '#0c0902', fond: '#fffaf2', theme: THEME_STAGE },
];

/**
 * @param {number} canal
 * @returns {number}
 */
function lineariser(canal) {
  return canal <= 0.03928 ? canal / 12.92 : Math.pow((canal + 0.055) / 1.055, 2.4);
}

/**
 * @param {string} couleur
 * @returns {number}
 */
function luminance(couleur) {
  const brut = couleur.slice(1);
  const [rouge, vert, bleu] = [0, 2, 4].map((rang) =>
    lineariser(Number.parseInt(brut.slice(rang, rang + 2), 16) / 255),
  );
  return 0.2126 * rouge + 0.7152 * vert + 0.0722 * bleu;
}

/**
 * @param {string} texte
 * @param {string} fond
 * @returns {number}
 */
export function contraste(texte, fond) {
  const claire = Math.max(luminance(texte), luminance(fond));
  const sombre = Math.min(luminance(texte), luminance(fond));
  return (claire + 0.05) / (sombre + 0.05);
}

/**
 * @param {number} valeur
 * @returns {string}
 */
function enFrancais(valeur) {
  return valeur.toFixed(2).replace('.', ',');
}

/**
 * @param {string} theme
 * @returns {number}
 */
function seuilDu(theme) {
  return theme === THEME_STAGE ? SEUIL_AAA : SEUIL_AA;
}

/**
 * @param {{ usage: string, texte: string, fond: string, theme: string }} couple
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerCouple(couple) {
  const usage = String(couple?.usage);
  const illisibles = [couple?.texte, couple?.fond].filter(
    (couleur) => typeof couleur !== 'string' || !HEXADECIMAL.test(couleur),
  );
  if (illisibles.length > 0) {
    return [
      {
        ecran: null,
        raison: `${PORTE} : le couple « ${usage} » porte la couleur « ${illisibles[0]} », qui n'est pas un hexadécimal à six chiffres — un couple illisible se mesurerait à 1:1 et passerait pour un contraste parfait.`,
      },
    ];
  }
  const theme = couple.theme === THEME_STAGE ? THEME_STAGE : 'normal';
  const seuil = seuilDu(theme);
  const mesure = contraste(couple.texte, couple.fond);
  if (mesure >= seuil) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `en thème « ${theme} », le couple « ${usage} » pose ${couple.texte} sur ${couple.fond}, soit un contraste de ${enFrancais(mesure)}:1 : le plancher y est de ${enFrancais(seuil)}:1.`,
    },
  ];
}

/**
 * @param {readonly { usage: string, texte: string, fond: string, theme: string }[]} couples
 * @returns {import('../moteur.mjs').Regle}
 */
export function creerRegleContraste(couples) {
  const table = Array.isArray(couples) ? couples : [];
  return {
    id: 'contraste-insuffisant',
    controler: () => {
      if (table.length === 0) {
        return [
          {
            ecran: null,
            raison: `${PORTE} : aucun couple de couleurs à mesurer — la règle « contraste-insuffisant » déclarerait conforme une feuille qu'elle n'a jamais lue.`,
          },
        ];
      }
      return table.flatMap(controlerCouple);
    },
  };
}

/**
 * @param {{ nom: string, rendre: (mode: string) => string }} brique
 * @param {string} mode
 * @returns {{ sortie: string } | { panne: string }}
 */
function monter(brique, mode) {
  if (typeof brique?.rendre !== 'function') {
    return { panne: "ne se monte pas : elle n'expose aucun rendu" };
  }
  const sortie = brique.rendre(mode);
  if (typeof sortie !== 'string') {
    return {
      panne: `ne rend pas de texte en mode « ${mode} » mais « ${typeof sortie} » : un rendu qu'on ne peut pas lire ne peut pas être comparé`,
    };
  }
  return { sortie };
}

/**
 * @param {{ nom: string, rendre: (mode: string) => string }} brique
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerBrique(brique) {
  const nom = typeof brique?.nom === 'string' && brique.nom !== '' ? brique.nom : '#sans-nom';
  /** @type {Map<string, string>} */
  const sorties = new Map();
  for (const mode of MODES) {
    const montage = monter(brique, mode);
    if (montage.panne !== undefined) {
      return [{ ecran: nom, raison: `${PORTE} : la brique « ${nom} » ${montage.panne}.` }];
    }
    sorties.set(mode, montage.sortie);
  }
  /** @type {import('../moteur.mjs').Manquement[]} */
  const confusions = [];
  for (let premier = 0; premier < MODES.length; premier += 1) {
    for (let second = premier + 1; second < MODES.length; second += 1) {
      if (sorties.get(MODES[premier]) === sorties.get(MODES[second])) {
        confusions.push({
          ecran: nom,
          raison: `la brique « ${nom} » rend la même chose en mode « ${MODES[premier]} » et en mode « ${MODES[second]} » : projeter au fond d'une salle et tenir dans la main d'un étudiant ne demandent pas le même rendu.`,
        });
      }
    }
  }
  return confusions;
}

/**
 * @param {readonly { nom: string, rendre: (mode: string) => string }[]} catalogue
 * @returns {import('../moteur.mjs').Regle}
 */
export function creerRegleRendus(catalogue) {
  const briques = Array.isArray(catalogue) ? catalogue : [];
  return {
    id: 'rendus-indistincts',
    controler: () => {
      if (briques.length === 0) {
        return [
          {
            ecran: null,
            raison: `${PORTE} : aucune brique à monter — la règle « rendus-indistincts » rendrait « aucun manquement » sur un catalogue qu'elle n'a jamais ouvert.`,
          },
        ];
      }
      return briques.flatMap(controlerBrique);
    },
  };
}

/** @type {readonly import('../moteur.mjs').Regle[]} */
export const REGLES_BRIQUES = [creerRegleContraste(COUPLES_FEUILLE)];
