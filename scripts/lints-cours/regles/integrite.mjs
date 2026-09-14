import { PORTE } from '../porte.mjs';

const PREFIXE_REFERENCE = 'ref:';
const DIACRITIQUES = /\p{M}/gu;

/**
 * @param {unknown} identifiant
 * @returns {string}
 */
function normaliser(identifiant) {
  return String(identifiant).normalize('NFD').replace(DIACRITIQUES, '').toLowerCase();
}

/**
 * @param {string} identifiant
 * @param {Iterable<string>} connus
 * @returns {string | null}
 */
function voisinIndistinct(identifiant, connus) {
  const cible = normaliser(identifiant);
  for (const connu of connus) {
    if (connu !== identifiant && normaliser(connu) === cible) {
      return connu;
    }
  }
  return null;
}

/**
 * @param {string} sujet
 * @param {string} identifiant
 * @param {readonly string[]} connus
 * @param {string} absence
 * @returns {string}
 */
function raisonIntrouvable(sujet, identifiant, connus, absence) {
  const voisin = voisinIndistinct(identifiant, connus);
  if (voisin === null) {
    return `${sujet} « ${identifiant} » ${absence}`;
  }
  return `${sujet} « ${identifiant} » est un identifiant distinct de « ${voisin} » : la casse et les accents ne sont jamais rapprochés en silence.`;
}

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
 * @param {unknown} valeur
 * @returns {valeur is Record<string, unknown>}
 */
