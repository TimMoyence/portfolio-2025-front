import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyser, appliquerDerogations } from './lints-cours/moteur.mjs';
import { PORTE } from './lints-cours/porte.mjs';

export const ROLE_ETUDIANT = 'etudiant';

export const ROLE_PRESENTATEUR = 'presentateur';

export const ROLES = [ROLE_ETUDIANT, ROLE_PRESENTATEUR];

export const CLES_PRESENTATEUR = ['corrige', 'misconception', 'pieges', 'bareme'];

export const ID_RACINE = 'cours-racine';

export const SORTIE_PAR_DEFAUT = 'exports-cours';

const TYPES_MEDIA = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const CLES_ACTIFS = new Map([
  ['image', 'image'],
  ['images', 'image'],
  ['police', 'police'],
  ['polices', 'police'],
]);

/**
 * @typedef {object} FormeExterne
 * @property {string} nom
 * @property {RegExp} motif
 * @property {string} consequence
 */

/** @type {readonly FormeExterne[]} */
export const FORMES_EXTERNES = [
  {
    nom: 'script-externe',
    motif: /<script[^>]*\ssrc\s*=/i,
    consequence: 'le navigateur irait chercher ce script sur le réseau',
  },
  {
    nom: 'feuille-liee',
    motif: /<link[^>]*\srel\s*=\s*["']?stylesheet/i,
    consequence: 'la feuille de style resterait à charger',
  },
  {
    nom: 'import-css',
    motif: /@import\b/i,
    consequence: 'la règle @import déclenche une requête au premier rendu',
  },
  {
    nom: 'url-reseau',
    motif: /\bhttps?:\/\//i,
    consequence: 'une URL réseau ne se résout pas dans une salle sans wifi',
  },
];

/**
 * @param {string} chemin
 * @returns {string}
 */
function typeMediaDe(chemin) {
  const type = TYPES_MEDIA.get(extname(chemin).toLowerCase());
  if (type === undefined) {
    throw new Error(
      `${PORTE} : l'actif « ${chemin} » porte une extension qui n'est pas incorporable — les types connus sont ${[...TYPES_MEDIA.keys()].join(', ')}.`,
    );
  }
  return type;
}

/**
 * @param {string} chemin
 * @param {string} racine
 * @param {(chemin: string) => Buffer} [lire]
 * @returns {string}
 */
export function incorporerActif(chemin, racine, lire = readFileSync) {
  if (typeof chemin !== 'string' || chemin.trim() === '') {
    throw new Error(
      `${PORTE} : un écran déclare un actif sans chemin — l'export porterait une image vide sans que personne ne le sache.`,
    );
  }
  const type = typeMediaDe(chemin);
  const absolu = resolve(racine, chemin);
  let brut;
  try {
    brut = lire(absolu);
  } catch {
    throw new Error(
      `${PORTE} : l'actif « ${chemin} » est introuvable sous « ${racine} » (cherché en ${absolu}) — un export à l'image brisée ne se découvre qu'en salle.`,
    );
  }
  if (brut.length === 0) {
    throw new Error(
      `${PORTE} : l'actif « ${chemin} » pèse 0 octet (${absolu}) — incorporé tel quel, il rendrait une image brisée que le build aurait déclarée conforme.`,
    );
  }
  return `data:${type};base64,${Buffer.from(brut).toString('base64')}`;
}

/**
 * @param {unknown} valeur
 * @returns {valeur is Record<string, unknown>}
 */
function estObjet(valeur) {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

/**
 * @param {string} sorte
 * @param {unknown} contenu
 * @param {{ sorte: string, chemin: string }[]} trouves
 * @returns {void}
 */
function noter(sorte, contenu, trouves) {
  if (typeof contenu === 'string') {
    trouves.push({ sorte, chemin: contenu });
    return;
  }
  if (Array.isArray(contenu)) {
    for (const element of contenu) {
      noter(sorte, element, trouves);
    }
  }
}

/**
 * @param {unknown} valeur
 * @param {{ sorte: string, chemin: string }[]} trouves
 * @returns {void}
 */
function recolter(valeur, trouves) {
  if (Array.isArray(valeur)) {
    for (const element of valeur) {
      recolter(element, trouves);
    }
    return;
  }
  if (!estObjet(valeur)) {
    return;
  }
  for (const [cle, contenu] of Object.entries(valeur)) {
    const sorte = CLES_ACTIFS.get(cle);
    if (sorte === undefined) {
      recolter(contenu, trouves);
    } else {
      noter(sorte, contenu, trouves);
    }
  }
}

/**
 * @param {object} cours
 * @returns {{ sorte: string, chemin: string }[]}
 */
export function actifsDe(cours) {
  /** @type {{ sorte: string, chemin: string }[]} */
  const trouves = [];
  recolter(cours, trouves);
  return trouves;
}

/**
 * @param {unknown} valeur
 * @param {Map<string, string>} table
 * @returns {unknown}
 */
function substituer(valeur, table) {
  if (typeof valeur === 'string') {
    return table.get(valeur) ?? valeur;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((element) => substituer(element, table));
  }
  if (!estObjet(valeur)) {
    return valeur;
  }
  return Object.fromEntries(
    Object.entries(valeur).map(([cle, contenu]) => [cle, substituer(contenu, table)]),
  );
}

/**
 * @param {unknown} valeur
 * @param {ReadonlySet<string>} interdites
 * @returns {unknown}
 */
function elaguer(valeur, interdites) {
  if (Array.isArray(valeur)) {
    return valeur.map((element) => elaguer(element, interdites));
  }
  if (!estObjet(valeur)) {
    return valeur;
  }
  return Object.fromEntries(
    Object.entries(valeur)
      .filter(([cle]) => !interdites.has(cle))
      .map(([cle, contenu]) => [cle, elaguer(contenu, interdites)]),
  );
}

/**
 * @param {object} cours
 * @param {string} role
 * @returns {object}
 */
export function pourRole(cours, role) {
  if (!ROLES.includes(role)) {
    throw new Error(
      `${PORTE} : rôle « ${role} » inconnu — les exports connus sont ${ROLES.join(' et ')}, et un rôle inventé livrerait le corrigé par défaut.`,
    );
  }
  if (role === ROLE_PRESENTATEUR) {
    return cours;
  }
  const interdites = new Set(CLES_PRESENTATEUR);
  const elague = elaguer(cours, interdites);
  const restantes = actifsInterdits(elague, interdites);
  if (restantes.length > 0) {
    throw new Error(
      `${PORTE} : l'élagage du rôle ${ROLE_ETUDIANT} a laissé la clé « ${restantes[0]} » dans l'export — le corrigé y voyagerait malgré la règle.`,
    );
  }
  return elague;
}

/**
 * @param {unknown} valeur
 * @param {ReadonlySet<string>} interdites
 * @returns {string[]}
 */
function actifsInterdits(valeur, interdites) {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element) => actifsInterdits(element, interdites));
  }
  if (!estObjet(valeur)) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, contenu]) =>
    interdites.has(cle) ? [cle] : actifsInterdits(contenu, interdites),
  );
}

