/**
 * Extrait un message d'erreur lisible depuis une erreur HTTP Angular.
 *
 * Gere les cas suivants :
 * - `error.error.message` de type `string`
 * - `error.error.message` de type `string[]` (validation NestJS)
 * - `error.message` (fallback sur le message HTTP standard)
 *
 * @param error - L'erreur capturee dans un subscribe `error` callback
 * @returns Le message extrait, ou `undefined` si aucun message exploitable
 */
export function extractErrorMessage(error: unknown): string | undefined {
  const nestedMessage = (error as { error?: { message?: string | string[] } })
    ?.error?.message;

  if (Array.isArray(nestedMessage)) {
    return nestedMessage.join(" ");
  }

  if (typeof nestedMessage === "string") {
    return nestedMessage;
  }

  const topLevelMessage = (error as { message?: string })?.message;
  return typeof topLevelMessage === "string" ? topLevelMessage : undefined;
}
