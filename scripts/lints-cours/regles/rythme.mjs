const EXPOSITION_MAXIMALE_MINUTES = 6;
const RATIO_INTERACTION_MINIMAL = 0.3;
const TOLERANCE_DUREE_ANNONCEE = 0.05;
const TYPE_OUVERTURE = 'fp-recall';
const TYPE_CLOTURE = 'fp-exit';

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {readonly import('../moteur.mjs').Ecran[]}
 */
function ecransDe(cours) {
  return Array.isArray(cours?.ecrans) ? cours.ecrans : [];
}

/**
 * @param {import('../moteur.mjs').Ecran} ecran
 * @param {number} rang
 * @returns {string}
 */
function nomEcran(ecran, rang) {
  return typeof ecran?.id === 'string' && ecran.id !== '' ? ecran.id : `#${rang}`;
}

/**
 * @param {import('../moteur.mjs').Ecran} ecran
 * @returns {number}
 */
function minutesDe(ecran) {
  return Number.isFinite(ecran?.duree) && ecran.duree > 0 ? ecran.duree : 0;
}

/**
 * @param {number} part
 * @returns {string}
 */
function enFrancais(part) {
  return part.toFixed(2).replace('.', ',');
}

/**
 * @param {readonly string[]} bloc
 * @param {number} cumul
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function verdictDuBloc(bloc, cumul) {
  if (cumul <= EXPOSITION_MAXIMALE_MINUTES) {
    return [];
  }
  const nommes = bloc.map((nom) => `« ${nom} »`).join(', ');
  return [
    {
      ecran: bloc[0],
      raison: `${cumul} min d'exposition d'affilée sur ${bloc.length} écran(s) (${nommes}) sans une seule interaction : le plafond est de ${EXPOSITION_MAXIMALE_MINUTES} min.`,
    },
  ];
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerExposition(cours) {
  /** @type {import('../moteur.mjs').Manquement[]} */
  const manquements = [];
  /** @type {string[]} */
  let bloc = [];
  let cumul = 0;
  ecransDe(cours).forEach((ecran, rang) => {
    if (ecran?.interactif === true) {
      manquements.push(...verdictDuBloc(bloc, cumul));
      bloc = [];
      cumul = 0;
      return;
    }
    bloc.push(nomEcran(ecran, rang));
    cumul += minutesDe(ecran);
  });
  manquements.push(...verdictDuBloc(bloc, cumul));
  return manquements;
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerRatio(cours) {
  const ecrans = ecransDe(cours);
  if (ecrans.length === 0) {
    return [
      {
        ecran: null,
        raison: "le cours ne déclare aucun écran : le ratio d'interaction n'a rien à mesurer.",
      },
    ];
  }
  const interaction = ecrans
    .filter((ecran) => ecran?.interactif === true)
    .reduce((total, ecran) => total + minutesDe(ecran), 0);
  const exposition = ecrans
    .filter((ecran) => ecran?.interactif !== true)
    .reduce((total, ecran) => total + minutesDe(ecran), 0);
  if (interaction + exposition === 0) {
    return [
      {
        ecran: null,
        raison: `le cours totalise 0 minute déclarée sur ${ecrans.length} écran(s) : le ratio d'interaction n'a rien à mesurer.`,
      },
    ];
  }
  if (exposition === 0 || interaction / exposition >= RATIO_INTERACTION_MINIMAL) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `${interaction} min d'écrans interactifs pour ${exposition} min d'exposition, soit un ratio de ${enFrancais(interaction / exposition)} : le plancher est de ${enFrancais(RATIO_INTERACTION_MINIMAL)}.`,
    },
  ];
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerOuvertureCloture(cours) {
  const ecrans = ecransDe(cours);
  if (ecrans.length === 0) {
    return [];
  }
  /** @type {import('../moteur.mjs').Manquement[]} */
  const manquements = [];
  const premier = ecrans[0];
  const dernier = ecrans.at(-1);
  if (premier?.type !== TYPE_OUVERTURE) {
    manquements.push({
      ecran: nomEcran(premier, 0),
      raison: `le cours ouvre sur « ${nomEcran(premier, 0)} » de type « ${premier?.type} » : un cours ouvre par un rappel espacé (« ${TYPE_OUVERTURE} »), qui rouvre la mémoire avant d'y ajouter.`,
    });
  }
  if (dernier?.type !== TYPE_CLOTURE) {
    const rang = ecrans.length - 1;
    manquements.push({
      ecran: nomEcran(dernier, rang),
      raison: `le cours se clôt sur « ${nomEcran(dernier, rang)} » de type « ${dernier?.type} » : un cours clôt par un exit ticket (« ${TYPE_CLOTURE} »), sans quoi la séance finit sans rien mesurer.`,
    });
  }
  return manquements;
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerDureeEcran(cours) {
  return ecransDe(cours).flatMap((ecran, rang) => {
    const identifiant = nomEcran(ecran, rang);
    if (Number.isFinite(ecran?.duree) && ecran.duree > 0) {
      return [];
    }
    return [
      {
        ecran: identifiant,
        raison: `l'écran « ${identifiant} » annonce une durée de « ${ecran?.duree} » : une durée doit être un nombre strictement positif.`,
      },
    ];
  });
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerDureeCours(cours) {
  const annoncee = cours?.duree;
  if (!Number.isFinite(annoncee) || annoncee <= 0) {
    return [
      {
        ecran: null,
        raison: `le cours annonce une durée de « ${annoncee} » : une durée annoncée doit être un nombre strictement positif.`,
      },
    ];
  }
  const declarees = ecransDe(cours).reduce((total, ecran) => total + minutesDe(ecran), 0);
  const ecart = Math.abs(declarees - annoncee);
  const tolerance = annoncee * TOLERANCE_DUREE_ANNONCEE;
  if (ecart <= tolerance) {
    return [];
  }
  return [
    {
      ecran: null,
      raison: `${declarees} min déclarées par les écrans pour ${annoncee} min annoncées : l'écart de ${ecart} min dépasse la tolérance de ${tolerance} min.`,
    },
  ];
}

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_EXPOSITION = { id: 'exposition-continue', controler: controlerExposition };

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_RATIO = { id: 'ratio-interaction', controler: controlerRatio };

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_OUVERTURE_CLOTURE = {
  id: 'ouverture-cloture',
  controler: controlerOuvertureCloture,
};

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_DUREE_ECRAN = { id: 'duree-ecran', controler: controlerDureeEcran };

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_DUREE_COURS = { id: 'duree-cours', controler: controlerDureeCours };

/** @type {readonly import('../moteur.mjs').Regle[]} */
export const REGLES_RYTHME = [
  REGLE_EXPOSITION,
  REGLE_RATIO,
  REGLE_OUVERTURE_CLOTURE,
  REGLE_DUREE_ECRAN,
  REGLE_DUREE_COURS,
];
