import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chargerMoteur } from './lib/moteur-formules.mjs';

const BUDGET_MS = 100;
const MAILLONS = 26;
const CELLULES_LARGEUR = 2000;
const CELLULES_HORS_LIMITES = 200_000;
const CELLULES_MASSIVES = 1_000_000;
const BUDGET_REFUS_MASSIF_MS = 500;
const CHAUFFES = 3;
const MESURES = 7;

/**
 * @param {number} longueur
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const chaineDeDoublements = (longueur) => {
  /** @type {Record<string, string>} */
  const cellules = { A1: '1' };
  for (let rang = 2; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${rang - 1}+A${rang - 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
};

/**
 * @param {number} cote
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const sommesCroisees = (cote) => {
  /** @type {Record<string, string>} */
  const cellules = {};
  for (let ligne = 1; ligne <= cote; ligne += 1) {
    cellules[`A${ligne}`] = String(ligne);
  }
  for (let colonne = 1; colonne < cote; colonne += 1) {
    const lettre = String.fromCharCode(65 + colonne);
    const precedente = String.fromCharCode(64 + colonne);
    for (let ligne = 1; ligne <= cote; ligne += 1) {
      cellules[`${lettre}${ligne}`] = `=SOMME(${precedente}1:${precedente}${cote})`;
    }
  }
  return { lignes: cote, colonnes: cote, cellules };
};

/**
 * @param {number} longueur
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const cycleDeMaillons = (longueur) => {
  /** @type {Record<string, string>} */
  const cellules = {};
  for (let rang = 1; rang <= longueur; rang += 1) {
    cellules[`A${rang}`] = `=A${(rang % longueur) + 1}`;
  }
  return { lignes: longueur, colonnes: 1, cellules };
};

/**
 * @param {number} nombre
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const formuleRecopiee = (nombre) => {
  /** @type {Record<string, string>} */
  const cellules = { A1: '3' };
  for (let rang = 2; rang <= nombre; rang += 1) {
    cellules[`A${rang}`] = '=$A$1*2+1';
  }
  return { lignes: nombre, colonnes: 1, cellules };
};

/**
 * @param {number} nombre
 * @returns {{ lignes: number, colonnes: number, cellules: Record<string, string> }}
 */
const largeurMaximale = (nombre) => {
  /** @type {Record<string, string>} */
  const cellules = {};
  for (let rang = 1; rang <= nombre; rang += 1) {
    cellules[`A${rang}`] = `=SOMME(A1:A${nombre})`;
  }
  return { lignes: nombre, colonnes: 1, cellules };
};

/**
 * @param {() => void} executer
 * @returns {number}
 */
const millisecondesProcesseur = (executer) => {
  for (let chauffe = 0; chauffe < CHAUFFES; chauffe += 1) executer();
  /** @type {number[]} */
  const releves = [];
  for (let essai = 0; essai < MESURES; essai += 1) {
    const depart = process.cpuUsage();
    executer();
    const consomme = process.cpuUsage(depart);
    releves.push((consomme.user + consomme.system) / 1000);
  }
  return Math.min(...releves);
};

/**
 * @param {string} intitule
 * @param {() => void} executer
 * @returns {void}
 */
const exigerSousLeBudget = (intitule, executer) => {
  const ms = millisecondesProcesseur(executer);
  console.log(`budget-formules: ${intitule} — ${ms.toFixed(3)} ms`);
  assert.ok(
    ms < BUDGET_MS,
    `${intitule} : ${ms.toFixed(3)} ms pour un budget de ${BUDGET_MS} ms (AC-35).`,
  );
};

const ADVERSES = [
  [`chaine de ${MAILLONS} doublements`, chaineDeDoublements(MAILLONS)],
  [`${MAILLONS} SOMME croisees`, sommesCroisees(MAILLONS)],
  [`cycle de ${MAILLONS} maillons`, cycleDeMaillons(MAILLONS)],
  ['chaine de 1500 doublements', chaineDeDoublements(1500)],
  [`formule recopiee sur ${CELLULES_LARGEUR} cellules`, formuleRecopiee(CELLULES_LARGEUR)],
  [`largeur ${CELLULES_LARGEUR}`, largeurMaximale(CELLULES_LARGEUR)],
];