/**
 * @param {string} html
 * @returns {string}
 */
export function verifierAutoportance(html) {
  for (const forme of FORMES_EXTERNES) {
    const trouve = forme.motif.exec(html);
    if (trouve !== null) {
      throw new Error(
        `${PORTE} : l'export porte une référence externe de forme « ${forme.nom} » (${trouve[0]}) — ${forme.consequence}, et le fichier devient inutilisable hors ligne.`,
      );
    }
  }
  return html;
}

/**
 * @param {unknown} valeur
 * @returns {string}
 */
function serialiser(valeur) {
  return JSON.stringify(valeur).replaceAll('<', '\\u003c');
}

/**
 * @param {readonly string[]} polices
 * @returns {string}
 */
function feuilleDe(polices) {
  const faces = polices
    .map(
      (source, rang) =>
        `@font-face{font-family:'cours-${rang}';src:url(${source});font-display:block}`,
    )
    .join('');
  const familles = polices.map((_, rang) => `'cours-${rang}'`).join(',');
  const pile = polices.length === 0 ? 'system-ui,sans-serif' : `${familles},system-ui,sans-serif`;
  return `<style>${faces}body{margin:0;padding:2rem;background:#fffaf2;color:#3c3529;font-family:${pile}}h1{font-size:2rem;margin:0 0 1rem}section{max-width:60ch}img{max-width:100%}</style>`;
}

