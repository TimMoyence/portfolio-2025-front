/**
 * Stub d'Angular `$localize` : sans lui, importer le catalogue des formations
 * hors contexte Angular echoue. Les tag-templates retournent la valeur FR
 * reconstituee — on perd la traduction EN, sans consequence pour le validateur
 * AEO qui ne teste que des invariants structurels.
 */

// @ts-expect-error global shim injected at runtime by Angular — we simulate it.
globalThis.$localize = function (strings: TemplateStringsArray, ...values: unknown[]): string {
  // Enleve la meta "@@key:" du premier segment (format Angular i18n).
  const first = strings[0] ?? '';
  const cleaned = first.replace(/^:[^:]*:/, '');
  let out = cleaned;
  for (let i = 0; i < values.length; i++) {
    out += String(values[i]) + (strings[i + 1] ?? '');
  }
  return out;
};

const formationsModule = await import('../src/app/features/formations/formations-list.data');
const configs = formationsModule.FORMATIONS.filter(
  (formation) => !formation.link.endsWith('/toolkit'),
).map((formation) => ({
  slug: formation.link.replace(/^\/formations\//, ''),
  title: formation.title,
  description: formation.description,
  price: formation.price,
  cta: formation.cta,
  meta: formation.meta,
}));
process.stdout.write(JSON.stringify(configs));
