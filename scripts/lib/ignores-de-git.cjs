const { git } = require('./git.cjs');

const SPECIAUX_DE_MINIMATCH = /[\\*?[{(!#]/g;

const BLANCS = /\s/g;

const ignoresDeGit = (racine) =>
  git(racine, ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'])
    .split('\0')
    .filter((chemin) => chemin !== '')
    .map((chemin) =>
      chemin.replaceAll(SPECIAUX_DE_MINIMATCH, String.raw`\$&`).replaceAll(BLANCS, '[$&]'),
    );

module.exports = { ignoresDeGit };
