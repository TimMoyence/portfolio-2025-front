export function estUnNumeroDeTelephone(numero: string): boolean {
  const saisi = numero.trim();
  if (!/^[0-9+\s().-]+$/.test(saisi)) {
    return false;
  }
  const compact = saisi.replace(/[\s().-]/g, '');
  const chiffres = compact.startsWith('00') ? compact.slice(2) : compact.replace(/^\+/, '');
  return /^\d{6,15}$/.test(chiffres);
}

export const telephoneFacultatif = (valeur: string | null | undefined): string | null =>
  valeur?.trim() || null;
