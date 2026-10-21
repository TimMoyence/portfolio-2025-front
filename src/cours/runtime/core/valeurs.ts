export function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

export function objet(valeur: unknown): Readonly<Record<string, unknown>> | null {
  return estObjet(valeur) ? valeur : null;
}

export function chaineDe(valeur: unknown, cle: string): string | null {
  const champ = objet(valeur)?.[cle];
  return typeof champ === 'string' ? champ : null;
}

export function estChaineOuNul(valeur: unknown): valeur is string | null {
  return valeur === null || typeof valeur === 'string';
}

export function estChaineNonVide(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur !== '';
}

export function estTexteNonVide(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.trim() !== '';
}

export function estNombreFini(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isFinite(valeur);
}

export function estPositif(valeur: unknown): valeur is number {
  return estNombreFini(valeur) && valeur > 0;
}

export function estEntierPositif(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isSafeInteger(valeur) && valeur >= 0;
}

export function estMembre<T extends string>(valeurs: readonly T[], valeur: unknown): valeur is T {
  return typeof valeur === 'string' && (valeurs as readonly string[]).includes(valeur);
}

export function memeIdentifiant(
  avant: { readonly id: string } | null,
  apres: { readonly id: string } | null,
): boolean {
  return (avant?.id ?? null) === (apres?.id ?? null);
}

export function echapperPourRegex(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function jsonOuNull(texte: string): unknown {
  try {
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

export function fini(valeur: number, repli: number): number {
  return Number.isFinite(valeur) ? valeur : repli;
}

export function part(compte: number, total: number): number {
  return total > 0 ? compte / total : 0;
}

const MOTIF_NOMBRE_SAISI = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;
const ESPACES_SAISIS = /\s/g;
const MOINS_TYPOGRAPHIQUE = /−/g;

export function lireNombreSaisi(brut: string): number | null {
  const compact = brut
    .replace(ESPACES_SAISIS, '')
    .replace(MOINS_TYPOGRAPHIQUE, '-')
    .replaceAll(',', '.');
  if (!MOTIF_NOMBRE_SAISI.test(compact)) {
    return null;
  }
  const nombre = Number(compact);
  if (!Number.isFinite(nombre)) {
    return null;
  }
  return nombre === 0 ? 0 : nombre;
}

export function bornerEntre(valeur: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, valeur));
}

export function entierBorne(
  valeur: number,
  minimum: number,
  maximum: number,
  repli: number,
): number {
  return Number.isFinite(valeur) ? bornerEntre(Math.trunc(valeur), minimum, maximum) : repli;
}
