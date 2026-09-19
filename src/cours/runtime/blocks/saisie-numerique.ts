const ESPACES = /\s/g;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

export function lireNombreSaisi(brut: string): number | null {
  const compacte = brut.replace(ESPACES, '').replaceAll(',', '.').replace('−', '-');
  return DECIMAL.test(compacte) ? Number(compacte) : null;
}
