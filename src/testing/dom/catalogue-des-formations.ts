import type { ComponentFixture } from '@angular/core/testing';
import { INSTANTANES_DES_COURS_SERVIS } from '../fixtures/instantanes-des-cours';

export interface SectionRendue {
  readonly titre: string;
  readonly nombre: number;
  readonly liens: readonly string[];
}

export interface PuceRendue {
  readonly libelle: string;
  readonly nombre: number;
  readonly pressee: boolean;
  readonly desactivee: boolean;
}

const PARCOURS_DU_CODE: Readonly<Record<string, string>> = {
  B1: 'BTS CG 1re année',
  B2: 'BTS CG 2e année',
  B3: 'Bachelor 3',
};

const LIENS_IA_ET_WEB: readonly string[] = [
  '/formations/ia-solopreneurs',
  '/formations/automatiser-avec-ia',
  '/formations/audit-seo-diy',
  '/formations/ia-solopreneurs/toolkit',
];

export const SECTIONS_ATTENDUES: readonly (readonly [string, readonly string[]])[] = [
  ...Object.entries(PARCOURS_DU_CODE).map(
    ([prefixe, titre]): readonly [string, readonly string[]] => [
      titre,
      INSTANTANES_DES_COURS_SERVIS.filter(([code]) => code.startsWith(prefixe)).map(
        ([, instantane]) => `/formations/${instantane.sujet.id}`,
      ),
    ],
  ),
  ['IA & web', LIENS_IA_ET_WEB],
];

const libelleDe = (element: Element): string =>
  Array.from(element.childNodes)
    .filter((noeud) => noeud.nodeType === Node.TEXT_NODE)
    .map((noeud) => noeud.textContent ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

const nombreDe = (element: Element): number =>
  Number(element.querySelector('.nombre')?.textContent?.trim() ?? Number.NaN);

export function champDeRecherche(racine: HTMLElement): HTMLInputElement | null {
  return racine.querySelector('input[type="search"]');
}

export function sectionsRendues(racine: HTMLElement): readonly SectionRendue[] {
  return Array.from(racine.querySelectorAll('section[aria-labelledby]')).map((section) => {
    const titre = section.querySelector('h2');
    return {
      titre: titre ? libelleDe(titre) : '',
      nombre: titre ? nombreDe(titre) : Number.NaN,
      liens: Array.from(section.querySelectorAll('.formation a')).map(
        (lien) => lien.getAttribute('href') ?? '',
      ),
    };
  });
}

export function pucesRendues(racine: HTMLElement): readonly PuceRendue[] {
  return Array.from(racine.querySelectorAll('[role="group"] button')).map((bouton) => ({
    libelle: libelleDe(bouton),
    nombre: nombreDe(bouton),
    pressee: bouton.getAttribute('aria-pressed') === 'true',
    desactivee: (bouton as HTMLButtonElement).disabled,
  }));
}

export function saisir(fixture: ComponentFixture<unknown>, texte: string): void {
  const champ = champDeRecherche(fixture.nativeElement as HTMLElement);
  if (!champ) {
    throw new Error('champ de recherche absent');
  }
  champ.value = texte;
  champ.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

export function cliquerLaPuce(fixture: ComponentFixture<unknown>, libelle: string): void {
  const racine = fixture.nativeElement as HTMLElement;
  const bouton = Array.from(racine.querySelectorAll('[role="group"] button')).find(
    (candidat) => libelleDe(candidat) === libelle,
  );
  if (!(bouton instanceof HTMLButtonElement)) {
    throw new Error(`puce absente : ${libelle}`);
  }
  bouton.click();
  fixture.detectChanges();
}

export function liensAffiches(racine: HTMLElement): readonly string[] {
  return sectionsRendues(racine).flatMap(({ liens }) => liens);
}
