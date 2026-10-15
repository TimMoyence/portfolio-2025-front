import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';

const PAS_DE_RECHERCHE = 7;

export function reductionPourTenir(place: number, contenu: number): number | null {
  return contenu <= place + 1 ? null : place / contenu;
}

function hauteur(element: Element): number {
  return element.getBoundingClientRect().height;
}

function reduire(contenu: HTMLElement, echelle: number): void {
  const reduit = echelle !== 1;
  contenu.style.inlineSize = reduit ? `${100 / echelle}%` : '';
  contenu.style.transform = reduit ? `scale(${echelle})` : '';
  contenu.style.transformOrigin = reduit ? '0 0' : '';
  contenu.style.marginBlockEnd = reduit ? `${(echelle - 1) * contenu.offsetHeight}px` : '';
}

function tenirDansSaPlace(contenu: HTMLElement): void {
  const place = contenu.parentElement;
  if (place === null) {
    return;
  }
  const reductionALEchelle = (echelle: number): number | null => {
    reduire(contenu, echelle);
    return reductionPourTenir(hauteur(place), hauteur(contenu));
  };
  let tient = 1;
  let deborde = 1;
  for (let pas = 0; pas < PAS_DE_RECHERCHE; pas += 1) {
    const reste = reductionALEchelle(tient);
    if (reste === null) {
      break;
    }
    if (reste <= 0) {
      reduire(contenu, 1);
      return;
    }
    deborde = tient;
    tient *= reste;
  }
  if (tient === 1) {
    return;
  }
  for (let pas = 0; pas < PAS_DE_RECHERCHE; pas += 1) {
    const essai = (tient + deborde) / 2;
    if (reductionALEchelle(essai) === null) {
      tient = essai;
    } else {
      deborde = essai;
    }
  }
  reduire(contenu, tient);
}

@Directive({
  selector: '[appTenirDansSaPlace]',
  standalone: true,
})
export class TenirDansSaPlaceDirective {
  constructor() {
    const contenu = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || typeof ResizeObserver === 'undefined') {
      return;
    }
    let image: number | null = null;
    const observateur = new ResizeObserver(() => {
      image ??= requestAnimationFrame(() => {
        image = null;
        tenirDansSaPlace(contenu);
      });
    });
    afterNextRender(() => {
      observateur.observe(contenu);
      if (contenu.parentElement !== null) {
        observateur.observe(contenu.parentElement);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      observateur.disconnect();
      if (image !== null) {
        cancelAnimationFrame(image);
      }
    });
  }
}
