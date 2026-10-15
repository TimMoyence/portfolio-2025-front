import type { EcranContent, PilotageEcran } from '../cours/content/types';

export type Jonctions = 'bout-a-bout' | 'toutes';

interface LigneDeTexte {
  readonly rang: number;
  readonly cadre: DOMRect;
}

export function libellesColles(racine: Node, jonctions: Jonctions = 'toutes'): readonly string[] {
  const ECART_VISIBLE_PX = 2;
  const CHEVAUCHEMENT_TOLERE_PX = 1;
  const FIN_DE_MOT = /[\p{L}\p{N}:%)»]$/u;
  const DEBUT_DE_MOT = /^[\p{L}\p{N}(«€]/u;

  const plageDe = (noeud: Text, debut = 0, fin = noeud.length): Range => {
    const plage = document.createRange();
    plage.setStart(noeud, debut);
    plage.setEnd(noeud, fin);
    return plage;
  };

  const cadreDe = (noeud: Text, debut: number, fin: number): DOMRect | null => {
    const cadre = plageDe(noeud, debut, fin).getBoundingClientRect();
    return cadre.width === 0 && cadre.height === 0 ? null : cadre;
  };

  const parentDe = (element: Element): Element | null => {
    const hote = element.parentNode;
    return hote instanceof ShadowRoot ? hote.host : element.parentElement;
  };

  const vu = (noeud: Text): boolean => {
    const parent = noeud.parentElement;
    if (
      parent === null ||
      !parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    ) {
      return false;
    }
    for (let element: Element | null = parent; element !== null; element = parentDe(element)) {
      const style = getComputedStyle(element);
      if (
        style.getPropertyValue('clip') !== 'auto' ||
        style.getPropertyValue('clip-path') !== 'none'
      ) {
        return false;
      }
    }
    return true;
  };

  const textes: Text[] = [];
  const parcourir = (noeud: Node): void => {
    for (const enfant of noeud.childNodes) {
      if (enfant instanceof Text) {
        if (enfant.data.trim() !== '' && cadreDe(enfant, 0, enfant.length) !== null && vu(enfant)) {
          textes.push(enfant);
        }
      } else if (enfant instanceof Element) {
        if (enfant.shadowRoot !== null) {
          parcourir(enfant.shadowRoot);
        }
        parcourir(enfant);
      }
    }
  };
  parcourir(racine);

  const rogneursDe = (noeud: Text): readonly Element[] => {
    const rogneurs: Element[] = [];
    let positionDuContenu = 'static';
    for (
      let element: Element | null = noeud.parentElement;
      element !== null;
      element = parentDe(element)
    ) {
      const style = getComputedStyle(element);
      const transforme = style.transform !== 'none';
      const contient =
        positionDuContenu === 'fixed'
          ? transforme
          : positionDuContenu !== 'absolute' || style.position !== 'static' || transforme;
      if (contient) {
        if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
          rogneurs.push(element);
        }
        positionDuContenu = style.position;
      }
    }
    return rogneurs;
  };
  const rogneurs = textes.map(rogneursDe);

  const echelleDe = (noeud: Text): number => {
    let echelle = 1;
    for (
      let element: Element | null = noeud.parentElement;
      element !== null;
      element = parentDe(element)
    ) {
      const { transform } = getComputedStyle(element);
      if (transform !== 'none') {
        const matrice = new DOMMatrixReadOnly(transform);
        echelle *= Math.hypot(matrice.a, matrice.b);
      }
    }
    return echelle;
  };
  const echelles = textes.map(echelleDe);

  const seuil = (pixels: number, rang: number, autreRang: number): number =>
    pixels * Math.max(echelles[rang], echelles[autreRang]);

  const propres = (rang: number, autreRang: number): readonly Element[] =>
    rogneurs[rang].filter((element) => !rogneurs[autreRang].includes(element));

  const boiteQuiRogne = (element: Element): DOMRect => {
    const boite = element.getBoundingClientRect();
    if (
      !(element instanceof HTMLElement) ||
      element.offsetWidth === 0 ||
      element.offsetHeight === 0
    ) {
      return boite;
    }
    const echelleX = boite.width / element.offsetWidth;
    const echelleY = boite.height / element.offsetHeight;
    return new DOMRect(
      boite.left + element.clientLeft * echelleX,
      boite.top + element.clientTop * echelleY,
      element.clientWidth * echelleX,
      element.clientHeight * echelleY,
    );
  };

  const rogne = (cadre: DOMRect, elements: readonly Element[]): DOMRect | null => {
    let { left, top, right, bottom } = cadre;
    for (const element of elements) {
      const boite = boiteQuiRogne(element);
      left = Math.max(left, boite.left);
      top = Math.max(top, boite.top);
      right = Math.min(right, boite.right);
      bottom = Math.min(bottom, boite.bottom);
    }
    return right > left && bottom > top ? new DOMRect(left, top, right - left, bottom - top) : null;
  };

  const recouvrementVertical = (haut: DOMRect, bas: DOMRect): number =>
    Math.min(haut.bottom, bas.bottom) - Math.max(haut.top, bas.top);

  const surLaMemeLigne = (gauche: DOMRect, droite: DOMRect): boolean =>
    recouvrementVertical(gauche, droite) > Math.min(gauche.height, droite.height) / 2;

  const etiquette = (rang: number): boolean => {
    const parent = textes[rang].parentElement;
    return parent !== null && getComputedStyle(parent).position === 'absolute';
  };

  const empilees = (une: LigneDeTexte, autre: LigneDeTexte): boolean =>
    etiquette(une.rang) &&
    etiquette(autre.rang) &&
    -recouvrementVertical(une.cadre, autre.cadre) < seuil(ECART_VISIBLE_PX, une.rang, autre.rang);

  const collesBoutABout = (gauche: number, droite: number): boolean => {
    const avant = textes[gauche].data;
    const apres = textes[droite].data;
    if (!FIN_DE_MOT.test(avant) || !DEBUT_DE_MOT.test(apres)) {
      return false;
    }
    const fin = cadreDe(textes[gauche], avant.length - 1, avant.length);
    const debut = cadreDe(textes[droite], 0, 1);
    return (
      fin !== null &&
      debut !== null &&
      surLaMemeLigne(fin, debut) &&
      Math.max(debut.left - fin.right, fin.left - debut.right) <
        seuil(ECART_VISIBLE_PX, gauche, droite) &&
      rogne(fin, propres(gauche, droite)) !== null &&
      rogne(debut, propres(droite, gauche)) !== null
    );
  };

  const lignes: LigneDeTexte[] = textes
    .flatMap((noeud, rang) =>
      [...plageDe(noeud).getClientRects()]
        .filter(({ width, height }) => width > 0 && height > 0)
        .map((cadre) => ({ rang, cadre })),
    )
    .sort((une, autre) => une.cadre.top - autre.cadre.top);

  const seChevauchent = (ligne: LigneDeTexte, autre: LigneDeTexte): boolean => {
    const { rang, cadre } = ligne;
    const tolere = seuil(CHEVAUCHEMENT_TOLERE_PX, rang, autre.rang);
    if (
      !(surLaMemeLigne(cadre, autre.cadre) || empilees(ligne, autre)) ||
      Math.min(cadre.right, autre.cadre.right) - Math.max(cadre.left, autre.cadre.left) <= tolere
    ) {
      return false;
    }
    const gauche = Math.max(cadre.left, autre.cadre.left);
    const haut = Math.max(cadre.top, autre.cadre.top);
    const bas = Math.min(cadre.bottom, autre.cadre.bottom);
    const contact = new DOMRect(
      gauche,
      Math.min(haut, bas),
      Math.min(cadre.right, autre.cadre.right) - gauche,
      Math.max(1, Math.abs(bas - haut)),
    );
    const vu = rogne(contact, [...propres(rang, autre.rang), ...propres(autre.rang, rang)]);
    return vu !== null && vu.width > tolere;
  };

  const chevauches =
    jonctions === 'bout-a-bout'
      ? []
      : lignes.flatMap((ligne, index) =>
          lignes
            .slice(index + 1)
            .filter(
              (autre) =>
                autre.cadre.top <
                ligne.cadre.bottom + seuil(ECART_VISIBLE_PX, ligne.rang, autre.rang),
            )
            .filter((autre) => autre.rang !== ligne.rang && seChevauchent(ligne, autre))
            .map(
              (autre) =>
                [Math.min(ligne.rang, autre.rang), Math.max(ligne.rang, autre.rang)] as const,
            ),
        );

  const paires = new Map<string, readonly [number, number]>();
  for (const paire of [
    ...textes
      .slice(1)
      .flatMap((_, rang) => (collesBoutABout(rang, rang + 1) ? [[rang, rang + 1] as const] : [])),
    ...chevauches,
  ]) {
    paires.set(paire.join(':'), paire);
  }
  return [...paires.values()]
    .sort(([gauche, droite], [autreGauche, autreDroite]) =>
      gauche === autreGauche ? droite - autreDroite : gauche - autreGauche,
    )
    .map(
      ([gauche, droite]) =>
        `${textes[gauche].data.trim().slice(-24)}|${textes[droite].data.trim().slice(0, 24)}`,
    );
}

