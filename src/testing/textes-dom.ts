export function textes(racine: HTMLElement, selecteur: string): (string | undefined)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.textContent?.replace(/\s+/g, ' ').trim(),
  );
}
