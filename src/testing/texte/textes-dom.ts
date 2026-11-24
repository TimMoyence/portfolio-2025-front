export function texteDe(element: Element | null | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function etiquettesDeLaFigureRendue(racine: HTMLElement): HTMLElement[] {
  return Array.from(racine.querySelectorAll<HTMLElement>('.slide-scatter__point-label')).filter(
    (etiquette) =>
      etiquette.closest('.slide-scatter__plot')?.checkVisibility({ visibilityProperty: true }) ===
      true,
  );
}

export function etiquettesRendues(racine: HTMLElement): string[] {
  return etiquettesDeLaFigureRendue(racine).map(texteDe);
}

export function etiquettesMasquees(racine: HTMLElement): string[] {
  return etiquettesDeLaFigureRendue(racine)
    .filter((etiquette) => !etiquette.checkVisibility({ visibilityProperty: true }))
    .map(texteDe);
}

export function textes(racine: HTMLElement, selecteur: string): (string | undefined)[] {
  return Array.from(racine.querySelectorAll(selecteur)).map((noeud) =>
    noeud.textContent?.replace(/\s+/g, ' ').trim(),
  );
}
