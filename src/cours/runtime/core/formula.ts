export type CodeErreur = '#REF!' | '#DIV/0!' | '#NOM?' | '#VALEUR!';

export interface ResultatFormule {
  readonly valeur: number | null;
  readonly erreur: CodeErreur | null;
}

export interface Feuille {
  readonly lignes: number;
  readonly colonnes: number;
  readonly cellules: Readonly<Record<string, string>>;
}

interface Reference {
  readonly ligne: number;
  readonly colonne: number;
  readonly ligneFixe: boolean;
  readonly colonneFixe: boolean;
}

interface Contexte {
  readonly feuille: Feuille | null;
  readonly variables: Readonly<Record<string, number>>;
}

type GenreJeton =
  | 'nombre'
  | 'reference'
  | 'nom'
  | 'operateur'
  | 'comparaison'
  | 'ouvrante'
  | 'fermante'
  | 'separateur'
  | 'deuxpoints';

interface Jeton {
  readonly genre: GenreJeton;
  readonly texte: string;
}

type Noeud =
  | { readonly genre: 'litteral'; readonly valeur: number }
  | { readonly genre: 'cellule'; readonly reference: Reference }
  | { readonly genre: 'plage'; readonly debut: Reference; readonly fin: Reference }
  | { readonly genre: 'variable'; readonly nom: string }
  | { readonly genre: 'unaire'; readonly signe: number; readonly operande: Noeud }
  | {
      readonly genre: 'binaire';
      readonly operateur: string;
      readonly gauche: Noeud;
      readonly droite: Noeud;
    }
  | { readonly genre: 'appel'; readonly nom: string; readonly arguments: readonly Noeud[] };

class ErreurFormule extends Error {
  constructor(readonly code: CodeErreur) {
    super(code);
  }
}

const MARQUE = '=';
const PROFONDEUR_MAX = 512;
const MOTIF_NOMBRE = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)/;
const MOTIF_REFERENCE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d{1,7})(?![A-Za-z\d])/;
const MOTIF_NOM = /^[A-Za-z]+/;
const MOTIF_ESPACE = /^\s+/;
const COMPARAISONS = ['<=', '>=', '<>', '<', '>', '='] as const;
const OPERATEURS: ReadonlySet<string> = new Set(['+', '-', '*', '/', '^']);
const ADDITIFS: ReadonlySet<string> = new Set(['+', '-']);
const MULTIPLICATIFS: ReadonlySet<string> = new Set(['*', '/']);
const PONCTUATION: Readonly<Record<string, GenreJeton | undefined>> = {
  '(': 'ouvrante',
  ')': 'fermante',
  ';': 'separateur',
  ':': 'deuxpoints',
};
const FONCTIONS_MULTIPLES: ReadonlySet<string> = new Set(['SOMME', 'MOYENNE']);
const FONCTIONS_BINAIRES: ReadonlySet<string> = new Set(['ARRONDI', 'PUISSANCE']);
const NOM_CONDITION = 'SI';
const ALPHABET = 26;
const CODE_A = 'A'.charCodeAt(0);

function refuser(code: CodeErreur): never {
  throw new ErreurFormule(code);
}

export function lettreColonne(colonne: number): string {
  let reste = colonne;
  let lettres = '';
  do {
    lettres = String.fromCharCode(CODE_A + (reste % ALPHABET)) + lettres;
    reste = Math.floor(reste / ALPHABET) - 1;
  } while (reste >= 0);
  return lettres;
}

export function nomCellule(ligne: number, colonne: number): string {
  return `${lettreColonne(colonne)}${ligne + 1}`;
}

function indexColonne(lettres: string): number {
  return [...lettres.toUpperCase()].reduce(
    (cumul, lettre) => cumul * ALPHABET + (lettre.charCodeAt(0) - CODE_A + 1),
    0,
  );
}

function lireReference(texte: string): Reference {
  const trouve = MOTIF_REFERENCE.exec(texte);
  if (trouve === null) {
    refuser('#VALEUR!');
  }
  return {
    ligne: Number(trouve[4]) - 1,
    colonne: indexColonne(trouve[2]) - 1,
    ligneFixe: trouve[3] === '$',
    colonneFixe: trouve[1] === '$',
  };
}

function ecrireReference(reference: Reference): string {
  if (reference.ligne < 0 || reference.colonne < 0) {
    return '#REF!';
  }
  const colonne = `${reference.colonneFixe ? '$' : ''}${lettreColonne(reference.colonne)}`;
  return `${colonne}${reference.ligneFixe ? '$' : ''}${reference.ligne + 1}`;
}

function lireNombre(brut: string): number {
  const compact = brut.trim().replace(',', '.');
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(compact) ? Number(compact) : Number.NaN;
}

