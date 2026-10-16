export function initialeDe(...libelles: readonly (string | undefined)[]): string {
  const libelle = libelles.map((candidat) => candidat?.trim() ?? '').find(Boolean) ?? '';
  return libelle.charAt(0).toUpperCase();
}
