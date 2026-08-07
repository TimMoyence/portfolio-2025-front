/** Options de {@link extractErrorMessage}. */
export interface ExtractErrorMessageOptions {
  /**
   * Autorise le repli sur `error.message` (message HTTP top-level) quand aucun
   * message applicatif n'est trouve. Defaut `true` (comportement historique).
   * Les appelants qui affichent un fallback localise passent `false` pour eviter
   * de laisser fuiter un message technique.
   */
  includeTopLevelMessage?: boolean;
}

/**
 * Extrait un message d'erreur lisible depuis une erreur HTTP Angular.
 *
 * Ordre de resolution :
 * 1. `error.error.detail` (string) — ex. verify-email
 * 2. `error.error.message` string[] → joint par espace (validation NestJS)
 * 3. `error.error.message` string
 * 4. `error.message` (top-level) si `includeTopLevelMessage !== false`
 * 5. `undefined`
 *
 * @param error - L'erreur capturee dans un callback `error`
 * @param options - Voir {@link ExtractErrorMessageOptions}
 * @returns Le message extrait, ou `undefined` si aucun message exploitable
 */
export function extractErrorMessage(
  error: unknown,
  options?: ExtractErrorMessageOptions,
): string | undefined {
  const nested = (
    error as {
      error?: { message?: string | string[]; detail?: unknown };
    }
  )?.error;

  const detail = nested?.detail;
  if (typeof detail === 'string') {
    return detail;
  }

  const nestedMessage = nested?.message;
  if (Array.isArray(nestedMessage)) {
    return nestedMessage.join(' ');
  }
  if (typeof nestedMessage === 'string') {
    return nestedMessage;
  }

  if (options?.includeTopLevelMessage !== false) {
    const topLevelMessage = (error as { message?: string })?.message;
    if (typeof topLevelMessage === 'string') {
      return topLevelMessage;
    }
  }

  return undefined;
}
