const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { git } = require('./git.cjs');

const SPECIAUX_DE_MINIMATCH = /[\\*?[{(!#]/g;

const GROUPE_D_ACCOLADES_DE_MINIMATCH = /\{(?:(?!\{).)*\}/;

const BLANC_EN_TETE = /^\s/;

const BLANC_EN_FIN = /\s$/;

const estAscii = (nom) => [...nom].every((caractere) => caractere.codePointAt(0) < 0x80);

const nomSurLeDisque = (dossier, nom) => {
  if (nom === '' || estAscii(nom)) return nom;
  const entrees = readdirSync(dossier);
  if (entrees.includes(nom)) return nom;
  return entrees.find((entree) => entree.normalize('NFC') === nom.normalize('NFC')) ?? nom;
};

const cheminSurLeDisque = (racine, chemin) =>
  chemin
    .split('/')
    .reduce(
      ({ dossier, noms }, nom) => {
        const reel = nomSurLeDisque(dossier, nom);
        return { dossier: join(dossier, reel), noms: [...noms, reel] };
      },
      { dossier: racine, noms: [] },
    )
    .noms.join('/');

const motifDeMinimatch = (chemin) => {
  const enTete = BLANC_EN_TETE.test(chemin);
  const enFin = BLANC_EN_FIN.test(chemin);
  const deplie = enTete || enFin || GROUPE_D_ACCOLADES_DE_MINIMATCH.test(chemin);
  const echappe = chemin.replaceAll(SPECIAUX_DE_MINIMATCH, (special) =>
    deplie && special === '\\' ? String.raw`\\\\` : `\\${special}`,
  );
  return `${enTete ? '{,}' : ''}${echappe}${enFin ? '{,}' : ''}`;
};

const ignoresDeGit = (racine) =>
  git(racine, ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'])
    .split('\0')
    .filter((chemin) => chemin !== '')
    .map((chemin) => motifDeMinimatch(cheminSurLeDisque(racine, chemin)));

module.exports = { ignoresDeGit };
