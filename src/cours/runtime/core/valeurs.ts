export function estObjet(valeur: unknown): valeur is Readonly<Record<string, unknown>> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

export function estEntierPositif(valeur: unknown): valeur is number {
  return typeof valeur === 'number' && Number.isSafeInteger(valeur) && valeur >= 0;
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
