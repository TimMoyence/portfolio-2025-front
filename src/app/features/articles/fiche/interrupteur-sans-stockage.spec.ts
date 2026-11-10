import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildEditionRefondue } from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe } from '../../../../testing/texte/textes-dom';

const CLE_DE_LA_VUE = 'mb.vue-de-lecture';

describe('L’interrupteur de lecture sans stockage fiable', () => {
  beforeAll(() => registerLocaleData(localeFr));
  afterEach(() => localStorage.removeItem(CLE_DE_LA_VUE));

  it('MB-12 · bascule sous le capot sans erreur quand le navigateur refuse d’écrire', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
    const page = rendreLaFiche(buildEditionRefondue());
    const erreurs = spyOn(TestBed.inject(ErrorHandler), 'handleError');
    const capot = Array.from(page.querySelectorAll<HTMLButtonElement>('.lecture button')).find(
      (bouton) => texteDe(bouton) === 'Sous le capot',
    );

    capot?.click();
    await new Promise((resolve) => setTimeout(resolve));

    expect(erreurs).not.toHaveBeenCalled();
    expect(capot?.getAttribute('aria-pressed')).toBe('true');
  });

  it('MB-12 · ouvre en vue Essentiel quand la valeur retenue est inconnue', () => {
    localStorage.setItem(CLE_DE_LA_VUE, '"tech"');
    const page = rendreLaFiche(buildEditionRefondue());

    expect(
      Array.from(page.querySelectorAll<HTMLDetailsElement>('details.info__capot')).map(
        (capot) => capot.open,
      ),
    ).toEqual([false]);
    expect(
      Array.from(page.querySelectorAll<HTMLButtonElement>('.lecture button')).map((bouton) => [
        texteDe(bouton),
        bouton.getAttribute('aria-pressed'),
      ]),
    ).toEqual([
      ['Essentiel', 'true'],
      ['Sous le capot', 'false'],
    ]);
  });
});