void test(`AC-35 : une feuille adverse est evaluee sous ${BUDGET_MS} ms de processeur`, async () => {
  const { moteur, liberer } = await chargerMoteur();
  try {
    for (const [intitule, feuille] of ADVERSES) {
      exigerSousLeBudget(intitule, () => {
        moteur.evaluerFeuille(feuille);
      });
      assert.equal(
        moteur.evaluerFeuille(feuille).size,
        Object.keys(feuille.cellules).length,
        `${intitule} : le moteur doit rendre un resultat par cellule remplie.`,
      );
    }
  } finally {
    liberer();
  }
});

void test(`AC-35 : corriger une cellule d une feuille adverse reste sous ${BUDGET_MS} ms`, async () => {
  const { moteur, liberer } = await chargerMoteur();
  try {
    for (const [intitule, feuille] of ADVERSES) {
      const derniere = Object.keys(feuille.cellules).at(-1);
      exigerSousLeBudget(`${intitule} — correction de ${derniere}`, () => {
        moteur.evaluerCellule(feuille, derniere);
      });
      assert.deepEqual(
        moteur.evaluerCellule(feuille, derniere),
        moteur.evaluerFeuille(feuille).get(derniere),
        `${intitule} : corriger ${derniere} seule doit donner ce que la passe complete lui donne.`,
      );
    }
  } finally {
    liberer();
  }
});

void test('une feuille au dela de la borne est refusee sans etre parcourue', async () => {
  const { moteur, liberer } = await chargerMoteur();
  try {
    const horsLimites = formuleRecopiee(CELLULES_HORS_LIMITES);

    assert.equal(moteur.NOMBRE_MAX_CELLULES, CELLULES_LARGEUR);
    exigerSousLeBudget(`refus de ${CELLULES_HORS_LIMITES} cellules`, () => {
      assert.throws(
        () => moteur.evaluerFeuille(horsLimites),
        (cause) => cause.name === 'FeuilleHorsLimitesError',
      );
    });
    assert.throws(
      () => moteur.evaluerCellule(horsLimites, 'A1'),
      (cause) => cause.name === 'FeuilleHorsLimitesError',
    );
    assert.equal(
      moteur.evaluerFeuille(largeurMaximale(CELLULES_LARGEUR)).size,
      CELLULES_LARGEUR,
      'la borne doit accepter exactement NOMBRE_MAX_CELLULES cellules.',
    );
  } finally {
    liberer();
  }
});

void test('le refus reste lineaire : un million de cellules ne sont jamais evaluees', async () => {
  const { moteur, liberer } = await chargerMoteur();
  try {
    const million = formuleRecopiee(CELLULES_MASSIVES);
    const depart = process.cpuUsage();
    assert.throws(
      () => moteur.evaluerFeuille(million),
      (cause) => cause.name === 'FeuilleHorsLimitesError',
    );
    const consomme = process.cpuUsage(depart);
    const ms = (consomme.user + consomme.system) / 1000;
    console.log(`budget-formules: refus de ${CELLULES_MASSIVES} cellules — ${ms.toFixed(3)} ms`);
    assert.ok(
      ms < BUDGET_REFUS_MASSIF_MS,
      `refus de ${CELLULES_MASSIVES} cellules : ${ms.toFixed(3)} ms pour un plafond de ${BUDGET_REFUS_MASSIF_MS} ms. Compter les cles reste proportionnel a la charge recue ; les evaluer ne doit plus l etre.`,
    );
  } finally {
    liberer();
  }
});

void test('une grille qui n est pas un couple d entiers positifs est refusee', async () => {
  const { moteur, liberer } = await chargerMoteur();
  try {
    for (const grille of [
      { lignes: -1, colonnes: 4 },
      { lignes: 2.5, colonnes: 4 },
      { lignes: 4, colonnes: Number.NaN },
      { lignes: 4, colonnes: Number.POSITIVE_INFINITY },
    ]) {
      assert.throws(
        () => moteur.evaluerFeuille({ ...grille, cellules: { A1: '1' } }),
        (cause) => cause.name === 'FeuilleHorsLimitesError',
        `la grille ${JSON.stringify(grille)} doit etre refusee.`,
      );
    }
  } finally {
    liberer();
  }
});
