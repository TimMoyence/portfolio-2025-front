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

export const ECART_LISIBLE_PX = 4;
const ECART_EMPILE_PX = 2;
const ECART_AUX_FORMES_PX = 3;

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

function seRecouvrent(
  un: Cadre,
  autre: Cadre,
  ecartEnLargeur: number,
  ecartEnHauteur: number,
): boolean {
  return (
    Math.min(un.right, autre.right) - Math.max(un.left, autre.left) > -ecartEnLargeur &&
    Math.min(un.bottom, autre.bottom) - Math.max(un.top, autre.top) > -ecartEnHauteur
  );
}

export function seGenent(un: Cadre, autre: Cadre, echelle: number): boolean {
  return seRecouvrent(un, autre, ECART_LISIBLE_PX * echelle, ECART_EMPILE_PX * echelle);
}

export function pasQuiDegage(colonnes: readonly (readonly Cadre[])[], echelle: number): number {
  const degage = (pas: number): boolean => {
    const gardes = colonnes.flatMap((cadres, rang) =>
      rang % pas === 0 ? cadres.map((cadre) => ({ rang, cadre })) : [],
    );
    return gardes.every(({ rang, cadre }, index) =>
      gardes
        .slice(index + 1)
        .every((autre) => autre.rang === rang || !seGenent(cadre, autre.cadre, echelle)),
    );
  };
  return Array.from({ length: colonnes.length }, (_, rang) => rang + 1).find(degage) ?? 1;
}

export function cadresParRang(textes: Iterable<HTMLElement>): Cadre[][] {
  const colonnes: Cadre[][] = [];
  for (const texte of textes) {
    const rang = Number(texte.dataset['rang']);
    colonnes[rang] = [...(colonnes[rang] ?? []), cadreDuTexte(texte)];
  }
  return colonnes;
}

export function cadreFixe({ left, right, top, bottom }: Cadre): Cadre {
  return { left, right, top, bottom };
}

export function touchent(valeur: Cadre, forme: Cadre, echelle: number): boolean {
  const ecart = ECART_AUX_FORMES_PX * echelle;
  return seRecouvrent(valeur, forme, ecart, ecart);
}

export function cotesDuPoint(
  valeur: HTMLElement,
  point: Cadre | undefined,
  dessous: boolean,
): Cadre[] {
  const ici = cadreFixe(cadreDuTexte(valeur));
  if (point === undefined) {
    return [ici];
  }
  const boite = valeur.getBoundingClientRect();
  const decalage = point.top + point.bottom - boite.top - boite.bottom;
  const enFace = { ...ici, top: ici.top + decalage, bottom: ici.bottom + decalage };
  const placeeDessous = boite.top + boite.bottom > point.top + point.bottom;
  return placeeDessous === dessous ? [ici, enFace] : [enFace, ici];
}
