import type { Locator } from '@playwright/test';

const PX_PAR_MM = 96 / 25.4;

const PT_PAR_PX = 72 / 96;

export const MARGE_PX = 45;

const A4_PX = { largeur: 210 * PX_PAR_MM, hauteur: 297 * PX_PAR_MM } as const;

const LARGEUR_UTILE_EXACTE_PX = A4_PX.largeur - 2 * MARGE_PX;

const HAUTEUR_UTILE_EXACTE_PX = A4_PX.hauteur - 2 * MARGE_PX;

export const LARGEUR_UTILE_PX = Math.floor(LARGEUR_UTILE_EXACTE_PX);

export const HAUTEUR_UTILE_PX = Math.floor(HAUTEUR_UTILE_EXACTE_PX);

export const LARGEUR_MAXIMALE_REDUITE_PAR_WEBKIT_PX = 2 * LARGEUR_UTILE_EXACTE_PX * PT_PAR_PX;

export const LARGEUR_IMPRIMEE_PX = Math.round(275.28 * PX_PAR_MM);

export function hauteurDePageA(largeurDeMiseEnPage: number): number {
  return Math.floor((HAUTEUR_UTILE_EXACTE_PX / LARGEUR_UTILE_EXACTE_PX) * largeurDeMiseEnPage);
}

interface HauteurDEcran {
  readonly ecran: string;
  readonly hauteur: number;
}

export function hauteursDesEcrans(sections: Locator): Promise<HauteurDEcran[]> {
  return sections.evaluateAll((elements) =>
    elements.map((section) => {
      const blocsInsecables = section.classList.contains('livret__page--scindable')
        ? [
            ...section.querySelectorAll(
              ':scope > app-slide-activity, :scope > .livret__formateur > *',
            ),
          ]
        : [section];
      const hauteurAvecSesMarges = (bloc: Element): number => {
        const { marginBlockStart, marginBlockEnd } = getComputedStyle(bloc);
        return (
          bloc.getBoundingClientRect().height +
          parseFloat(marginBlockStart) +
          parseFloat(marginBlockEnd)
        );
      };
      return {
        ecran: section.getAttribute('data-ecran') ?? '',
        hauteur: Math.ceil(Math.max(...blocsInsecables.map(hauteurAvecSesMarges))),
      };
    }),
  );
}

export function lesPlusHautes(ecrans: readonly HauteurDEcran[], nombre = 3): string {
  return [...ecrans]
    .sort((a, b) => b.hauteur - a.hauteur)
    .slice(0, nombre)
    .map(({ ecran, hauteur }) => `${ecran} ${hauteur} px`)
    .join(', ');
}
