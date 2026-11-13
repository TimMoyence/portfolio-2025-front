import { installerLaFeuille } from '../../../../testing/briques/feuille';
import type { FpSheet } from '../activites/FpSheet';

const FORMULE = '=A3*B3';
const MILIEU = 4;
const CELLULE_C3 = '[data-testid="cellule"][data-nom="C3"]';
const BARRE = '[data-testid="barre"]';

function champ(hote: FpSheet, selecteur: string): HTMLInputElement {
  const trouve = hote.shadowRoot?.querySelector<HTMLInputElement>(selecteur);
  if (!(trouve instanceof HTMLInputElement)) {
    throw new Error(`aucun champ ${selecteur}`);
  }
  return trouve;
}

function taperAuMilieuDe(hote: FpSheet, selecteur: string): void {
  champ(hote, CELLULE_C3).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  const saisie = champ(hote, selecteur);
  saisie.focus();
  saisie.value = FORMULE;
  saisie.setSelectionRange(MILIEU, MILIEU);
  saisie.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('FpSheet · curseur de saisie', () => {
  let hote: FpSheet;
  installerLaFeuille((feuille) => (hote = feuille));

  for (const [lieu, selecteur] of [
    ['cellule', CELLULE_C3],
    ['barre', BARRE],
  ] as const) {
    it(`TAB-01 · garde le curseur où l étudiant tape au milieu d une formule, dans la ${lieu}`, () => {
      taperAuMilieuDe(hote, selecteur);

      expect(hote.shadowRoot?.activeElement).toBe(champ(hote, selecteur));
      expect(champ(hote, selecteur).value).toBe(FORMULE);
      expect(champ(hote, selecteur).selectionStart).toBe(MILIEU);
    });
  }

  it('TAB-01 · pose le curseur en fin de formule dans la cellule qu on rejoint', () => {
    taperAuMilieuDe(hote, CELLULE_C3);
    champ(hote, CELLULE_C3).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );

    champ(hote, CELLULE_C3).dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    expect(hote.shadowRoot?.activeElement).toBe(champ(hote, CELLULE_C3));
    expect(champ(hote, CELLULE_C3).selectionStart).toBe(FORMULE.length);
  });
});
