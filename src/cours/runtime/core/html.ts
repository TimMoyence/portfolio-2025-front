declare const escapedHtmlBrand: unique symbol;

export type EscapedHtml = string & {
  readonly [escapedHtmlBrand]: 'EscapedHtml';
};

type HtmlFragment = EscapedHtml | number | readonly EscapedHtml[];

export function escapeHtml(value: unknown): EscapedHtml {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;') as EscapedHtml;
}

export function safeHtml(
  strings: TemplateStringsArray,
  ...values: readonly HtmlFragment[]
): EscapedHtml {
  let sortie = strings[0];
  for (const [index, valeur] of values.entries()) {
    sortie += Array.isArray(valeur) ? valeur.join('') : String(valeur);
    sortie += strings[index + 1];
  }
  return sortie as EscapedHtml;
}