function estObjet(valeur) {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/**
 * @param {unknown} valeur
 * @param {string} porteur
 * @param {{ declares: string[], liens: { porteur: string, cible: string }[], vus: WeakSet<object> }} recolte
 * @returns {void}
 */
function parcourir(valeur, porteur, recolte) {
  if (typeof valeur === 'string') {
    if (valeur.startsWith(PREFIXE_REFERENCE)) {
      recolte.liens.push({ porteur, cible: valeur.slice(PREFIXE_REFERENCE.length) });
    }
    return;
  }
  if (Array.isArray(valeur)) {
    for (const element of valeur) {
      parcourir(element, porteur, recolte);
    }
    return;
  }
  if (!estObjet(valeur) || recolte.vus.has(valeur)) {
    return;
  }
  recolte.vus.add(valeur);
  const propre = typeof valeur.id === 'string' && valeur.id !== '' ? valeur.id : porteur;
  if (propre !== porteur) {
    recolte.declares.push(propre);
  }
  for (const [cle, contenu] of Object.entries(valeur)) {
    if (cle !== 'id') {
      parcourir(contenu, propre, recolte);
    }
  }
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {{ declares: string[], liens: { porteur: string, cible: string }[] }}
 */
function recolter(cours) {
  /** @type {{ declares: string[], liens: { porteur: string, cible: string }[], vus: WeakSet<object> }} */
  const recolte = { declares: [], liens: [], vus: new WeakSet() };
  ecransDe(cours).forEach((ecran, rang) => {
    const identifiant = nomEcran(ecran, rang);
    recolte.declares.push(identifiant);
    parcourir(ecran?.donnees, identifiant, recolte);
  });
  return { declares: recolte.declares, liens: recolte.liens };
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerReferences(cours) {
  const { declares, liens } = recolter(cours);
  const connus = new Set(declares);
  return liens
    .filter((lien) => !connus.has(lien.cible))
    .map((lien) => ({
      ecran: lien.porteur,
      raison: raisonIntrouvable(
        `l'écran « ${lien.porteur} » renvoie vers`,
        lien.cible,
        declares,
        "qui n'est déclaré par aucun écran ni aucune question de ce cours.",
      ),
    }));
}

/**
 * @param {{ declares: string[], liens: { porteur: string, cible: string }[] }} graphe
 * @returns {Map<string, string[]>}
 */
function aretes({ declares, liens }) {
  const connus = new Set(declares);
  const sortantes = new Map(declares.map((noeud) => [noeud, []]));
  for (const lien of liens) {
    if (connus.has(lien.cible) && sortantes.has(lien.porteur)) {
      sortantes.get(lien.porteur).push(lien.cible);
    }
  }
  return sortantes;
}

/**
 * @param {string} depart
 * @param {Map<string, string[]>} sortantes
 * @param {Map<string, string>} etats
 * @param {string[]} chemin
 * @param {import('../moteur.mjs').Manquement[]} cycles
 * @returns {void}
 */
function explorer(depart, sortantes, etats, chemin, cycles) {
  etats.set(depart, 'en-cours');
  chemin.push(depart);
  for (const cible of sortantes.get(depart) ?? []) {
    if (etats.get(cible) === 'en-cours') {
      const boucle = [...chemin.slice(chemin.indexOf(cible)), cible].join(' → ');
      cycles.push({
        ecran: cible,
        raison: `le cycle de références « ${boucle} » se referme sur lui-même : une référence circulaire ne se résout jamais.`,
      });
    } else if (etats.get(cible) !== 'clos') {
      explorer(cible, sortantes, etats, chemin, cycles);
    }
  }
  chemin.pop();
  etats.set(depart, 'clos');
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {import('../moteur.mjs').Manquement[]}
 */
function controlerCycles(cours) {
  const graphe = recolter(cours);
  const sortantes = aretes(graphe);
  /** @type {Map<string, string>} */
  const etats = new Map();
  /** @type {import('../moteur.mjs').Manquement[]} */
  const cycles = [];
  for (const noeud of sortantes.keys()) {
    if (!etats.has(noeud)) {
      explorer(noeud, sortantes, etats, [], cycles);
    }
  }
  return cycles;
}

/**
 * @param {import('../moteur.mjs').Cours} cours
 * @returns {{ nom: string, ecran: string | null }[]}
 */
function conceptsDeclares(cours) {
  const globaux = Array.isArray(cours?.concepts) ? cours.concepts : [];
  const locaux = ecransDe(cours).flatMap((ecran, rang) => {
    const cites = ecran?.donnees?.concepts;
    return Array.isArray(cites)
      ? cites.map((nom) => ({ nom: String(nom), ecran: nomEcran(ecran, rang) }))
      : [];
  });
  return [...globaux.map((nom) => ({ nom: String(nom), ecran: null })), ...locaux];
}

/**
 * @param {readonly string[]} banque
 * @returns {import('../moteur.mjs').Regle}
 */
export function creerRegleConcepts(banque) {
  const referentiel = Array.isArray(banque) ? banque.map(String) : [];
  const connus = new Set(referentiel);
  return {
    id: 'concept-inconnu',
    controler: (cours) => {
      if (referentiel.length === 0) {
        return [
          {
            ecran: null,
            raison: `${PORTE} : la banque de concepts est vide — la règle « concept-inconnu » laisserait passer n'importe quel identifiant.`,
          },
        ];
      }
      return conceptsDeclares(cours)
        .filter((concept) => !connus.has(concept.nom))
        .map((concept) => ({
          ecran: concept.ecran,
          raison: raisonIntrouvable(
            concept.ecran === null
              ? 'le cours déclare le concept'
              : `l'écran « ${concept.ecran} » déclare le concept`,
            concept.nom,
            referentiel,
            `qui ne figure pas dans la banque de ${referentiel.length} concept(s).`,
          ),
        }));
    },
  };
}

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_REFERENCES = { id: 'reference-inconnue', controler: controlerReferences };

/** @type {import('../moteur.mjs').Regle} */
export const REGLE_CYCLES = { id: 'reference-circulaire', controler: controlerCycles };

/** @type {readonly import('../moteur.mjs').Regle[]} */
export const REGLES_INTEGRITE = [REGLE_REFERENCES, REGLE_CYCLES];