function jetonSuivant(reste: string): Jeton {
  if (MOTIF_NOMBRE.test(reste)) {
    return { genre: 'nombre', texte: (MOTIF_NOMBRE.exec(reste) ?? [''])[0] };
  }
  if (MOTIF_REFERENCE.test(reste)) {
    return { genre: 'reference', texte: (MOTIF_REFERENCE.exec(reste) ?? [''])[0] };
  }
  if (MOTIF_NOM.test(reste)) {
    return { genre: 'nom', texte: (MOTIF_NOM.exec(reste) ?? [''])[0] };
  }
  const comparaison = COMPARAISONS.find((signe) => reste.startsWith(signe));
  if (comparaison !== undefined) {
    return { genre: 'comparaison', texte: comparaison };
  }
  const premier = reste[0];
  if (OPERATEURS.has(premier)) {
    return { genre: 'operateur', texte: premier };
  }
  const ponctuation = PONCTUATION[premier];
  if (ponctuation === undefined) {
    refuser('#VALEUR!');
  }
  return { genre: ponctuation, texte: premier };
}

function decouper(source: string): Jeton[] {
  const jetons: Jeton[] = [];
  let reste = source;
  while (reste.length > 0) {
    const espace = MOTIF_ESPACE.exec(reste);
    if (espace !== null) {
      reste = reste.slice(espace[0].length);
      continue;
    }
    const jeton = jetonSuivant(reste);
    jetons.push(jeton);
    reste = reste.slice(jeton.texte.length);
  }
  return jetons;
}

class Analyseur {
  private position = 0;
  private profondeur = 0;

  constructor(private readonly jetons: readonly Jeton[]) {}

  analyser(): Noeud {
    const racine = this.comparaison();
    if (this.position !== this.jetons.length) {
      refuser('#VALEUR!');
    }
    return racine;
  }

  private courant(): Jeton | null {
    return this.jetons[this.position] ?? null;
  }

  private avancer(): Jeton {
    const jeton = this.courant();
    if (jeton === null) {
      refuser('#VALEUR!');
    }
    this.position += 1;
    return jeton;
  }

  private consommer(genre: GenreJeton): void {
    if (this.avancer().genre !== genre) {
      refuser('#VALEUR!');
    }
  }

  private comparaison(): Noeud {
    const gauche = this.somme();
    const jeton = this.courant();
    if (jeton === null || jeton.genre !== 'comparaison') {
      return gauche;
    }
    this.position += 1;
    return { genre: 'binaire', operateur: jeton.texte, gauche, droite: this.somme() };
  }

  private somme(): Noeud {
    return this.suite(ADDITIFS, () => this.produit());
  }

  private produit(): Noeud {
    return this.suite(MULTIPLICATIFS, () => this.puissance());
  }

  private suite(signes: ReadonlySet<string>, niveau: () => Noeud): Noeud {
    let gauche = niveau();
    let jeton = this.courant();
    while (jeton !== null && jeton.genre === 'operateur' && signes.has(jeton.texte)) {
      this.position += 1;
      gauche = { genre: 'binaire', operateur: jeton.texte, gauche, droite: niveau() };
      jeton = this.courant();
    }
    return gauche;
  }

  private puissance(): Noeud {
    const gauche = this.unaire();
    const jeton = this.courant();
    if (jeton === null || jeton.genre !== 'operateur' || jeton.texte !== '^') {
      return gauche;
    }
    this.position += 1;
    return { genre: 'binaire', operateur: '^', gauche, droite: this.puissance() };
  }

  private unaire(): Noeud {
    const jeton = this.courant();
    if (jeton !== null && jeton.genre === 'operateur' && ADDITIFS.has(jeton.texte)) {
      this.position += 1;
      return { genre: 'unaire', signe: jeton.texte === '-' ? -1 : 1, operande: this.unaire() };
    }
    return this.primaire();
  }

  private groupe(): Noeud {
    this.profondeur += 1;
    if (this.profondeur > PROFONDEUR_MAX) {
      refuser('#VALEUR!');
    }
    const interne = this.comparaison();
    this.consommer('fermante');
    this.profondeur -= 1;
    return interne;
  }

  private primaire(): Noeud {
    const jeton = this.avancer();
    if (jeton.genre === 'nombre') {
      return { genre: 'litteral', valeur: Number(jeton.texte.replace(',', '.')) };
    }
    if (jeton.genre === 'ouvrante') {
      return this.groupe();
    }
    if (jeton.genre === 'reference') {
      return this.celluleOuPlage(jeton);
    }
    if (jeton.genre === 'nom') {
      return this.courant()?.genre === 'ouvrante'
        ? this.appel(jeton.texte)
        : { genre: 'variable', nom: jeton.texte };
    }
    return refuser('#VALEUR!');
  }

