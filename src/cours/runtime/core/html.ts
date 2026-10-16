declare const escapedHtmlBrand: unique symbol;

export type EscapedHtml = string & {
  readonly [escapedHtmlBrand]: 'EscapedHtml';
};

class UrlEchappee {
  readonly #texte: string;

  constructor(texte: string) {
    this.#texte = texte;
  }

  toString(): string {
    return this.#texte;
  }
}
Object.freeze(UrlEchappee.prototype);

const urlsEmises = new WeakMap<object, string>();

function emettre(texte: string): UrlEchappee {
  const url = new UrlEchappee(texte);
  Object.freeze(url);
  urlsEmises.set(url, texte);
  return url;
}

function estUnGabaritLitteral(strings: TemplateStringsArray): boolean {
  const raw = Object.getOwnPropertyDescriptor(strings, 'raw');
  return (
    Object.isFrozen(strings) &&
    raw !== undefined &&
    !raw.enumerable &&
    Array.isArray(raw.value) &&
    Object.isFrozen(raw.value) &&
    raw.value.length === strings.length
  );
}

function verifierGabarit(strings: TemplateStringsArray): void {
  if (!estUnGabaritLitteral(strings)) {
    throw new Error(
      'Gabarit refusé : seul un gabarit littéral, dont le tableau est gelé par le moteur, peut transporter du balisage brut.',
    );
  }
}

function estUneUrlEmise(valeur: unknown): valeur is UrlEchappee {
  return typeof valeur === 'object' && valeur !== null && urlsEmises.has(valeur);
}

function texteDe(valeur: unknown): string {
  if ((typeof valeur !== 'object' || valeur === null) && typeof valeur !== 'function') {
    return String(valeur);
  }
  const emise = urlsEmises.get(valeur);
  if (emise === undefined) {
    throw new Error(
      'Interpolation refusée : cet objet n’a pas été émis par escapeUrl, son texte ne dit rien de son contexte.',
    );
  }
  return emise;
}

function copieDe<T>(tableau: readonly T[]): T[] {
  return Array.from({ length: tableau.length }, (_, rang) => rang)
    .filter((rang) => rang in tableau)
    .map((rang) => tableau[rang]);
}

type HtmlFragment = EscapedHtml | number | readonly EscapedHtml[] | UrlEchappee;

export function escapeHtml(value: unknown): EscapedHtml {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;') as EscapedHtml;
}

const ALLOWED_URL_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);

const INERT_URL = '#';

function absoluteScheme(raw: string): string | null {
  try {
    return new URL(raw).protocol;
  } catch {
    return null;
  }
}

/**
 * Le parseur de https://url.spec.whatwg.org/#concept-basic-url-parser retire
 * les tabulations et sauts de ligne de l'entree et met le schema en
 * minuscules : `new URL` ramene `JaVaScRiPt:`, `java<TAB>script:` et
 * ` javascript:` au meme `protocol`, sans normalisation maison. Une entree
 * sans schema valide fait lever le parseur : c'est une reference relative,
 * qui heritera du schema du document.
 */
export function estUrlAutorisee(raw: string): boolean {
  const scheme = absoluteScheme(raw);
  return scheme === null || ALLOWED_URL_SCHEMES.has(scheme);
}

/**
 * Le refus rend `#` et non la chaine vide : par RFC 3986 section 4.2, une
 * reference vide designe le document courant, donc `href=""` reste un lien
 * actif.
 */
export function escapeUrl(value: unknown): UrlEchappee {
  const raw = String(value);
  if (!raw.trim()) return emettre(INERT_URL);
  return emettre(estUrlAutorisee(raw) ? escapeHtml(raw) : INERT_URL);
}

const JETON_CSS = /^[#\w.%-]+$/;

/**
 * Etats du tokenizer de https://html.spec.whatwg.org/multipage/parsing.html#tokenization,
 * reduits a ce qui decide du sens d'une interpolation : texte, balise, nom ou
 * valeur d'attribut, contenu brut de `<script>` et `<style>`.
 */
type Etat =
  | 'texte'
  | 'chevron'
  | 'nom-de-balise'
  | 'fermante'
  | 'declaration'
  | 'balise'
  | 'nom-attribut'
  | 'apres-nom'
  | 'avant-valeur'
  | 'valeur'
  | 'valeur-nue'
  | 'brut';

const ELEMENTS_BRUTS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'noscript',
  'plaintext',
]);

const ATTRIBUTS_URL: ReadonlySet<string> = new Set(['href', 'src', 'poster']);

const ELEMENTS_A_RESSOURCE_ACTIVE: ReadonlySet<string> = new Set([
  'script',
  'base',
  'iframe',
  'frame',
  'embed',
  'object',
  'link',
  'portal',
  'applet',
]);

const ATTRIBUTS_TEXTE: ReadonlySet<string> = new Set([
  'alt',
  'title',
  'class',
  'id',
  'lang',
  'dir',
  'role',
  'aria-label',
  'target',
  'rel',
  'name',
  'align',
  'valign',
  'colspan',
  'rowspan',
  'value',
  'for',
  'step',
  'placeholder',
  'headers',
  'points',
  'srclang',
  'label',
  'preload',
  'type',
]);

