export function debordementADroite(racine: HTMLElement, elements: string, cadre: string): number {
  const mesures = [...racine.querySelectorAll<HTMLElement>(elements)];
  const limite = racine.querySelector<HTMLElement>(cadre);
  if (mesures.length === 0 || limite === null) {
    throw new Error(`éléments « ${elements} » ou cadre « ${cadre} » absent`);
  }
  const droite = limite.getBoundingClientRect().right;
  return Math.max(0, ...mesures.map((element) => element.getBoundingClientRect().right - droite));
}
