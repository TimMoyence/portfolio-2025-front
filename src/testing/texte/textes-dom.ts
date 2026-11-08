export function texteDe(element: Element | null | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function textes(racine: HTMLElement, selecteur: string): (string | undefined)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.textContent?.replace(/\s+/g, ' ').trim(),
  );
}
