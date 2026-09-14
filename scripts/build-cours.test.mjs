import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import {
  construireExport,
  ecrireExport,
  executerCli,
  FORMES_EXTERNES,
  ID_RACINE,
  incorporerActif,
  pourRole,
  ROLE_ETUDIANT,
  ROLE_PRESENTATEUR,
  verifierAutoportance,
} from './build-cours.mjs';
import { verifierSortie } from './lints-cours/regles/bundle.mjs';

const CORRIGE = 'la pente vaut deux a';
const PIEGE = 'confond la pente et l ordonnee a l origine';
const IMAGE = 'pente.png';
const POLICE = 'ecriture.woff2';

const racine = mkdtempSync(join(tmpdir(), 'build-cours-'));

after(() => rmSync(racine, { recursive: true, force: true }));

/**
 * @returns {object}
 */
function coursConforme() {
  return {
    id: 'derivees-01',
    titre: 'Dérivées : la pente qui parle',
    niveau: 'terminale',
    duree: 20,
    concepts: ['derivee'],
    polices: [POLICE],
    ecrans: [
      {
        id: 'rappel',
        titre: 'Rappel espacé',
        type: 'fp-recall',
        duree: 5,
        interactif: true,
        donnees: { enonce: 'Ce que la séance précédente a laissé.' },
      },
      {
        id: 'expose',
        titre: 'La pente',
        type: 'fp-block',
        duree: 5,
        interactif: false,
        donnees: { enonce: 'Une pente se lit sur une courbe.', image: IMAGE },
      },
      {
        id: 'atelier',
        titre: 'À vous',
        type: 'fp-numeric',
        duree: 6,
        interactif: true,
        donnees: { enonce: 'Dérivez a x carré.', corrige: CORRIGE, misconception: PIEGE },
      },
      {
        id: 'sortie',
        titre: 'Billet de sortie',
        type: 'fp-exit',
        duree: 4,
        interactif: true,
        donnees: { enonce: 'Ce que je retiens.', suite: 'ref:rappel' },
      },
    ],
  };
}

/**
 * @param {string} nom
 * @param {string} octets
 * @returns {string}
 */
function poserActif(nom, octets) {
  const chemin = join(racine, nom);
  writeFileSync(chemin, octets);
  return chemin;
}

poserActif(IMAGE, 'pixels-de-demonstration');
poserActif(POLICE, 'glyphes-de-demonstration');

/**
 * @param {string} role
 * @returns {string}
 */
function exporter(role) {
  return construireExport(coursConforme(), role, racine);
}

const HTML_ETUDIANT = exporter(ROLE_ETUDIANT);
const HTML_PRESENTATEUR = exporter(ROLE_PRESENTATEUR);

/**
 * @param {string} nom
 * @returns {object}
 */
function creerNoeud(nom) {
  return {
    nom,
    textContent: '',
    attributs: {},
    enfants: [],
    setAttribute(cle, valeur) {
      this.attributs[cle] = valeur;
    },
    appendChild(enfant) {
      this.enfants.push(enfant);
      return enfant;
    },
  };
}

/**
 * @param {object} noeud
 * @returns {string}
 */
function texteDe(noeud) {
  return [noeud.textContent, ...noeud.enfants.map(texteDe)].join(' ');
}

/**
 * @param {string} html
 * @returns {string}
 */
function jouerHorsLigne(html) {
  const script = /<script>([\s\S]*?)<\/script>/.exec(html);
  assert.notEqual(script, null, "l'export ne porte aucun script inline a executer");
  const cible = creerNoeud('main');
  const refuser = () => {
    throw new Error('aucun reseau disponible dans cette salle');
  };
  // eslint-disable-next-line sonarjs/code-eval -- executer le script de l export dans un contexte ou fetch et XMLHttpRequest levent est le seul moyen de prouver qu il s ouvre sans reseau.
  runInNewContext(script[1], {
    document: {
      getElementById: (identifiant) => (identifiant === ID_RACINE ? cible : null),
      createElement: creerNoeud,
    },
    fetch: refuser,
    XMLHttpRequest: refuser,
  });
  return texteDe(cible);
}

