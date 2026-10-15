export function valeursSurUneForme(racine: Element): readonly string[] {
  const ECART_VISIBLE_PX = 2;
  const FORMES = '.slide-chart__bar, .slide-chart__marqueur--barre, .slide-chart__point';
  const VALEURS = '.slide-chart__value, .slide-chart__point-value';

  interface Cadre {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  }

  const zones: Element[] = [];
  const parcourir = (noeud: ParentNode): void => {
    zones.push(...noeud.querySelectorAll('.slide-chart__zone'));
    for (const element of noeud.querySelectorAll('*')) {
      if (element.shadowRoot !== null) {
        parcourir(element.shadowRoot);
      }
    }
  };
  if (racine.matches('.slide-chart__zone')) {
    zones.push(racine);
  }
  parcourir(racine);

  const cadreDuTexte = (texte: Element): Cadre => {
    const plage = document.createRange();
    plage.selectNodeContents(texte);
    return plage.getBoundingClientRect();
  };

  const cadreDeLaForme = (forme: HTMLElement): Cadre => {
    const socle = forme.parentElement;
    if (!forme.classList.contains('slide-chart__bar') || socle === null) {
      return forme.getBoundingClientRect();
    }
    const boite = socle.getBoundingClientRect();
    const echelle = socle.offsetHeight > 0 ? boite.height / socle.offsetHeight : 1;
    return {
      left: boite.left,
      right: boite.right,
      top: boite.bottom - forme.offsetHeight * echelle,
      bottom: boite.bottom,
    };
  };

  const touche = (valeur: Cadre, forme: Cadre): boolean =>
    Math.min(valeur.right, forme.right) - Math.max(valeur.left, forme.left) > -ECART_VISIBLE_PX &&
    Math.min(valeur.bottom, forme.bottom) - Math.max(valeur.top, forme.top) > -ECART_VISIBLE_PX;

  const nomDe = (forme: Element): string =>
    [...forme.classList]
      .filter((classe) => classe !== 'slide-chart__marqueur' && classe !== 'is-visible')
      .join(' ')
      .replace(/slide-chart__/g, '');

  const propresA = (valeur: Element): readonly Element[] => {
    const socle = valeur.closest('.slide-chart__bar-wrap');
    if (socle !== null) {
      return [...socle.querySelectorAll(FORMES)];
    }
    const point = valeur.previousElementSibling;
    return point?.matches('.slide-chart__point') === true ? [point] : [];
  };

  return zones.flatMap((zone) => {
    const formes = [...zone.querySelectorAll<HTMLElement>(FORMES)].map((forme) => ({
      forme,
      cadre: cadreDeLaForme(forme),
    }));
    return [...zone.querySelectorAll(VALEURS)]
      .filter((valeur) => valeur.checkVisibility({ visibilityProperty: true }))
      .flatMap((valeur) => {
        const cadre = cadreDuTexte(valeur);
        const propres = propresA(valeur);
        return formes
          .filter(({ forme }) => !propres.includes(forme))
          .filter((forme) => touche(cadre, forme.cadre))
          .map(({ forme }) => `${valeur.textContent?.trim() ?? ''} › ${nomDe(forme)}`);
      });
  });
}