const ATTRIBUTS_COULEUR: ReadonlySet<string> = new Set(['fill', 'stroke', 'color', 'bgcolor']);

const ATTRIBUTS_BOOLEENS: ReadonlySet<string> = new Set([
  'disabled',
  'open',
  'checked',
  'selected',
  'hidden',
  'readonly',
]);

function estAttributTexte(attribut: string): boolean {
  return (
    ATTRIBUTS_TEXTE.has(attribut) || attribut.startsWith('data-') || attribut.startsWith('aria-')
  );
}

const MORCEAU_DE_BALISE = /[\t\n\f\r ]+|([a-z][a-z0-9-]*)(?:="[^"]*")?|./gs;

const BLANC = /[\t\n\f\r ]/;

const ETATS_SCELLES: ReadonlySet<Etat> = new Set(['valeur', 'declaration', 'brut']);

const LETTRE = /[a-zA-Z]/;

class LecteurDeGabarit {
  etat: Etat = 'texte';
  balise = '';
  attribut = '';
  guillemet = '';
  valeurVide = true;
  #finDuBrut = '';
  #fermetureDuBrutLue = false;

  readonly #transitions: Readonly<Record<Etat, (c: string) => void>> = {
    texte: (c) => this.dansTexte(c),
    chevron: (c) => this.apresChevron(c),
    'nom-de-balise': (c) => this.dansNomDeBalise(c),
    fermante: (c) => this.jusquAuChevronFermant(c),
    declaration: (c) => this.jusquAuChevronFermant(c),
    balise: (c) => this.dansBalise(c),
    'nom-attribut': (c) => this.dansNomAttribut(c),
    'apres-nom': (c) => this.apresNom(c),
    'avant-valeur': (c) => this.avantValeur(c),
    valeur: (c) => this.dansValeur(c),
    'valeur-nue': (c) => this.dansValeurNue(c),
    brut: (c) => this.dansBrut(c),
  };

  lire(texte: string): void {
    for (const caractere of texte) this.#transitions[this.etat](caractere);
  }

  lireInterpolation(texte: string): void {
    if (!ETATS_SCELLES.has(this.etat)) {
      this.lire(texte);
      return;
    }
    const scelle = this.etat;
    for (const caractere of texte) {
      this.#transitions[this.etat](caractere);
      if (this.etat !== scelle) refuser(`qui referme son contexte « ${scelle} »`);
    }
  }

  private dansTexte(c: string): void {
    if (c === '<') this.etat = 'chevron';
  }

  private dansNomDeBalise(c: string): void {
    if (BLANC.test(c) || c === '/') this.etat = 'balise';
    else if (c === '>') this.fermerBalise();
    else this.balise += c.toLowerCase();
  }

  private jusquAuChevronFermant(c: string): void {
    if (c === '>') this.etat = 'texte';
  }

  private dansBalise(c: string): void {
    if (c === '>') this.fermerBalise();
    else if (!BLANC.test(c) && c !== '/') this.ouvrirAttribut(c);
  }

  private apresNom(c: string): void {
    if (c === '=') this.etat = 'avant-valeur';
    else if (c === '>') this.fermerBalise();
    else if (c === '/') this.etat = 'balise';
    else if (!BLANC.test(c)) this.ouvrirAttribut(c);
  }

  private dansValeur(c: string): void {
    if (c === this.guillemet) this.etat = 'balise';
    else this.valeurVide = false;
  }

  private dansValeurNue(c: string): void {
    if (BLANC.test(c)) this.etat = 'balise';
    else if (c === '>') this.fermerBalise();
  }

  private apresChevron(c: string): void {
    if (LETTRE.test(c)) {
      this.etat = 'nom-de-balise';
      this.balise = c.toLowerCase();
    } else if (c === '/') {
      this.etat = 'fermante';
    } else if (c === '!' || c === '?') {
      this.etat = 'declaration';
    } else if (c !== '<') {
      this.etat = 'texte';
    }
  }

  private ouvrirAttribut(c: string): void {
    this.etat = 'nom-attribut';
    this.attribut = c.toLowerCase();
  }

  private dansNomAttribut(c: string): void {
    if (BLANC.test(c)) this.etat = 'apres-nom';
    else if (c === '=') this.etat = 'avant-valeur';
    else if (c === '>') this.fermerBalise();
    else if (c === '/') this.etat = 'balise';
    else this.attribut += c.toLowerCase();
  }

  private avantValeur(c: string): void {
    if (BLANC.test(c)) return;
    if (c === '"' || c === "'") {
      this.etat = 'valeur';
      this.guillemet = c;
      this.valeurVide = true;
    } else if (c === '>') {
      this.fermerBalise();
    } else {
      this.etat = 'valeur-nue';
    }
  }

  private fermerBalise(): void {
    this.etat = ELEMENTS_BRUTS.has(this.balise) ? 'brut' : 'texte';
    this.#finDuBrut = '';
    this.#fermetureDuBrutLue = false;
  }

  private dansBrut(c: string): void {
    if (this.#fermetureDuBrutLue && (BLANC.test(c) || c === '/' || c === '>')) {
      this.etat = c === '>' ? 'texte' : 'fermante';
      return;
    }
    const fermeture = `</${this.balise}`;
    this.#finDuBrut = (this.#finDuBrut + c.toLowerCase()).slice(-fermeture.length);
    this.#fermetureDuBrutLue = this.#finDuBrut === fermeture;
  }
}

