import {
  attendreAucunEffet,
  attendreChaqueClasseCouverte,
  attendreLaCorrectionNicheeEffacee,
} from './assertions-briques';
import { detailsEmis, noeudOmbre, noeudsOmbre } from './banc-de-brique';
import type { TracesEffets } from './effets-briques';

const DUREE_DE_TROIS_ETATS_MS = 6000;

export interface BriqueReglable<D> extends HTMLElement {
  definition: D | null;
}

export interface SobrieteDeBrique<D> {
  readonly hote: () => BriqueReglable<D>;
  readonly traces: TracesEffets;
  readonly piege: D;
  readonly brique: string;
  readonly classes: number;
}

function parametre(hote: HTMLElement, repere: string, cle: string): HTMLElement {
  const trouve = hote.shadowRoot?.querySelector<HTMLElement>(
    `[data-testid="${repere}"][data-cle="${cle}"]`,
  );
  if (trouve === null || trouve === undefined) {
    throw new Error(`aucun ${repere} pour ${cle}`);
  }
  return trouve;
}

export function animer(hote: HTMLElement): void {
  const bouton = noeudOmbre(hote, 'animer');
  if (!(bouton instanceof HTMLButtonElement)) {
    throw new Error('aucun bouton d animation');
  }
  bouton.click();
}

export function glisserCurseur(hote: HTMLElement, cle: string, valeur: string): HTMLInputElement {
  const curseur = parametre(hote, 'curseur', cle);
  if (!(curseur instanceof HTMLInputElement)) {
    throw new Error(`le curseur ${cle} n est pas un champ`);
  }
  curseur.value = valeur;
  curseur.dispatchEvent(new Event('input', { bubbles: true }));
  return curseur;
}

export function relacherCurseur(hote: HTMLElement, cle: string, valeur: string): void {
  glisserCurseur(hote, cle, valeur).dispatchEvent(new Event('change', { bubbles: true }));
}

export function emisAuPupitre(hote: HTMLElement, evenement: string, geste: () => void): unknown[] {
  hote.setAttribute('data-cours-role', 'presentateur');
  const emis = detailsEmis(hote, evenement);
  geste();
  return emis;
}

export function jouerAuPupitre(hote: HTMLElement, evenement: string): unknown[] {
  return emisAuPupitre(hote, evenement, () => {
    animer(hote);
    jasmine.clock().tick(DUREE_DE_TROIS_ETATS_MS);
  });
}

export function attendreParametresAnnonces(hote: HTMLElement, cle: string, annonce: string): void {
  for (const valeur of noeudsOmbre(hote, 'valeur')) {
    const enonce = valeur.getAttribute('aria-label') ?? '';
    expect(enonce).not.toMatch(/^[\s\d,.]*$/);
    expect(enonce).toContain(' : ');
  }
  expect(parametre(hote, 'valeur', cle).getAttribute('aria-label')).toBe(annonce);
  expect(parametre(hote, 'curseur', cle).getAttribute('aria-label')).toBe(annonce);
}

export function attendreLeParametreEchappe(hote: HTMLElement, cle: string, charge: string): void {
  expect(hote.shadowRoot?.querySelector('img')).toBeNull();
  expect(parametre(hote, 'valeur', cle).getAttribute('aria-label')).toContain(charge);
  expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
}

export function decrireLaSobrieteDUneBriqueReglable<D extends { metadonnees: object }>(
  sobriete: SobrieteDeBrique<D>,
): void {
  it('efface une donnee de correction nichee dans les metadonnees', () => {
    attendreLaCorrectionNicheeEffacee(sobriete.piege, (contamine) => {
      const hote = sobriete.hote();
      hote.definition = contamine;
      return hote.definition;
    });
  });

  it('explore sans rien emettre vers la seance ni ecrire dans un stockage', () => {
    animer(sobriete.hote());
    attendreAucunEffet(sobriete.traces);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    attendreChaqueClasseCouverte(sobriete.hote(), sobriete.brique, sobriete.classes);
  });
}
