const motifEslintDeLaLigne = (ligne) => {
  const negation = ligne.startsWith('!') ? '!' : '';
  const motif = ligne.slice(negation.length);
  const barre = motif.indexOf('/');
  const partout = barre === -1 || barre === motif.length - 1 ? '**/' : '';
  const contenu = (motif.endsWith('/**') ? `${motif}/*` : motif).replaceAll('\\ ', '[ ]');
  return `${negation}${partout}${barre === 0 ? contenu.slice(1) : contenu}`;
};

const ignoresDeGit = (texte) =>
  texte
    .split('\n')
    .map((ligne) => ligne.replace(/(?<!\\) +$/, ''))
    .filter((ligne) => ligne !== '' && !ligne.startsWith('#'))
    .map(motifEslintDeLaLigne);

module.exports = { ignoresDeGit };