  private celluleOuPlage(jeton: Jeton): Noeud {
    const debut = lireReference(jeton.texte);
    if (this.courant()?.genre !== 'deuxpoints') {
      return { genre: 'cellule', reference: debut };
    }
    this.position += 1;
    const fin = this.avancer();
    if (fin.genre !== 'reference') {
      refuser('#VALEUR!');
    }
    return { genre: 'plage', debut, fin: lireReference(fin.texte) };
  }

  private appel(nom: string): Noeud {
    this.position += 1;
    const parametres: Noeud[] = [];
    if (this.courant()?.genre === 'fermante') {
      this.position += 1;
      return { genre: 'appel', nom: nom.toUpperCase(), arguments: parametres };
    }
    parametres.push(this.comparaison());
    while (this.courant()?.genre === 'separateur') {
      this.position += 1;
      parametres.push(this.comparaison());
    }
    this.consommer('fermante');
    return { genre: 'appel', nom: nom.toUpperCase(), arguments: parametres };
  }
}

function analyser(source: string): Noeud {
  return new Analyseur(decouper(source)).analyser();
}

function horsGrille(feuille: Feuille, reference: Reference): boolean {
  return (
    reference.ligne < 0 ||
    reference.colonne < 0 ||
    reference.ligne >= feuille.lignes ||
    reference.colonne >= feuille.colonnes
  );
}

function valeurCellule(
  contexte: Contexte,
  reference: Reference,
  chemin: readonly string[],
): number {
  const feuille = contexte.feuille;
  if (feuille === null) {
    refuser('#REF!');
  }
  if (horsGrille(feuille, reference)) {
    refuser('#REF!');
  }
  const nom = nomCellule(reference.ligne, reference.colonne);
  if (chemin.includes(nom)) {
    refuser('#REF!');
  }
  const brut = feuille.cellules[nom] ?? '';
  if (brut.trim().length === 0) {
    return 0;
  }
  if (brut.trimStart().startsWith(MARQUE)) {
    return calculer(analyser(brut.trimStart().slice(1)), contexte, [...chemin, nom]);
  }
  const nombre = lireNombre(brut);
  return Number.isNaN(nombre) ? refuser('#VALEUR!') : nombre;
}

function etendre(contexte: Contexte, noeud: Noeud, chemin: readonly string[]): number[] {
  if (noeud.genre !== 'plage') {
    return [calculer(noeud, contexte, chemin)];
  }
  const valeurs: number[] = [];
  for (
    let ligne = Math.min(noeud.debut.ligne, noeud.fin.ligne);
    ligne <= Math.max(noeud.debut.ligne, noeud.fin.ligne);
    ligne += 1
  ) {
    for (
      let colonne = Math.min(noeud.debut.colonne, noeud.fin.colonne);
      colonne <= Math.max(noeud.debut.colonne, noeud.fin.colonne);
      colonne += 1
    ) {
      valeurs.push(
        valeurCellule(contexte, { ligne, colonne, ligneFixe: false, colonneFixe: false }, chemin),
      );
    }
  }
  return valeurs;
}

function comparer(operateur: string, gauche: number, droite: number): number {
  const vrai =
    (operateur === '=' && gauche === droite) ||
    (operateur === '<>' && gauche !== droite) ||
    (operateur === '<' && gauche < droite) ||
    (operateur === '<=' && gauche <= droite) ||
    (operateur === '>' && gauche > droite) ||
    (operateur === '>=' && gauche >= droite);
  return vrai ? 1 : 0;
}

function appliquer(operateur: string, gauche: number, droite: number): number {
  if (operateur === '+') {
    return gauche + droite;
  }
  if (operateur === '-') {
    return gauche - droite;
  }
  if (operateur === '*') {
    return gauche * droite;
  }
  if (operateur === '/') {
    return droite === 0 ? refuser('#DIV/0!') : gauche / droite;
  }
  if (operateur === '^') {
    return gauche ** droite;
  }
  return comparer(operateur, gauche, droite);
}

function arrondir(valeur: number, decimales: number): number {
  const facteur = 10 ** Math.trunc(decimales);
  return Math.round(valeur * facteur) / facteur;
}

function condition(
  contexte: Contexte,
  parametres: readonly Noeud[],
  chemin: readonly string[],
): number {
  if (parametres.length !== 3) {
    refuser('#VALEUR!');
  }
  const testee = calculer(parametres[0], contexte, chemin);
  return calculer(testee === 0 ? parametres[2] : parametres[1], contexte, chemin);
}

function agreger(nom: string, valeurs: readonly number[]): number {
  const somme = valeurs.reduce((cumul, valeur) => cumul + valeur, 0);
  if (nom === 'SOMME') {
    return somme;
  }
  return valeurs.length === 0 ? refuser('#DIV/0!') : somme / valeurs.length;
}