const PILOTAGE_REVELE: PilotageEcran = {
  phase: 'revele',
  revele: true,
  resultatsProjetes: true,
  optionsAffichees: true,
};

export interface LectureDesLibelles {
  readonly colles: readonly string[];
  readonly vuesAbsentes: readonly string[];
}

export function lireLesLibelles(
  racine: HTMLElement,
  vues: readonly string[],
  jonctions: Jonctions = 'toutes',
): LectureDesLibelles {
  return {
    colles: libellesColles(racine, jonctions),
    vuesAbsentes: vues.filter((vue) => racine.querySelector(`[data-testid="${vue}"]`) === null),
  };
}

export async function lireLesLibellesDeChaqueEcran(
  racine: HTMLElement,
  ecrans: readonly Pick<EcranContent, 'id'>[],
  afficher: (rang: number, pilotage: Readonly<Record<string, PilotageEcran>>) => Promise<void>,
  vues: readonly string[],
  jonctions: Jonctions = 'toutes',
): Promise<LectureDesLibelles> {
  const colles: string[] = [];
  let vuesAbsentes = vues;
  for (const [rang, ecran] of ecrans.entries()) {
    for (const pilotage of [{}, { [ecran.id]: PILOTAGE_REVELE }]) {
      await afficher(rang, pilotage);
      const lecture = lireLesLibelles(racine, vuesAbsentes, jonctions);
      colles.push(...lecture.colles.map((jonction) => `${ecran.id} ${jonction}`));
      vuesAbsentes = lecture.vuesAbsentes;
    }
  }
  return { colles, vuesAbsentes };
}
