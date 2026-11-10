import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  buildEditionMorningBrief,
  buildEditionRefondue,
} from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';

const CLE_DE_LA_VUE = 'mb.vue-de-lecture';

const capotsOuverts = (page: HTMLElement): boolean[] =>
  Array.from(page.querySelectorAll<HTMLDetailsElement>('details.info__capot')).map(
    (capot) => capot.open,
  );

const bouton = (page: HTMLElement, libelle: string): HTMLButtonElement | undefined =>
  Array.from(page.querySelectorAll<HTMLButtonElement>('.lecture button')).find(
    (candidat) => texteDe(candidat) === libelle,
  );

describe('L’interrupteur de lecture d’une édition', () => {
  beforeAll(() => registerLocaleData(localeFr));
  afterEach(() => localStorage.removeItem(CLE_DE_LA_VUE));

  it('MB-12 · lit en vue Essentiel par défaut, déplie tout sous le capot, et retient ce choix', async () => {
    const page = rendreLaFiche(buildEditionRefondue());

    expect(textes(page, '.lecture button')).toEqual(['Essentiel', 'Sous le capot']);
    expect(bouton(page, 'Essentiel')?.getAttribute('aria-pressed')).toBe('true');
    expect(capotsOuverts(page)).toEqual([false]);

    bouton(page, 'Sous le capot')?.click();
    await new Promise((resolve) => setTimeout(resolve));

    expect(bouton(page, 'Sous le capot')?.getAttribute('aria-pressed')).toBe('true');
    expect(capotsOuverts(page)).toEqual([true]);
    expect(localStorage.getItem(CLE_DE_LA_VUE)).toBe('"capot"');
  });

  it('MB-12 · rouvre une édition dans la vue retenue', () => {
    localStorage.setItem(CLE_DE_LA_VUE, '"capot"');

    expect(capotsOuverts(rendreLaFiche(buildEditionRefondue()))).toEqual([true]);
  });

  it('MB-12 · n’affiche aucun interrupteur sur une édition sans sous le capot', () => {
    const page = rendreLaFiche(buildEditionMorningBrief());

    expect(page.querySelector('.lecture')).toBeNull();
    expect(page.querySelector('h1')).not.toBeNull();
  });
});
