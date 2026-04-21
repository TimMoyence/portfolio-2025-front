/**
 * Bridge tsx minimal : stub Angular `$localize` pour pouvoir importer
 * la registry des formations hors contexte Angular, puis serialise
 * chaque config en JSON.
 *
 * Les tag-templates `$localize` retournent simplement la valeur FR
 * reconstituee. On perd la traduction EN mais ce n'est pas grave — le
 * validateur AEO teste uniquement les invariants structurels (mots FR/EN
 * mesures separement dans `metadata.description`, meme $localize-stub).
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