function binaireNommee(nom: string, parametres: readonly number[]): number {
  if (parametres.length !== 2) {
    refuser('#VALEUR!');
  }
  return nom === 'ARRONDI'
    ? arrondir(parametres[0], parametres[1])
    : parametres[0] ** parametres[1];
}

function appeler(
  contexte: Contexte,
  noeud: Extract<Noeud, { genre: 'appel' }>,
  chemin: readonly string[],
): number {
  if (noeud.nom === NOM_CONDITION) {
    return condition(contexte, noeud.arguments, chemin);
  }
  if (FONCTIONS_MULTIPLES.has(noeud.nom)) {
    return agreger(
      noeud.nom,
      noeud.arguments.flatMap((argument) => etendre(contexte, argument, chemin)),
    );
  }
  if (FONCTIONS_BINAIRES.has(noeud.nom)) {
    return binaireNommee(
      noeud.nom,
      noeud.arguments.map((argument) => calculer(argument, contexte, chemin)),
    );
  }
  return refuser('#NOM?');
}

function calculer(noeud: Noeud, contexte: Contexte, chemin: readonly string[]): number {
  if (noeud.genre === 'litteral') {
    return noeud.valeur;
  }
  if (noeud.genre === 'variable') {
    return Object.hasOwn(contexte.variables, noeud.nom)
      ? contexte.variables[noeud.nom]
      : refuser('#NOM?');
  }
  if (noeud.genre === 'cellule') {
    return valeurCellule(contexte, noeud.reference, chemin);
  }
  if (noeud.genre === 'unaire') {
    return noeud.signe * calculer(noeud.operande, contexte, chemin);
  }
  if (noeud.genre === 'binaire') {
    return appliquer(
      noeud.operateur,
      calculer(noeud.gauche, contexte, chemin),
      calculer(noeud.droite, contexte, chemin),
    );
  }
  if (noeud.genre === 'appel') {
    return appeler(contexte, noeud, chemin);
  }
  return refuser('#VALEUR!');
}

function echec(cause: unknown): ResultatFormule {
  return { valeur: null, erreur: cause instanceof ErreurFormule ? cause.code : '#VALEUR!' };
}

function fini(valeur: number): ResultatFormule {
  return Number.isFinite(valeur) ? { valeur, erreur: null } : { valeur: null, erreur: '#VALEUR!' };
}

function arrondirResultat(resultat: ResultatFormule): ResultatFormule {
  return resultat.valeur === null
    ? resultat
    : { valeur: Number(resultat.valeur.toFixed(6)), erreur: null };
}

export function evaluerCellule(feuille: Feuille, nom: string): ResultatFormule {
  try {
    return fini(valeurCellule({ feuille, variables: {} }, lireReference(nom), []));
  } catch (cause) {
    return echec(cause);
  }
}

export function evaluerExpression(
  source: string,
  variables: Readonly<Record<string, number>>,
): ResultatFormule {
  try {
    const debut = source.trimStart();
    const expression = debut.startsWith(MARQUE) ? debut.slice(1) : debut;
    return arrondirResultat(fini(calculer(analyser(expression), { feuille: null, variables }, [])));
  } catch (cause) {
    return echec(cause);
  }
}

export function decalerFormule(
  formule: string,
  decalageLigne: number,
  decalageColonne: number,
): string {
  if (!formule.trimStart().startsWith(MARQUE)) {
    return formule;
  }
  try {
    const jetons = decouper(formule.trimStart().slice(1));
    return (
      MARQUE + jetons.map((jeton) => decalerJeton(jeton, decalageLigne, decalageColonne)).join('')
    );
  } catch {
    return formule;
  }
}

function decalerJeton(jeton: Jeton, decalageLigne: number, decalageColonne: number): string {
  if (jeton.genre !== 'reference') {
    return jeton.texte;
  }
  const reference = lireReference(jeton.texte);
  return ecrireReference({
    ligne: reference.ligneFixe ? reference.ligne : reference.ligne + decalageLigne,
    colonne: reference.colonneFixe ? reference.colonne : reference.colonne + decalageColonne,
    ligneFixe: reference.ligneFixe,
    colonneFixe: reference.colonneFixe,
  });
}

export function formaterResultat(resultat: ResultatFormule): string {
  if (resultat.erreur !== null || resultat.valeur === null) {
    return resultat.erreur ?? '#VALEUR!';
  }
  return String(Number(resultat.valeur.toFixed(6))).replace('.', ',');
}

const MOTIF_CLE_GABARIT = /\{([^{}]+)\}/g;

export function remplirGabarit(
  gabarit: string,
  valeurs: Readonly<Record<string, number>>,
  formater: (valeur: number) => string,
): string {
  return gabarit.replace(MOTIF_CLE_GABARIT, (correspondance, cle: string) =>
    Object.hasOwn(valeurs, cle) ? formater(valeurs[cle]) : correspondance,
  );
}
