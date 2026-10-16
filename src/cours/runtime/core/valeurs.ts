export function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

export function estEntierStrictementPositif(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isSafeInteger(valeur) && valeur > 0;
}

export function estEntierPositif(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isSafeInteger(valeur) && valeur >= 0;
}

export function estMembre<T extends string>(valeurs: readonly T[], valeur: unknown): valeur is T {
  return typeof valeur === 'string' && (valeurs as readonly string[]).includes(valeur);
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

const ESPACE_INSECABLE = String.fromCharCode(0x00a0);

export function avecUnite(valeur: number | string, unite: string): string {
  return `${valeur}${ESPACE_INSECABLE}${unite}`;
}