describe('build-cours : export autoporte', () => {
  for (const forme of FORMES_EXTERNES) {
    it(`ne laisse aucune reference externe de forme ${forme.nom}`, () => {
      assert.equal(forme.motif.test(HTML_ETUDIANT), false);
      assert.equal(forme.motif.test(HTML_PRESENTATEUR), false);
    });

    it(`refuse d ecrire un export portant la forme ${forme.nom}`, () => {
      const fautif = {
        'script-externe': '<script src="app.js"></script>',
        'feuille-liee': '<link rel="stylesheet" href="style.css">',
        'import-css': '<style>@import url(style.css);</style>',
        'url-reseau': '<img src="http' + '://exemple.test/pente.png">',
      }[forme.nom];
      assert.throws(() => verifierAutoportance(`<!doctype html>${fautif}`), {
        message: new RegExp(forme.nom),
      });
    });
  }

  it('rend le premier ecran dans un dom ou fetch et xmlhttprequest levent', () => {
    const rendu = jouerHorsLigne(HTML_ETUDIANT);
    assert.match(rendu, /Dérivées : la pente qui parle/);
    assert.match(rendu, /Rappel espacé/);
    assert.match(rendu, /Ce que la séance précédente a laissé\./);
  });

  it('incorpore les images et les polices en data uri', () => {
    assert.equal(HTML_ETUDIANT.includes('data:image/png;base64,'), true);
    assert.match(
      HTML_ETUDIANT,
      /@font-face\{font-family:'cours-0';src:url\(data:font\/woff2;base64,/,
    );
    assert.equal(HTML_ETUDIANT.includes(IMAGE), false);
  });

  it('echoue en nommant le chemin fautif quand une image manque', () => {
    const cours = coursConforme();
    cours.ecrans[1].donnees.image = 'absente/schema.png';
    assert.throws(() => construireExport(cours, ROLE_ETUDIANT, racine), {
      message: /absente\/schema\.png/,
    });
  });

  it('echoue quand un actif pese zero octet', () => {
    poserActif('vide.png', '');
    assert.throws(() => incorporerActif('vide.png', racine), { message: /0 octet/ });
  });
});

describe('build-cours : ce que chaque role emporte', () => {
  it('ne laisse aucune valeur de bareme dans l export etudiant', () => {
    const dossier = join(racine, 'sortie-etudiant');
    mkdirSync(dossier, { recursive: true });
    writeFileSync(join(dossier, 'cours.html'), HTML_ETUDIANT, 'utf8');
    const { rapport, manquements } = verifierSortie(dossier);
    assert.equal(rapport.octets > 0, true);
    assert.deepEqual(manquements, []);
    assert.equal(HTML_ETUDIANT.includes(CORRIGE), false);
    assert.equal(HTML_ETUDIANT.includes(PIEGE), false);
  });

  it('emporte le corrige dans l export presentateur', () => {
    assert.equal(HTML_PRESENTATEUR.includes(CORRIGE), true);
    assert.equal(HTML_PRESENTATEUR.includes(PIEGE), true);
    assert.notEqual(HTML_PRESENTATEUR, HTML_ETUDIANT);
  });

  it('refuse un role inconnu plutot que de livrer le corrige par defaut', () => {
    assert.throws(() => pourRole(coursConforme(), 'jury'), { message: /jury/ });
  });
});

describe('build-cours : le lint tourne avant l ecriture', () => {
  /**
   * @returns {object}
   */
  function coursFautif() {
    const cours = coursConforme();
    cours.ecrans[1].duree = 9;
    cours.duree = 24;
    return cours;
  }

  it('nomme la regle, l ecran et la raison au lieu d ecrire un export', () => {
    assert.throws(() => construireExport(coursFautif(), ROLE_ETUDIANT, racine), {
      message: /exposition-continue/,
    });
  });

  it('n ecrit aucun fichier quand le cours est fautif', () => {
    const dossier = join(racine, 'sortie-fautive');
    assert.throws(() => ecrireExport(coursFautif(), ROLE_ETUDIANT, racine, dossier));
    assert.equal(existsSync(dossier), false);
  });

  it('rend un code de sortie non nul et n ecrit rien depuis la ligne de commande', () => {
    const source = join(racine, 'cours-fautif.json');
    const dossier = join(racine, 'sortie-cli-fautive');
    writeFileSync(source, JSON.stringify(coursFautif()), 'utf8');
    const lignes = [];
    assert.equal(executerCli([source, '--sortie', dossier], (ligne) => lignes.push(ligne)), 1);
    assert.match(lignes.join('\n'), /exposition-continue/);
    assert.equal(existsSync(dossier), false);
  });

  it('ecrit l export et rend zero quand le cours est conforme', () => {
    const source = join(racine, 'cours-conforme.json');
    const dossier = join(racine, 'sortie-cli');
    writeFileSync(source, JSON.stringify(coursConforme()), 'utf8');
    const lignes = [];
    assert.equal(
      executerCli([source, '--role', ROLE_PRESENTATEUR, '--sortie', dossier], (ligne) =>
        lignes.push(ligne),
      ),
      0,
    );
    const ecrit = join(dossier, `derivees-01.${ROLE_PRESENTATEUR}.html`);
    assert.equal(existsSync(ecrit), true);
    assert.equal(readFileSync(ecrit, 'utf8').includes(CORRIGE), true);
  });
});
