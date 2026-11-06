export interface Cadre {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface CadreDuTrace {
  readonly cadre: Cadre;
  readonly echelle: number;
}

export function cadreDuTexte(texte: HTMLElement): Cadre {
  const plage = document.createRange();
  plage.selectNodeContents(texte);
  return plage.getBoundingClientRect();
}

export function cadreDuTrace(rendu: HTMLElement, selecteur: string): CadreDuTrace | undefined {
  const trace = rendu.querySelector<HTMLElement>(selecteur);
  if (trace === null) {
    return undefined;
  }
  const cadre = trace.getBoundingClientRect();
  return { cadre, echelle: trace.offsetWidth === 0 ? 1 : cadre.width / trace.offsetWidth };
}

export function decale(
  { left, right, top, bottom }: Cadre,
  recul: number,
  trace?: CadreDuTrace,
): Cadre {
  const aLEcran = recul * (trace?.echelle ?? 1);
  return { left: left + aLEcran, right: right + aLEcran, top, bottom };
}

export function reculDe(texte: HTMLElement): number {
  return Number.parseFloat(texte.style.getPropertyValue('--recul')) || 0;
}

export function reculDansLeTrace(cadre: Cadre, trace: CadreDuTrace | undefined): number {
  if (trace === undefined) {
    return 0;
  }
  const { cadre: limite, echelle } = trace;
  if (cadre.right > limite.right) {
    return Math.floor((limite.right - cadre.right) / echelle);
  }
  return cadre.left < limite.left ? Math.ceil((limite.left - cadre.left) / echelle) : 0;
}

export function memesReculs<Cle>(
  un: ReadonlyMap<Cle, number>,
  autre: ReadonlyMap<Cle, number>,
): boolean {
  return un.size === autre.size && [...un].every(([cle, recul]) => autre.get(cle) === recul);
}

export function mesurerAChaqueRendu(
  rendu: HTMLElement,
  mesurer: () => void,
  onCleanup: (nettoyer: () => void) => void,
  zones: readonly string[] = [],
): void {
  mesurer();
  document.fonts.addEventListener('loadingdone', mesurer);
  onCleanup(() => document.fonts.removeEventListener('loadingdone', mesurer));
  if (typeof ResizeObserver === 'undefined') {
    return;
  }
  const observateur = new ResizeObserver(mesurer);
  observateur.observe(rendu);
  for (const zone of zones) {
    const element = rendu.querySelector(zone);
    if (element !== null) {
      observateur.observe(element);
    }
  }
  onCleanup(() => observateur.disconnect());
}
