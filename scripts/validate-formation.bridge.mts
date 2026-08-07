/**
 * Stub d'Angular `$localize` : sans lui, importer la registry des formations
 * hors contexte Angular echoue. Les tag-templates retournent la valeur FR
 * reconstituee — on perd la traduction EN, sans consequence pour le validateur
 * AEO qui ne teste que des invariants structurels.
 */

// @ts-expect-error global shim injected at runtime by Angular — we simulate it.
globalThis.$localize = function (
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  // Enleve la meta "@@key:" du premier segment (format Angular i18n).
  const first = strings[0] ?? "";
  const cleaned = first.replace(/^:[^:]*:/, "");
  let out = cleaned;
  for (let i = 0; i < values.length; i++) {
    out += String(values[i]) + (strings[i + 1] ?? "");
  }
  return out;
};

const registryPath =
  "../src/app/features/formations/shared/formations.registry";
const mod = await import(registryPath);
const configs = mod.allFormations();
process.stdout.write(JSON.stringify(configs));