const SCRIPT_PREMIER_ECRAN = `(function () {
  var cours = __COURS__;
  var racine = document.getElementById('__RACINE__');
  var titre = document.createElement('h1');
  titre.textContent = cours.titre;
  racine.appendChild(titre);
  var premier = cours.ecrans[0];
  var bloc = document.createElement('section');
  bloc.setAttribute('data-ecran', premier.id);
  var intitule = document.createElement('h2');
  intitule.textContent = premier.titre || premier.id;
  bloc.appendChild(intitule);
  var corps = document.createElement('p');
  corps.textContent = (premier.donnees && premier.donnees.enonce) || '';
  bloc.appendChild(corps);
  racine.appendChild(bloc);
})();`;

/**
 * @param {object} cours
 * @returns {string}
 */
function echapper(cours) {
  return String(cours?.titre ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * @param {object} cours
 * @param {string} role
 * @param {string} racineActifs
 * @param {(chemin: string) => Buffer} [lire]
 * @returns {string}
 */
export function construireExport(cours, role, racineActifs, lire = readFileSync) {
  const violations = appliquerDerogations(analyser(cours), cours?.derogations ?? []);
  if (violations.length > 0) {
    const listees = violations
      .map((violation) => `  ${violation.regle} (${violation.ecran ?? 'cours'}) : ${violation.raison}`)
      .join('\n');
    throw new Error(
      `${PORTE} : ${violations.length} violation(s) pédagogique(s) — aucun export n'est écrit tant qu'elles tiennent.\n${listees}`,
    );
  }
  const cible = pourRole(cours, role);
  const actifs = actifsDe(cible);
  /** @type {Map<string, string>} */
  const table = new Map();
  const polices = [];
  for (const actif of actifs) {
    const donnee = incorporerActif(actif.chemin, racineActifs, lire);
    table.set(actif.chemin, donnee);
    if (actif.sorte === 'police') {
      polices.push(donnee);
    }
  }
  const porte = substituer(cible, table);
  const html = [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${echapper(cours)}</title>`,
    feuilleDe(polices),
    '</head>',
    '<body>',
    `<main id="${ID_RACINE}"></main>`,
    `<script>${SCRIPT_PREMIER_ECRAN.replace('__COURS__', serialiser(porte)).replace('__RACINE__', ID_RACINE)}</script>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
  return verifierAutoportance(html);
}

/**
 * @param {object} cours
 * @param {string} role
 * @param {string} racineActifs
 * @param {string} destination
 * @returns {{ chemin: string, octets: number }}
 */
export function ecrireExport(cours, role, racineActifs, destination) {
  const html = construireExport(cours, role, racineActifs);
  const identifiant = typeof cours?.id === 'string' && cours.id !== '' ? cours.id : 'cours';
  const chemin = join(destination, `${identifiant}.${role}.html`);
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, html, 'utf8');
  return { chemin, octets: Buffer.byteLength(html, 'utf8') };
}

/**
 * @param {readonly string[]} parametres
 * @returns {{ source: string, role: string, destination: string }}
 */
export function lireOptions(parametres) {
  const positionnels = [];
  let role = ROLE_ETUDIANT;
  let destination = SORTIE_PAR_DEFAUT;
  for (let rang = 0; rang < parametres.length; rang += 1) {
    const parametre = parametres[rang];
    if (parametre === '--role') {
      rang += 1;
      role = parametres[rang];
    } else if (parametre === '--sortie') {
      rang += 1;
      destination = parametres[rang];
    } else {
      positionnels.push(parametre);
    }
  }
  if (positionnels.length !== 1) {
    throw new Error(
      `${PORTE} : usage — node scripts/build-cours.mjs <cours.json> [--role ${ROLES.join('|')}] [--sortie ${SORTIE_PAR_DEFAUT}].`,
    );
  }
  return { source: positionnels[0], role, destination };
}

/**
 * @param {readonly string[]} parametres
 * @param {(ligne: string) => void} [ecrire]
 * @returns {number}
 */
export function executerCli(parametres, ecrire = (ligne) => process.stdout.write(`${ligne}\n`)) {
  try {
    const options = lireOptions(parametres);
    const cours = JSON.parse(readFileSync(options.source, 'utf8'));
    const ecrit = ecrireExport(cours, options.role, dirname(options.source), options.destination);
    ecrire(
      `${PORTE} : export « ${basename(ecrit.chemin)} » écrit dans « ${options.destination} » (${ecrit.octets} octets, rôle ${options.role}).`,
    );
    return 0;
  } catch (erreur) {
    ecrire(erreur.message);
    return 1;
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = executerCli(process.argv.slice(2));
}