function refuser(contexte: string): never {
  throw new Error(
    `Interpolation refusée ${contexte} : l'échappement HTML n'y protège de rien, « javascript:alert(1) » ne contient aucun caractère échappé. Passez une URL entière par escapeUrl() dans href, src ou poster ; ailleurs, seuls le texte, les attributs descriptifs et les nombres sont admis.`,
  );
}

function verifierValeurDAttribut(
  lecteur: LecteurDeGabarit,
  valeur: HtmlFragment,
  suite: () => string,
): void {
  const { attribut, balise } = lecteur;
  const dans = `dans l'attribut « ${attribut} »`;
  if (ATTRIBUTS_URL.has(attribut)) {
    if (ELEMENTS_A_RESSOURCE_ACTIVE.has(balise)) refuser(`${dans} de <${balise}>`);
    const entiere = () => lecteur.valeurVide && suite().startsWith(lecteur.guillemet);
    if (!estUneUrlEmise(valeur) || !entiere()) refuser(dans);
    return;
  }
  if (estUneUrlEmise(valeur)) refuser(dans);
  if (estAttributTexte(attribut)) return;
  if (ATTRIBUTS_COULEUR.has(attribut) && JETON_CSS.test(texteDe(valeur))) {
    return;
  }
  refuser(dans);
}

function attributsDuFragmentAdmis(valeur: HtmlFragment): boolean {
  if (estUneUrlEmise(valeur)) return false;
  for (const [morceau, nom] of texteDe(valeur).matchAll(MORCEAU_DE_BALISE)) {
    const admis = nom ? estAttributTexte(nom) || ATTRIBUTS_BOOLEENS.has(nom) : BLANC.test(morceau);
    if (!admis) return false;
  }
  return true;
}

function verifierContexte(
  lecteur: LecteurDeGabarit,
  valeur: HtmlFragment,
  suite: () => string,
): void {
  if (typeof valeur === 'number') return;
  switch (lecteur.etat) {
    case 'texte':
    case 'declaration':
      return;
    case 'valeur':
      verifierValeurDAttribut(lecteur, valeur, suite);
      return;
    case 'balise':
    case 'apres-nom':
      if (!attributsDuFragmentAdmis(valeur)) {
        refuser('dans une balise, hors d’une valeur entre guillemets');
      }
      return;
    case 'brut':
      return refuser(`dans le contenu brut de <${lecteur.balise}>`);
    default:
      refuser('dans une balise, hors d’une valeur entre guillemets');
  }
}

function estUnTableau(valeur: HtmlFragment): valeur is readonly EscapedHtml[] {
  return Array.isArray(valeur);
}

function interpolerUne(
  lecteur: LecteurDeGabarit,
  valeur: HtmlFragment,
  suite: () => string,
): string {
  verifierContexte(lecteur, valeur, suite);
  const texte = texteDe(valeur);
  lecteur.lireInterpolation(texte);
  return texte;
}

function interpoler(lecteur: LecteurDeGabarit, valeur: HtmlFragment, suite: string): string {
  if (!estUnTableau(valeur)) return interpolerUne(lecteur, valeur, () => suite);
  const elements = copieDe(valeur);
  if (elements.length === 0) return interpolerUne(lecteur, escapeHtml(''), () => suite);
  return elements
    .map((element, rang) =>
      interpolerUne(
        lecteur,
        element,
        () =>
          elements
            .slice(rang + 1)
            .map(texteDe)
            .join('') + suite,
      ),
    )
    .join('');
}

/**
 * Assemble un gabarit HTML dont chaque interpolation est deja sure : le
 * compilateur rejette toute `string` qui n'est pas passee par `escapeHtml`
 * ou par un autre `safeHtml`. Les nombres sont acceptes tels quels, les
 * tableaux de fragments sont concatenes.
 *
 * Sans interpolation, le gabarit est un litteral ecrit par nous : c'est la
 * seule facon de produire du HTML brut, et elle ne peut pas transporter de
 * donnee externe. Il n'existe donc aucune echappatoire a marquer.
 *
 * Le tag ne s'appelle pas `html` a dessein : Prettier reformaterait alors
 * le contenu du gabarit, ce qui modifierait le rendu des blocs ou les
 * blancs comptent (`<pre>`, `<style>`).
 */
export function safeHtml(
  strings: TemplateStringsArray,
  ...values: readonly HtmlFragment[]
): EscapedHtml {
  verifierGabarit(strings);
  const lecteur = new LecteurDeGabarit();
  let out = strings[0];
  lecteur.lire(strings[0]);
  for (const [index, value] of values.entries()) {
    const suite = strings[index + 1];
    const texte = interpoler(lecteur, value, suite);
    lecteur.lire(suite);
    out += texte + suite;
  }
  return out as EscapedHtml;
}
