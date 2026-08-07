/**
 * SSR-safe malgre les globals DOM : la fonction n'est invoquee que depuis des
 * handlers d'evenements, jamais pendant le rendu serveur.
 */
export function readInputValue(event: Event): string {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }
  return '';
}

export function readCheckboxChecked(event: Event): boolean {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.checked : false;
}
