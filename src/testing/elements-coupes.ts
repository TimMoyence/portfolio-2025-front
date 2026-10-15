export function elementsCoupes(racine: Element, limite: Element): string[] {
  return [...racine.querySelectorAll<HTMLElement>('*')].flatMap((element) => {
    const coupe = peint(element) ? coupeDe(element, limite) : null;
    return coupe === null
      ? []
      : [`${element.tagName.toLowerCase()} « ${texteDe(element)} » coupé ${coupe}`];
  });
}

function peint(element: HTMLElement): boolean {
  if (!element.checkVisibility({ visibilityProperty: true, opacityProperty: true })) {
    return false;
  }
  if (element.matches('svg, img, canvas, input, textarea, select, button')) {
    return true;
  }
  if (
    [...element.childNodes].some((noeud) => noeud.nodeType === Node.TEXT_NODE && texteDe(noeud))
  ) {
    return true;
  }
  const style = getComputedStyle(element);
  return (
    style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
    style.backgroundImage !== 'none' ||
    ['top', 'right', 'bottom', 'left'].some(
      (cote) =>
        Number.parseFloat(style.getPropertyValue(`border-${cote}-width`)) > 0 &&
        style.getPropertyValue(`border-${cote}-style`) !== 'none',
    )
  );
}

function coupeDe(element: HTMLElement, limite: Element): string | null {
  const bloc = element.getBoundingClientRect();
  if (bloc.width === 0 || bloc.height === 0) {
    return null;
  }
  let suivre = { largeur: true, hauteur: true };
  for (let ancetre = element.parentElement; ancetre !== null; ancetre = ancetre.parentElement) {
    const style = getComputedStyle(ancetre);
    const boite = ancetre.getBoundingClientRect();
    const enLargeur = Math.max(boite.left - bloc.left, bloc.right - boite.right);
    const enHauteur = Math.max(boite.top - bloc.top, bloc.bottom - boite.bottom);
    if (suivre.largeur && rogne(style.overflowX, ancetre, limite) && enLargeur > 1) {
      return `de ${Math.round(enLargeur)} px en largeur par ${nomDe(ancetre)}`;
    }
    if (suivre.hauteur && rogne(style.overflowY, ancetre, limite) && enHauteur > 1) {
      return `de ${Math.round(enHauteur)} px en hauteur par ${nomDe(ancetre)}`;
    }
    if (ancetre === limite) {
      return null;
    }
    suivre = {
      largeur: suivre.largeur && !defile(style.overflowX),
      hauteur: suivre.hauteur && !defile(style.overflowY),
    };
  }
  return null;
}

function rogne(debordement: string, ancetre: Element, limite: Element): boolean {
  return ancetre === limite || debordement === 'hidden' || debordement === 'clip';
}

function defile(debordement: string): boolean {
  return debordement === 'auto' || debordement === 'scroll';
}

function nomDe(element: Element): string {
  return [element.tagName.toLowerCase(), ...element.classList].join('.');
}

function texteDe(noeud: Node): string {
  return (noeud.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
}
