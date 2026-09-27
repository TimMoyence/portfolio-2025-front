interface Morceau {
  readonly texte: string;
  readonly ponctuation: string;
}

interface Ligne {
  readonly texte: string;
  readonly calcul: boolean;
}

const OPERATEUR = /[×÷=≈^]/;
const MILLIERS = /(\d) (?=\d{3}(?!\d))/g;
const ESPACE_FINE_INSECABLE = ' ';
const PONCTUATIONS_DE_COUPURE = new Set([',', ';', ':', '.', '?', '!']);
const OUVRANTES = new Set(['(', '[']);
const FERMANTES = new Set([')', ']']);

function morceaux(texte: string): readonly Morceau[] {
  const resultat: Morceau[] = [];
  let profondeur = 0;
  let debut = 0;
  for (let index = 0; index < texte.length; index += 1) {
    const caractere = texte[index];
    if (OUVRANTES.has(caractere)) {
      profondeur += 1;
    } else if (FERMANTES.has(caractere)) {
      profondeur = Math.max(0, profondeur - 1);
    } else if (
      caractere === ' ' &&
      profondeur === 0 &&
      index > debut &&
      PONCTUATIONS_DE_COUPURE.has(texte[index - 1])
    ) {
      resultat.push({ texte: texte.slice(debut, index), ponctuation: texte[index - 1] });
      debut = index + 1;
    }
  }
  return [...resultat, { texte: texte.slice(debut), ponctuation: '' }].filter(
    ({ texte: morceau }) => morceau.length > 0,
  );
}

function coupe(derniere: Ligne, ponctuationPrecedente: string, calcul: boolean): boolean {
  return ponctuationPrecedente === ',' ? derniere.calcul : derniere.calcul || calcul;
}

export function lignesDeCalcul(texte: string): readonly string[] {
  const colle = texte.replace(MILLIERS, `$1${ESPACE_FINE_INSECABLE}`);
  if (!OPERATEUR.test(colle)) {
    return [colle];
  }
  const lignes: Ligne[] = [];
  let ponctuationPrecedente = '';
  for (const morceau of morceaux(colle)) {
    const calcul = OPERATEUR.test(morceau.texte);
    const derniere = lignes.at(-1);
    if (derniere === undefined || coupe(derniere, ponctuationPrecedente, calcul)) {
      lignes.push({ texte: morceau.texte, calcul });
    } else {
      lignes[lignes.length - 1] = {
        texte: `${derniere.texte} ${morceau.texte}`,
        calcul: derniere.calcul || calcul,
      };
    }
    ponctuationPrecedente = morceau.ponctuation;
  }
  return lignes.map(({ texte: ligne }) => ligne);
}
