/**
 * Lit de facon type-safe la valeur textuelle depuis un `Event` DOM.
 * Superset couvrant `<input>` ET `<textarea>`.
 *
 * SSR-safe : la fonction n'est invoquee que depuis des handlers d'evenements
 * DOM (jamais pendant le rendu serveur), donc les globals `HTMLInputElement` /
 * `HTMLTextAreaElement` ne sont dereferences qu'en navigateur.
 *
 * @param event - L'evenement DOM (`input`, `change`, ...)
 * @returns La valeur de l'element, ou `""` si la cible n'est pas un input/textarea
 */
export function readInputValue(event: Event): string {
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return target.value;
  }
  return "";
}

/**
 * Lit de facon type-safe l'etat coche d'une checkbox depuis un `Event` DOM.
 *
 * @param event - L'evenement DOM (`change`)
 * @returns `true`/`false` selon `checked`, ou `false` si la cible n'est pas un input
 */
export function readCheckboxChecked(event: Event): boolean {
  const target = event.target;
  return target instanceof HTMLInputElement ? target.checked : false;
}
