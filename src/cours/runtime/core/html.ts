declare const escapedHtmlBrand: unique symbol;

export type EscapedHtml = string & {
  readonly [escapedHtmlBrand]: 'EscapedHtml';
};

export class UrlEchappee {
  constructor(readonly valeur: EscapedHtml) {}

  toString(): string {
    return this.valeur;
  }
}

type HtmlFragment = EscapedHtml | number | readonly EscapedHtml[] | UrlEchappee;

const SCHEMAS_URL_AUTORISES: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);
const ATTRIBUTS_URL: ReadonlySet<string> = new Set(['href', 'src']);
const ATTRIBUTS_SENSIBLES: ReadonlySet<string> = new Set(['href', 'src', 'style']);
const ATTRIBUT_OUVERT = /(?:^|[\s/])([a-zA-Z][a-zA-Z0-9:_-]*)\s*=\s*(?:"[^"]*|'[^']*)?$/;

export function escapeHtml(value: unknown): EscapedHtml {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;') as EscapedHtml;
}

function schemaAbsolu(brut: string): string | null {
  try {
    return new URL(brut).protocol;
  } catch {
    return null;
  }
}

export function escapeUrl(value: unknown): UrlEchappee {
  const brut = String(value);
  const inerte = escapeHtml('#');
  if (brut.trim().length === 0) {
    return new UrlEchappee(inerte);
  }
  const schema = schemaAbsolu(brut);
  if (schema === null) {
    return new UrlEchappee(escapeHtml(brut));
  }
  return new UrlEchappee(SCHEMAS_URL_AUTORISES.has(schema) ? escapeHtml(brut) : inerte);
}

function attributSensible(prefixe: string): string | null {
  const trouve = ATTRIBUT_OUVERT.exec(prefixe);
  if (trouve === null) {
    return null;
  }
  const nom = trouve[1].toLowerCase();
  return ATTRIBUTS_SENSIBLES.has(nom) || nom.startsWith('on') ? nom : null;
}

function refuserContexte(nom: string): never {
  throw new Error(
    `Interpolation refusée dans l'attribut « ${nom} » : l'échappement HTML n'y protège de rien, « javascript:alert(1) » ne contient aucun caractère échappé. Passez la valeur par escapeUrl() pour href et src ; style et les gestionnaires on* n'admettent aucune donnée interpolée.`,
  );
}

function verifierContexte(prefixe: string, valeur: HtmlFragment): void {
  const nom = attributSensible(prefixe);
  if (nom === null || typeof valeur === 'number') {
    return;
  }
  if (!(valeur instanceof UrlEchappee) || !ATTRIBUTS_URL.has(nom)) {
    refuserContexte(nom);
  }
}

export function safeHtml(
  strings: TemplateStringsArray,
  ...values: readonly HtmlFragment[]
): EscapedHtml {
  let sortie = strings[0];
  for (const [index, valeur] of values.entries()) {
    verifierContexte(sortie, valeur);
    sortie += Array.isArray(valeur) ? valeur.join('') : String(valeur);
    sortie += strings[index + 1];
  }
  return sortie as EscapedHtml;
}
