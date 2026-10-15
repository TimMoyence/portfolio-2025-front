const lignes = (valeur: unknown): string | undefined => {
  if (typeof valeur === 'string') {
    return valeur;
  }
  if (Array.isArray(valeur) && valeur.every((ligne) => typeof ligne === 'string')) {
    return valeur.join(' ');
  }
  return undefined;
};

export function extractErrorMessage(error: unknown): string | undefined {
  const corps = (error as { error?: { message?: unknown; detail?: unknown } } | null | undefined)
    ?.error;
  return lignes(corps?.detail) ?? lignes(corps?.message);
}
