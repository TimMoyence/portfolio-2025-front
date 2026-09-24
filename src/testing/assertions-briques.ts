import { ROLES_DE_MONTAGE } from './briques-montees';
import { classesEmises, classesOrphelines } from './classes-briques';
import type { TracesEffets } from './effets-briques';

export function attendreAucunEffet(traces: TracesEffets): void {
  expect(traces.evenements).toEqual([]);
  expect(traces.ecritures).toEqual([]);
}

export function parcourirLesRolesSansEffet(hote: HTMLElement, traces: TracesEffets): void {
  for (const role of ROLES_DE_MONTAGE) {
    hote.setAttribute('data-cours-role', role);
  }
  attendreAucunEffet(traces);
}

export function attendreSansModaliteNiDuree(
  hote: HTMLElement,
  repere: (nom: 'modalite' | 'duree') => Element | null | undefined,
): void {
  for (const role of ROLES_DE_MONTAGE) {
    hote.setAttribute('data-cours-role', role);
    expect(repere('modalite')).withContext(role).toBeNull();
    expect(repere('duree')).withContext(role).toBeNull();
  }
}

export function attendreChaqueClasseCouverte(
  hote: HTMLElement,
  brique: string,
  minimum: number,
): void {
  expect(classesEmises(hote).size).toBeGreaterThanOrEqual(minimum);
  expect(classesOrphelines(hote, brique)).toEqual([]);
}

export function attendreLaCorrectionNicheeEffacee<T extends { metadonnees: object }>(
  piege: T,
  poser: (contamine: T) => unknown,
): void {
  const contamine = { ...piege, metadonnees: { ...piege.metadonnees, bonneReponse: 'a' } };
  expect(JSON.stringify(poser(contamine))).not.toContain('bonneReponse');
}

export function attendreLaMemeTypographieAuPresentateur(
  hote: HTMLElement,
  enonce: () => Element | null | undefined,
): void {
  const racine = (): Element | null | undefined => hote.shadowRoot?.querySelector('.fp-root');
  const etudiant = racine()?.innerHTML;
  expect(enonce()?.classList.contains('fp-enonce')).toBe(true);
  hote.setAttribute('data-cours-role', 'presentateur');
  expect(enonce()?.classList.contains('fp-enonce')).toBe(true);
  expect(racine()?.getAttribute('data-role')).toBe('presentateur');
  expect(racine()?.innerHTML).toBe(etudiant);
}

export function attendreUneRegionLive(hote: HTMLElement): void {
  expect(hote.shadowRoot?.querySelector('[aria-live="polite"]')).toBeTruthy();
  expect(hote.shadowRoot?.querySelector('fieldset')).toBeTruthy();
}

export function attendreLeRenduEchappe(hote: HTMLElement): void {
  const rendu = hote.shadowRoot?.innerHTML ?? '';
  expect(rendu).not.toContain('<img src=x');
  expect(rendu).toContain('&lt;img');
  expect(hote.shadowRoot?.querySelector('img')).toBeNull();
}
